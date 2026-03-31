from datetime import datetime

from fastapi.testclient import TestClient

from app.main import app
from database.database import SessionLocal
from models.transaction import Transaction, TransactionType
from models.user import User
from core.security import get_password_hash

client = TestClient(app)


def _make_user(username: str, email: str, password: str) -> User:
    db = SessionLocal()
    try:
        existing = db.query(User).filter((User.username == username) | (User.email == email)).first()
        if existing:
            return existing

        user = User(
            username=username,
            email=email,
            hashed_password=get_password_hash(password),
            is_active=True,
            subscription="free",
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
    finally:
        db.close()


def _token(username: str, password: str) -> str:
    response = client.post(
        "/auth/login",
        data={"username": username, "password": password},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert response.status_code == 200
    return response.json()["access_token"]


def test_tax_capital_gains_and_form_8949():
    username = "tax_user"
    password = "TaxPass123"
    user = _make_user(username, "tax_user@example.com", password)

    db = SessionLocal()
    try:
        # Avoid duplicates on re-run.
        db.query(Transaction).filter(Transaction.user_id == user.id, Transaction.symbol == "AAPL").delete()
        db.add(
            Transaction(
                user_id=user.id,
                symbol="AAPL",
                transaction_type=TransactionType.BUY,
                quantity=10,
                price_per_share=100,
                total_value=1000,
                transaction_date=datetime(datetime.utcnow().year, 1, 5),
            )
        )
        db.add(
            Transaction(
                user_id=user.id,
                symbol="AAPL",
                transaction_type=TransactionType.SELL,
                quantity=10,
                price_per_share=120,
                total_value=1200,
                transaction_date=datetime(datetime.utcnow().year, 2, 10),
            )
        )
        db.commit()
    finally:
        db.close()

    token = _token(username, password)
    headers = {"Authorization": f"Bearer {token}"}
    year = datetime.utcnow().year

    gains_response = client.get(f"/tax/capital-gains/{year}", headers=headers)
    assert gains_response.status_code == 200
    gains_payload = gains_response.json()
    assert gains_payload["transactions_count"] >= 1
    assert "short_term_gains" in gains_payload

    form_response = client.get(f"/tax/form-8949/{year}", headers=headers)
    assert form_response.status_code == 200
    assert isinstance(form_response.json().get("rows"), list)

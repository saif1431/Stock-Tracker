from datetime import datetime
from models.transaction import Transaction, TransactionType
from models.user import User
from core.security import get_password_hash


def _make_user(db, username: str, email: str, password: str) -> User:
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


def _token(client, username: str, password: str) -> str:
    response = client.post(
        "/auth/login",
        data={"username": username, "password": password},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert response.status_code == 200
    return response.json()["access_token"]


def test_tax_capital_gains_and_form_8949(client, db_session):
    username = "tax_user"
    password = "TaxPass123"
    user = _make_user(db_session, username, "tax_user@example.com", password)

    # With proper isolation (drop_all/create_all), we don't need manual cleanup.
    db_session.add(
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
    db_session.add(
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
    db_session.commit()

    token = _token(client, username, password)
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

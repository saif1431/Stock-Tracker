from fastapi.testclient import TestClient

from app.main import app
from core.security import create_access_token, get_password_hash, verify_password
from database.database import SessionLocal
from models.user import User

client = TestClient(app)


def _upsert_user(username: str, email: str, is_admin: bool) -> User:
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.username == username).first()
        if user:
            user.is_admin = is_admin
            user.is_active = True
            user.is_banned = False
            db.commit()
            db.refresh(user)
            return user

        user = User(
            username=username,
            email=email,
            hashed_password=get_password_hash("AdminPass123"),
            is_active=True,
            is_admin=is_admin,
            subscription="free",
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
    finally:
        db.close()


def test_admin_dashboard_and_ban_user_flow():
    admin_user = _upsert_user("admin_user", "admin_user@example.com", True)
    target_user = _upsert_user("regular_user", "regular_user@example.com", False)

    admin_token = create_access_token(subject=admin_user.username)
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    dashboard = client.get("/admin/dashboard", headers=admin_headers)
    assert dashboard.status_code == 200
    assert "total_users" in dashboard.json()
    assert "api_usage" in dashboard.json()
    assert "system_health" in dashboard.json()

    ban_response = client.post(
        f"/admin/users/{target_user.id}/ban",
        json={"reason": "policy violation"},
        headers=admin_headers,
    )
    assert ban_response.status_code == 200

    unban_response = client.post(f"/admin/users/{target_user.id}/unban", headers=admin_headers)
    assert unban_response.status_code == 200

    reset_response = client.post(
        f"/admin/users/{target_user.id}/reset-password",
        json={"new_password": "UpdatedPass123"},
        headers=admin_headers,
    )
    assert reset_response.status_code == 200

    db = SessionLocal()
    try:
        refreshed = db.query(User).filter(User.id == target_user.id).first()
        assert refreshed is not None
        assert verify_password("UpdatedPass123", refreshed.hashed_password)
    finally:
        db.close()

    deactivate_response = client.post(f"/admin/users/{target_user.id}/deactivate", headers=admin_headers)
    assert deactivate_response.status_code == 200

    reactivate_response = client.post(f"/admin/users/{target_user.id}/reactivate", headers=admin_headers)
    assert reactivate_response.status_code == 200

    users_search = client.get("/admin/users?search=regular_user", headers=admin_headers)
    assert users_search.status_code == 200
    assert any(u["username"] == "regular_user" for u in users_search.json())

    logs_filtered = client.get("/admin/logs?action=ban_user", headers=admin_headers)
    assert logs_filtered.status_code == 200

    logs_export = client.get("/admin/logs/export?limit=50", headers=admin_headers)
    assert logs_export.status_code == 200
    assert logs_export.headers.get("content-type", "").startswith("text/csv")

    non_admin_token = create_access_token(subject=target_user.username)
    forbidden = client.get("/admin/dashboard", headers={"Authorization": f"Bearer {non_admin_token}"})
    assert forbidden.status_code == 403

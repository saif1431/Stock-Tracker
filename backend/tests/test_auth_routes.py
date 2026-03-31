from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_register_and_login_flow():
    username = "test_auth_user"
    email = "test_auth_user@example.com"
    password = "TestPass123"

    register_response = client.post(
        "/auth/register",
        json={"username": username, "email": email, "password": password},
    )

    # If the test user already exists from prior runs, registration can return 400.
    assert register_response.status_code in {201, 400}

    login_response = client.post(
        "/auth/login",
        data={"username": username, "password": password},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )

    assert login_response.status_code == 200
    payload = login_response.json()
    assert "access_token" in payload
    assert payload.get("token_type") == "bearer"

import uuid
import pyotp


def _register_and_login(client) -> tuple[str, str, str]:
    suffix = uuid.uuid4().hex[:8]
    username = f"twofa_{suffix}"
    email = f"twofa_{suffix}@example.com"
    password = "TwoFaPass123"

    register = client.post("/auth/register", json={"username": username, "email": email, "password": password})
    assert register.status_code == 201

    login = client.post(
        "/auth/login",
        data={"username": username, "password": password},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert login.status_code == 200
    return username, password, login.json()["access_token"]


def test_enable_and_use_two_fa_login(client):
    username, password, token = _register_and_login(client)
    headers = {"Authorization": f"Bearer {token}"}

    setup = client.post("/auth/2fa/setup", headers=headers)
    assert setup.status_code == 200
    setup_payload = setup.json()
    secret = setup_payload["secret"]

    totp_token = pyotp.TOTP(secret).now()
    enable = client.post("/auth/2fa/enable", json={"secret": secret, "token": totp_token}, headers=headers)
    assert enable.status_code == 200

    missing_token_login = client.post(
        "/auth/login",
        data={"username": username, "password": password},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert missing_token_login.status_code == 401

    login_with_token = client.post(
        "/auth/login",
        data={"username": username, "password": password, "two_fa_token": pyotp.TOTP(secret).now()},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert login_with_token.status_code == 200
    assert "access_token" in login_with_token.json()

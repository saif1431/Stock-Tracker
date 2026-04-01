import uuid
from core.rate_limit import LimitConfig, RATE_LIMITS, reset_rate_limit_state


def _register_and_login(client) -> str:
    suffix = uuid.uuid4().hex[:8]
    username = f"ratelimit_{suffix}"
    email = f"ratelimit_{suffix}@example.com"
    password = "RateLimitPass123"

    register = client.post("/auth/register", json={"username": username, "email": email, "password": password})
    assert register.status_code == 201

    login = client.post(
        "/auth/login",
        data={"username": username, "password": password},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert login.status_code == 200
    return login.json()["access_token"]


def test_rate_limit_headers_and_429_response(client):
    token = _register_and_login(client)
    headers = {"Authorization": f"Bearer {token}"}

    original = RATE_LIMITS["free"]
    RATE_LIMITS["free"] = LimitConfig(minute=2, hour=20)
    reset_rate_limit_state()

    try:
        r1 = client.get("/auth/me", headers=headers)
        assert r1.status_code == 200
        assert "X-RateLimit-Limit-Minute" in r1.headers

        r2 = client.get("/auth/me", headers=headers)
        assert r2.status_code == 200

        r3 = client.get("/auth/me", headers=headers)
        assert r3.status_code == 429
        assert r3.json().get("error") == "Rate limit exceeded"
    finally:
        RATE_LIMITS["free"] = original
        reset_rate_limit_state()

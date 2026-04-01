import uuid


def test_rate_limit_metrics_endpoint(client):
    suffix = uuid.uuid4().hex[:8]
    username = f"metrics_{suffix}"
    email = f"metrics_{suffix}@example.com"
    password = "MetricsPass123"

    register = client.post("/auth/register", json={"username": username, "email": email, "password": password})
    assert register.status_code == 201

    login = client.post(
        "/auth/login",
        data={"username": username, "password": password},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert login.status_code == 200

    token = login.json()["access_token"]
    metrics = client.get("/metrics/rate-limit", headers={"Authorization": f"Bearer {token}"})
    assert metrics.status_code == 200
    payload = metrics.json()
    assert "tier" in payload
    assert "limits" in payload

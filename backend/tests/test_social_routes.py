import uuid


def _register_and_login(client) -> str:
    suffix = uuid.uuid4().hex[:8]
    username = f"social_{suffix}"
    email = f"social_{suffix}@example.com"
    password = "TestPass123"

    register = client.post(
        "/auth/register",
        json={"username": username, "email": email, "password": password},
    )
    assert register.status_code == 201

    login = client.post(
        "/auth/login",
        data={"username": username, "password": password},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert login.status_code == 200
    return login.json()["access_token"]


def test_social_discussion_create_and_list(client):
    token = _register_and_login(client)
    headers = {"Authorization": f"Bearer {token}"}

    create = client.post(
        "/social/stocks/AAPL/discussions",
        json={"title": "Long term outlook", "content": "What do you think about AAPL over 5 years?"},
        headers=headers,
    )
    assert create.status_code == 201
    body = create.json()
    assert body["symbol"] == "AAPL"
    assert body["title"] == "Long term outlook"

    listing = client.get("/social/stocks/AAPL/discussions")
    assert listing.status_code == 200
    assert isinstance(listing.json(), list)

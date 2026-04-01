def test_register_and_login_flow(client):
    username = "test_auth_user"
    email = "test_auth_user@example.com"
    password = "TestPass123"

    register_response = client.post(
        "/auth/register",
        json={"username": username, "email": email, "password": password},
    )

    # Registration status: 201 for success.
    # Note: With proper isolation (drop_all/create_all), 400 shouldn't happen here anymore.
    assert register_response.status_code == 201

    login_response = client.post(
        "/auth/login",
        data={"username": username, "password": password},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )

    assert login_response.status_code == 200
    payload = login_response.json()
    assert "access_token" in payload
    assert payload.get("token_type") == "bearer"

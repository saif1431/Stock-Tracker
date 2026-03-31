import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch
from app.main import app
from models.user import User
from routes.auth_utils import get_current_user

client = TestClient(app)


def _fake_user() -> User:
    return User(id=1, username="route-test-user", email="route@example.com", hashed_password="x")


app.dependency_overrides[get_current_user] = _fake_user

def test_get_stock_route_success():
    mock_data = {
        "Meta Data": {"1. Information": "Daily Prices"},
        "Time Series (Daily)": {
            "2023-10-27": {"1. open": "100.00"}
        }
    }
    
    with patch('routes.stock_routes.get_daily_stock_data', return_value=mock_data):
        response = client.get("/stock/AAPL")
        assert response.status_code == 200
        assert response.json() == mock_data

def test_get_stock_route_error():
    mock_error = {"error": "Invalid API call"}
    
    with patch('routes.stock_routes.get_daily_stock_data', return_value=mock_error):
        response = client.get("/stock/INVALID")
        assert response.status_code == 400
        assert response.json()["detail"] == "Invalid API call"

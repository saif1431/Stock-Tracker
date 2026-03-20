import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch
from backend.app.main import app

client = TestClient(app)

def test_get_stock_route_success():
    mock_data = {
        "Meta Data": {"1. Information": "Daily Prices"},
        "Time Series (Daily)": {
            "2023-10-27": {"1. open": "100.00"}
        }
    }
    
    with patch('backend.routes.stock_routes.get_daily_stock_data', return_value=mock_data):
        response = client.get("/stock/AAPL")
        assert response.status_code == 200
        assert response.json() == mock_data

def test_get_stock_route_error():
    mock_error = {"error": "Invalid API call"}
    
    with patch('backend.routes.stock_routes.get_daily_stock_data', return_value=mock_error):
        response = client.get("/stock/INVALID")
        assert response.status_code == 400
        assert response.json()["detail"] == "Invalid API call"

from unittest.mock import MagicMock, patch

from core.config import settings
from services.stock_service import get_daily_stock_data


def _db_mock() -> MagicMock:
    db = MagicMock()
    db.query.return_value.filter.return_value.first.return_value = None
    return db

def test_get_daily_stock_data_success():
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "Meta Data": {"1. Information": "Daily Prices (open, high, low, close) and Volumes"},
        "Time Series (Daily)": {
            "2023-10-27": {"1. open": "100.00", "2. high": "110.00", "3. low": "90.00", "4. close": "105.00", "5. volume": "1000"}
        }
    }
    
    with patch('requests.get', return_value=mock_response):
        with patch.object(settings, 'STOCK_API_KEY', 'test_api_key'):
            result = get_daily_stock_data("AAPL", _db_mock())
            assert "Time Series (Daily)" in result
            assert result["Time Series (Daily)"]["2023-10-27"]["1. open"] == "100.00"

def test_get_daily_stock_data_missing_key():
    with patch.object(settings, 'STOCK_API_KEY', None):
        result = get_daily_stock_data("AAPL", _db_mock())
        assert "error" in result
        assert "API Key is missing" in result["error"]

def test_get_daily_stock_data_error_response():
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {"Error Message": "Invalid API call"}
    
    with patch('requests.get', return_value=mock_response):
        with patch.object(settings, 'STOCK_API_KEY', 'test_api_key'):
            result = get_daily_stock_data("INVALID", _db_mock())
            assert "Time Series (Daily)" in result

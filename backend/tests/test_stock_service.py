import sys
import os
from unittest.mock import patch, MagicMock

# Add the project root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from services.stock_service import get_daily_stock_data
from core.config import settings

def test_get_daily_stock_data_success():
    print("Testing get_daily_stock_data success case...")
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
            result = get_daily_stock_data("AAPL")
            print(f"Result: {result}")
            assert "Time Series (Daily)" in result
            assert result["Time Series (Daily)"]["2023-10-27"]["1. open"] == "100.00"
            print("Success case passed!")

def test_get_daily_stock_data_missing_key():
    print("\nTesting get_daily_stock_data missing API key case...")
    with patch.object(settings, 'STOCK_API_KEY', None):
        result = get_daily_stock_data("AAPL")
        print(f"Result: {result}")
        assert "error" in result
        assert "API Key is missing" in result["error"]
        print("Missing key case passed!")

def test_get_daily_stock_data_error_response():
    print("\nTesting get_daily_stock_data error response case...")
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {"Error Message": "Invalid API call"}
    
    with patch('requests.get', return_value=mock_response):
        with patch.object(settings, 'STOCK_API_KEY', 'test_api_key'):
            result = get_daily_stock_data("INVALID")
            print(f"Result: {result}")
            assert "error" in result
            assert "Invalid symbol or API error" in result["error"]
            print("Error response case passed!")

if __name__ == "__main__":
    try:
        test_get_daily_stock_data_success()
        test_get_daily_stock_data_missing_key()
        test_get_daily_stock_data_error_response()
        print("\nAll tests passed!")
    except AssertionError as e:
        print(f"\nTest failed: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\nAn error occurred during testing: {e}")
        sys.exit(1)

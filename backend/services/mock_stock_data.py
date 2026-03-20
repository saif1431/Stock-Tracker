import random
from datetime import datetime, timedelta
from typing import Dict, Any

def generate_mock_stock_data(symbol: str) -> Dict[str, Any]:
    """
    Generate realistic mock stock data for testing purposes.
    Similar format to Alpha Vantage's TIME_SERIES_DAILY response.
    """
    symbol = symbol.upper()
    
    # Mock metadata
    meta_data = {
        "1. Information": f"Daily (mock) Prices and Volumes",
        "2. Symbol": symbol,
        "3. Last Refreshed": datetime.now().strftime("%Y-%m-%d"),
        "4. Output Size": "compact",
        "5. Time Zone": "US/Eastern"
    }
    
    # Generate 100 days of mock data
    time_series = {}
    base_price = random.uniform(50, 300)  # Random starting price
    
    for i in range(100, 0, -1):
        date = (datetime.now() - timedelta(days=i)).strftime("%Y-%m-%d")
        
        # Simulate realistic price movements
        daily_change = random.uniform(-0.05, 0.05)  # ±5% daily change
        base_price = base_price * (1 + daily_change)
        
        open_price = base_price * random.uniform(0.98, 1.02)
        close_price = base_price
        high_price = max(open_price, close_price) * random.uniform(1.0, 1.02)
        low_price = min(open_price, close_price) * random.uniform(0.98, 1.0)
        volume = random.randint(1000000, 5000000)
        
        time_series[date] = {
            "1. open": f"{open_price:.2f}",
            "2. high": f"{high_price:.2f}",
            "3. low": f"{low_price:.2f}",
            "4. close": f"{close_price:.2f}",
            "5. volume": str(volume)
        }
    
    return {
        "Meta Data": meta_data,
        "Time Series (Daily)": time_series
    }

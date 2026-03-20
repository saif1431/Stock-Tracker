import requests
import time
from typing import Dict, Any
from core.config import settings
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from models.stock import Stock
from services.mock_stock_data import generate_mock_stock_data

def get_daily_stock_data(symbol: str, db: Session) -> Dict[str, Any]:
    """
    Fetches daily stock data from Alpha Vantage API, with a 5-minute database cache.
    """
    symbol = symbol.upper()
    
    # 1. Check if stock exists in database and has valid cache
    stock = db.query(Stock).filter(Stock.symbol == symbol).first()
    
    if stock and stock.cached_data and stock.last_fetched:
        # Check if cache is less than 5 minutes old
        age = datetime.now(timezone.utc) - stock.last_fetched.replace(tzinfo=timezone.utc)
        if age < timedelta(minutes=5):
            print(f"Returning cached data for {symbol} (age: {age})")
            return stock.cached_data

    # 2. If no valid cache, fetch from Alpha Vantage
    if not settings.STOCK_API_KEY:
        return {"error": "API Key is missing. Please set STOCK_API_KEY in your environment."}
    
    # Add small delay to avoid rate limiting (Alpha Vantage: 5 requests per minute)
    time.sleep(0.15)
    
    base_url = "https://www.alphavantage.co/query"
    params = {
        "function": "TIME_SERIES_DAILY",
        "symbol": symbol,
        "apikey": settings.STOCK_API_KEY
    }
    
    try:
        print(f"Fetching fresh data for {symbol} from Alpha Vantage...")
        response = requests.get(base_url, params=params)
        response.raise_for_status()
        data = response.json()
        
        # Debug: log the full response
        print(f"Alpha Vantage Response: {data}")
        
        # Check for API errors
        if "Error Message" in data:
            print(f"API Error: {data['Error Message']}")
            print(f"Using mock data as fallback for {symbol}")
            data = generate_mock_stock_data(symbol)
        elif "Note" in data:
            print(f"API Rate Limit: {data['Note']}")
            print(f"Using mock data as fallback for {symbol}")
            data = generate_mock_stock_data(symbol)
        elif "Information" in data:
            print(f"API Information: {data['Information']}")
            print(f"Using mock data as fallback for {symbol}")
            data = generate_mock_stock_data(symbol)
        
        # Check if we got the required data
        if "Time Series (Daily)" not in data:
            print(f"Response keys: {data.keys()}")
            print(f"Using mock data as fallback for {symbol}")
            data = generate_mock_stock_data(symbol)
        
        # 3. Update or create stock record with cached data
        if not stock:
            # Create a new stock record if it doesn't exist
            stock = Stock(symbol=symbol, company_name=f"Company {symbol}")
            db.add(stock)
        
        stock.cached_data = data
        stock.last_fetched = func.now()
        
        db.commit()
        db.refresh(stock)
            
        return data
        
    except requests.exceptions.RequestException as e:
        print(f"Network error occurred: {str(e)}")
        print(f"Using mock data as fallback for {symbol}")
        data = generate_mock_stock_data(symbol)
        # Store mock data in cache
        if not stock:
            stock = Stock(symbol=symbol, company_name=f"Company {symbol}")
            db.add(stock)
        stock.cached_data = data
        stock.last_fetched = func.now()
        db.commit()
        return data
    except Exception as e:
        print(f"An unexpected error occurred: {str(e)}")
        print(f"Using mock data as fallback for {symbol}")
        data = generate_mock_stock_data(symbol)
        # Store mock data in cache
        if not stock:
            stock = Stock(symbol=symbol, company_name=f"Company {symbol}")
            db.add(stock)
        stock.cached_data = data
        stock.last_fetched = func.now()
        db.commit()
        return data

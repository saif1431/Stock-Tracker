from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database.database import get_db
from services.stock_service import get_daily_stock_data, get_candlestick_data
from services.indicator_service import TechnicalIndicators
from routes.auth_utils import get_current_user
from models.user import User
from typing import Optional
from datetime import datetime, timedelta

# Simple in-memory cache for indicators (symbol_type -> (timestamp, data))
_indicator_cache: dict = {}
_CACHE_TTL = 300  # 5 minutes

router = APIRouter(prefix="/stock", tags=["stocks"])

@router.get("/{symbol}")
async def get_stock_data(
    symbol: str, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns daily stock data for a given symbol, with database caching.
    """
    data = get_daily_stock_data(symbol, db)
    if "error" in data:
        # Handle configuration or API-specific errors differently if needed
        raise HTTPException(status_code=400, detail=data["error"])
    return data


@router.get("/{symbol}/indicators")
async def get_stock_indicators(
    symbol: str,
    indicator_type: Optional[str] = Query("all", description="all, sma, ema, rsi, macd, bollinger, stochastic"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get technical indicators for a stock with 5-minute caching for performance.
    
    Supported indicators:
    - all: Returns all indicators
    - sma: Simple Moving Average (20, 50, 200)
    - ema: Exponential Moving Average (12, 26)
    - rsi: Relative Strength Index
    - macd: MACD (Moving Average Convergence Divergence)
    - bollinger: Bollinger Bands
    - stochastic: Stochastic Oscillator
    """
    try:
        symbol = symbol.upper()
        cache_key = f"{symbol}_{indicator_type}"
        
        # Check cache first
        if cache_key in _indicator_cache:
            cached_time, cached_data = _indicator_cache[cache_key]
            age = datetime.now() - cached_time
            if age < timedelta(seconds=_CACHE_TTL):
                print(f"Returning cached indicators for {cache_key} (age: {age})")
                return cached_data
            else:
                # Cache expired, remove it
                del _indicator_cache[cache_key]
        
        data = get_daily_stock_data(symbol, db)
        
        if "error" in data:
            raise HTTPException(status_code=400, detail=data["error"])
        
        time_series = data.get("Time Series (Daily)", {})
        
        if not time_series:
            raise HTTPException(status_code=400, detail="No time series data available")
        
        # Extract OHLC data from time series
        dates = sorted(time_series.keys())
        prices = [float(time_series[date]["4. close"]) for date in dates]
        highs = [float(time_series[date]["2. high"]) for date in dates]
        lows = [float(time_series[date]["3. low"]) for date in dates]
        
        indicators = {}
        
        # Calculate requested indicators
        if indicator_type == "all":
            indicators = TechnicalIndicators.get_all_indicators(prices, highs, lows)
        elif indicator_type == "sma":
            indicators = {
                "sma_20": TechnicalIndicators.calculate_sma(prices, 20),
                "sma_50": TechnicalIndicators.calculate_sma(prices, 50),
                "sma_200": TechnicalIndicators.calculate_sma(prices, 200),
            }
        elif indicator_type == "ema":
            indicators = {
                "ema_12": TechnicalIndicators.calculate_ema(prices, 12),
                "ema_26": TechnicalIndicators.calculate_ema(prices, 26),
            }
        elif indicator_type == "rsi":
            indicators = {"rsi": TechnicalIndicators.calculate_rsi(prices, 14)}
        elif indicator_type == "macd":
            indicators = {"macd": TechnicalIndicators.calculate_macd(prices)}
        elif indicator_type == "bollinger":
            indicators = {"bollinger": TechnicalIndicators.calculate_bollinger_bands(prices)}
        elif indicator_type == "stochastic":
            indicators = {"stochastic": TechnicalIndicators.calculate_stochastic(highs, lows, prices)}
        else:
            raise HTTPException(status_code=400, detail=f"Unknown indicator type: {indicator_type}")
        
        response = {
            "symbol": symbol,
            "indicator_type": indicator_type,
            "indicators": indicators,
            "data_points": len(prices)
        }
        
        # Cache the response
        _indicator_cache[cache_key] = (datetime.now(), response)
        
        return response
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating indicators: {str(e)}")


@router.get("/{symbol}/candlestick")
async def get_candlestick(
    symbol: str,
    days: int = Query(30, description="Number of days of historical data (1-365)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Fetch OHLC candlestick data for charting.
    
    Returns the last N days of candlestick data with:
    - open: Opening price
    - high: Daily high
    - low: Daily low
    - close: Closing price
    - volume: Trading volume
    """
    try:
        if days < 1 or days > 365:
            raise HTTPException(status_code=400, detail="Days must be between 1 and 365")
        
        data = get_candlestick_data(symbol, db, days)
        return data
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching candlestick data: {str(e)}")

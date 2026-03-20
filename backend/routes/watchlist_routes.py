from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database.database import get_db
from models import User, Stock, Watchlist
from schemas.watchlist_schema import WatchlistCreate, WatchlistResponse
from routes.auth_utils import get_current_user
from services.stock_service import get_daily_stock_data

router = APIRouter(prefix="/watchlist", tags=["watchlist"])

def extract_stock_price_info(stock_data: dict):
    """Extract current price, change, and high/low from stock data"""
    time_series = stock_data.get("Time Series (Daily)", {})
    if not time_series:
        return {"price": 0, "change": 0, "changePercent": 0, "high": 0, "low": 0}
    
    # Get the most recent entry (first key in the sorted dict)
    dates = sorted(time_series.keys(), reverse=True)
    if len(dates) < 1:
        return {"price": 0, "change": 0, "changePercent": 0, "high": 0, "low": 0}
    
    current_date = dates[0]
    current_data = time_series[current_date]
    current_close = float(current_data.get("4. close", 0))
    current_high = float(current_data.get("2. high", 0))
    current_low = float(current_data.get("3. low", 0))
    
    # Calculate change from previous day if available
    change = 0
    changePercent = 0
    if len(dates) >= 2:
        previous_date = dates[1]
        previous_data = time_series[previous_date]
        previous_close = float(previous_data.get("4. close", 0))
        change = current_close - previous_close
        if previous_close != 0:
            changePercent = (change / previous_close) * 100
    
    return {
        "price": current_close,
        "change": change,
        "changePercent": changePercent,
        "high": current_high,
        "low": current_low
    }

@router.post("/", response_model=WatchlistResponse, status_code=status.HTTP_201_CREATED)
def add_to_watchlist(
    watchlist_in: WatchlistCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add a stock to the current user's watchlist"""
    # Check if stock exists in database, if not create it
    stock = db.query(Stock).filter(Stock.symbol == watchlist_in.symbol.upper()).first()
    if not stock:
        stock = Stock(symbol=watchlist_in.symbol.upper(), company_name=f"Company {watchlist_in.symbol.upper()}")
        db.add(stock)
        db.commit()
        db.refresh(stock)

    # Check if stock is already in user's watchlist
    existing_entry = db.query(Watchlist).filter(
        Watchlist.user_id == current_user.id,
        Watchlist.stock_id == stock.id
    ).first()
    
    if existing_entry:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Stock already in watchlist")

    # Create new watchlist entry
    new_entry = Watchlist(user_id=current_user.id, stock_id=stock.id)
    db.add(new_entry)
    db.commit()
    db.refresh(new_entry)

    # Get stock price info
    stock_data = get_daily_stock_data(stock.symbol, db)
    price_info = extract_stock_price_info(stock_data)

    return WatchlistResponse(
        id=new_entry.id,
        symbol=stock.symbol,
        user_id=new_entry.user_id,
        added_at=new_entry.added_at,
        **price_info
    )

@router.get("/", response_model=list[WatchlistResponse])
def get_user_watchlist(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns all stocks in the authenticated user's watchlist with current prices.
    """
    watchlist_items = db.query(Watchlist).filter(Watchlist.user_id == current_user.id).all()
    
    response = []
    for item in watchlist_items:
        # Get stock price info
        stock_data = get_daily_stock_data(item.stock.symbol, db)
        price_info = extract_stock_price_info(stock_data)
        
        response.append(WatchlistResponse(
            id=item.id,
            symbol=item.stock.symbol,
            user_id=item.user_id,
            added_at=item.added_at,
            **price_info
        ))
    return response

@router.delete("/{symbol}", status_code=status.HTTP_204_NO_CONTENT)
def remove_from_watchlist(
    symbol: str, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Removes a stock from the authenticated user's watchlist.
    """
    # Find the stock first
    stock = db.query(Stock).filter(Stock.symbol == symbol.upper()).first()
    if not stock:
        raise HTTPException(status_code=404, detail="Stock not found")
        
    # Find the watchlist entry for this specific user
    entry = db.query(Watchlist).filter(
        Watchlist.user_id == current_user.id,
        Watchlist.stock_id == stock.id
    ).first()
    
    if not entry:
        raise HTTPException(status_code=404, detail="Stock not in watchlist")
        
    db.delete(entry)
    db.commit()
    return None

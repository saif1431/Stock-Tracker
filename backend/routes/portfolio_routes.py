from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database.database import get_db
from models.portfolio import Portfolio
from models.transaction import Transaction, TransactionType
from models.user import User
from schemas.portfolio_schema import PortfolioCreate, PortfolioResponse, PortfolioUpdate
from routes.auth_utils import get_current_user
from services.stock_service import get_daily_stock_data
from datetime import datetime
from typing import List

router = APIRouter(prefix="/portfolio", tags=["portfolio"])

def get_current_stock_price(symbol: str, db: Session) -> float:
    """Get the current price for a stock symbol"""
    stock_data = get_daily_stock_data(symbol, db)
    time_series = stock_data.get("Time Series (Daily)", {})
    if not time_series:
        return 0.0
    
    dates = sorted(time_series.keys(), reverse=True)
    if not dates:
        return 0.0
    
    current_data = time_series[dates[0]]
    return float(current_data.get("4. close", 0))

@router.get("/", response_model=List[PortfolioResponse])
def get_user_portfolio(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    portfolio_items = db.query(Portfolio).filter(Portfolio.user_id == current_user.id).all()
    
    response = []
    for item in portfolio_items:
        current_price = get_current_stock_price(item.symbol, db)
        total_invested = item.average_price * item.quantity
        current_value = current_price * item.quantity
        profit_loss = current_value - total_invested
        profit_loss_percent = (profit_loss / total_invested * 100) if total_invested > 0 else 0.0
        
        response.append(PortfolioResponse(
            id=item.id,
            user_id=item.user_id,
            symbol=item.symbol,
            quantity=item.quantity,
            average_price=item.average_price,
            current_price=current_price,
            profit_loss=profit_loss,
            profit_loss_percent=profit_loss_percent
        ))
    return response

@router.post("/", response_model=PortfolioResponse)
def add_to_portfolio(
    portfolio: PortfolioCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check if stock already exists in portfolio
    db_item = db.query(Portfolio).filter(
        Portfolio.user_id == current_user.id,
        Portfolio.symbol == portfolio.symbol.upper()
    ).first()

    if db_item:
        # Update existing item (average price calculation)
        if portfolio.quantity <= 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Quantity must be positive")
        
        total_quantity = db_item.quantity + portfolio.quantity
        if total_quantity > 0:
            db_item.average_price = (
                (db_item.average_price * db_item.quantity) + 
                (portfolio.average_price * portfolio.quantity)
            ) / total_quantity
        db_item.quantity = total_quantity
        db.commit()
        db.refresh(db_item)
        
        # Log transaction
        transaction = Transaction(
            user_id=current_user.id,
            symbol=portfolio.symbol.upper(),
            transaction_type=TransactionType.BUY,
            quantity=portfolio.quantity,
            price_per_share=portfolio.average_price,
            total_value=portfolio.quantity * portfolio.average_price,
            transaction_date=datetime.utcnow()
        )
        db.add(transaction)
        db.commit()
        
        current_price = get_current_stock_price(db_item.symbol, db)
        total_invested = db_item.average_price * db_item.quantity
        current_value = current_price * db_item.quantity
        profit_loss = current_value - total_invested
        profit_loss_percent = (profit_loss / total_invested * 100) if total_invested > 0 else 0.0
        
        return PortfolioResponse(
            id=db_item.id,
            user_id=db_item.user_id,
            symbol=db_item.symbol,
            quantity=db_item.quantity,
            average_price=db_item.average_price,
            current_price=current_price,
            profit_loss=profit_loss,
            profit_loss_percent=profit_loss_percent
        )

    # Validate input
    if portfolio.quantity <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Quantity must be positive")
    if portfolio.average_price < 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Price cannot be negative")
    
    # Create new item
    new_item = Portfolio(
        user_id=current_user.id,
        symbol=portfolio.symbol.upper(),
        quantity=portfolio.quantity,
        average_price=portfolio.average_price
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    
    # Log transaction
    transaction = Transaction(
        user_id=current_user.id,
        symbol=portfolio.symbol.upper(),
        transaction_type=TransactionType.BUY,
        quantity=portfolio.quantity,
        price_per_share=portfolio.average_price,
        total_value=portfolio.quantity * portfolio.average_price,
        transaction_date=datetime.utcnow()
    )
    db.add(transaction)
    db.commit()
    
    current_price = get_current_stock_price(new_item.symbol, db)
    total_invested = new_item.average_price * new_item.quantity
    current_value = current_price * new_item.quantity
    profit_loss = current_value - total_invested
    profit_loss_percent = (profit_loss / total_invested * 100) if total_invested > 0 else 0.0
    
    return PortfolioResponse(
        id=new_item.id,
        user_id=new_item.user_id,
        symbol=new_item.symbol,
        quantity=new_item.quantity,
        average_price=new_item.average_price,
        current_price=current_price,
        profit_loss=profit_loss,
        profit_loss_percent=profit_loss_percent
    )

@router.delete("/{symbol}")
def remove_from_portfolio(
    symbol: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_item = db.query(Portfolio).filter(
        Portfolio.user_id == current_user.id,
        Portfolio.symbol == symbol.upper()
    ).first()

    if not db_item:
        raise HTTPException(status_code=404, detail="Stock not found in portfolio")
    
    # Log sell transaction before deleting
    transaction = Transaction(
        user_id=current_user.id,
        symbol=symbol.upper(),
        transaction_type=TransactionType.SELL,
        quantity=db_item.quantity,
        price_per_share=db_item.average_price,
        total_value=db_item.quantity * db_item.average_price,
        transaction_date=datetime.utcnow()
    )
    db.add(transaction)
    db.commit()

    db.delete(db_item)
    db.commit()
    return {"message": "Removed from portfolio"}

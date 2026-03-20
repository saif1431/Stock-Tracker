from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database.database import get_db
from services.stock_service import get_daily_stock_data
from routes.auth_utils import get_current_user
from models.user import User

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

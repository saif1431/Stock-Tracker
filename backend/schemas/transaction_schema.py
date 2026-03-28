from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class TransactionCreate(BaseModel):
    symbol: str
    transaction_type: str  # "buy" or "sell"
    quantity: float
    price_per_share: float
    notes: Optional[str] = None


class TransactionResponse(BaseModel):
    id: int
    symbol: str
    transaction_type: str
    quantity: float
    price_per_share: float
    total_value: float
    transaction_date: datetime
    notes: Optional[str] = None

    class Config:
        from_attributes = True

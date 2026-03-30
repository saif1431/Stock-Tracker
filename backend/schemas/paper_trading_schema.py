from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class PaperAccountCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    initial_balance: float = Field(gt=0)


class PaperAccountResponse(BaseModel):
    id: int
    name: str
    initial_balance: float
    current_balance: float
    active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class PaperTradeRequest(BaseModel):
    account_id: int
    symbol: str = Field(min_length=1, max_length=10)
    side: str = Field(pattern="^(buy|sell)$")
    quantity: float = Field(gt=0)


class PaperPositionResponse(BaseModel):
    symbol: str
    quantity: float
    average_cost: float
    market_price: float
    market_value: float
    unrealized_pnl: float


class PaperTransactionResponse(BaseModel):
    id: int
    symbol: str
    transaction_type: str
    quantity: float
    price: float
    total_value: float
    created_at: datetime

    class Config:
        from_attributes = True


class PaperAccountPerformanceResponse(BaseModel):
    account_id: int
    cash_balance: float
    positions_value: float
    total_equity: float
    total_pnl: float
    total_pnl_pct: float
    positions: list[PaperPositionResponse]
    recent_transactions: list[PaperTransactionResponse]

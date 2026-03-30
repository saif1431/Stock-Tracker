from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class WatchlistCreate(BaseModel):
    symbol: str

class WatchlistBase(BaseModel):
    symbol: str
    user_id: int

class WatchlistResponse(WatchlistBase):
    id: int
    added_at: datetime
    current_price: float = 0.0
    daily_change: float = 0.0
    daily_change_percent: float = 0.0
    daily_high: float = 0.0
    daily_low: float = 0.0

    class Config:
        from_attributes = True

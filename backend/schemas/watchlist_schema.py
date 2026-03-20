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
    price: float = 0.0
    change: float = 0.0
    changePercent: float = 0.0
    high: float = 0.0
    low: float = 0.0

    class Config:
        from_attributes = True

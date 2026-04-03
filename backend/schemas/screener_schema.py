from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class ScreenerCriteria(BaseModel):
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    min_volume: Optional[float] = None
    min_price_change_pct: Optional[float] = None
    min_market_cap: Optional[float] = None
    max_market_cap: Optional[float] = None
    min_pe_ratio: Optional[float] = None
    max_pe_ratio: Optional[float] = None
    min_dividend_yield: Optional[float] = None
    min_revenue_growth: Optional[float] = None
    min_profit_margin: Optional[float] = None
    sector: Optional[str] = None
    limit: int = Field(default=50, ge=1, le=200)


class ScreenerSaveRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: Optional[str] = None
    criteria: ScreenerCriteria


class ScreenerResultItem(BaseModel):
    symbol: str
    current_price: Optional[float] = None
    volume: Optional[float] = None
    price_change_pct: Optional[float] = None
    market_cap: Optional[float] = None
    pe_ratio: Optional[float] = None
    dividend_yield: Optional[float] = None
    revenue_growth: Optional[float] = None
    profit_margin: Optional[float] = None
    sector: Optional[str] = None
    score: float


class ScreenerResponse(BaseModel):
    count: int
    results: list[ScreenerResultItem]


class SavedScreenResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    criteria: dict
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

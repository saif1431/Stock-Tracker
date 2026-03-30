from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class SectorPerformanceBase(BaseModel):
    sector: str
    day_change_percent: float
    week_change_percent: float
    month_change_percent: float
    three_month_change_percent: float
    year_change_percent: float
    stocks_count: int


class SectorPerformanceCreate(SectorPerformanceBase):
    pass


class SectorPerformance(SectorPerformanceBase):
    id: int
    updated_at: datetime

    class Config:
        from_attributes = True


class MarketIndexBase(BaseModel):
    symbol: str
    name: str
    current_value: float
    day_change: float
    day_change_percent: float
    year_high: Optional[float] = None
    year_low: Optional[float] = None


class MarketIndexCreate(MarketIndexBase):
    pass


class MarketIndex(MarketIndexBase):
    id: int
    updated_at: datetime

    class Config:
        from_attributes = True

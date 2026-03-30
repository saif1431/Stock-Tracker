from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class EconomicIndicatorBase(BaseModel):
    indicator: str
    country: str = "USA"
    current_value: float
    previous_value: Optional[float] = None
    forecast_value: Optional[float] = None
    unit: Optional[str] = None
    release_date: datetime


class EconomicIndicatorCreate(EconomicIndicatorBase):
    pass


class EconomicIndicator(EconomicIndicatorBase):
    id: int
    updated_at: datetime

    class Config:
        from_attributes = True


class CommodityBase(BaseModel):
    symbol: str
    name: str
    current_price: float
    day_change_percent: float
    week_change_percent: float
    month_change_percent: float
    year_change_percent: float
    unit: str


class CommodityCreate(CommodityBase):
    pass


class Commodity(CommodityBase):
    id: int
    updated_at: datetime

    class Config:
        from_attributes = True


class CurrencyRateBase(BaseModel):
    pair: str
    rate: float
    day_change_percent: float


class CurrencyRateCreate(CurrencyRateBase):
    pass


class CurrencyRate(CurrencyRateBase):
    id: int
    updated_at: datetime

    class Config:
        from_attributes = True

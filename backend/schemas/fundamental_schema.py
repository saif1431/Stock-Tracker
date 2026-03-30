from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class FundamentalBase(BaseModel):
    symbol: str
    company_name: str
    sector: str
    industry: str
    market_cap: Optional[float] = None
    pe_ratio: Optional[float] = None
    eps: Optional[float] = None
    dividend_yield: Optional[float] = None
    dividend_per_share: Optional[float] = None
    revenue: Optional[float] = None
    profit_margin: Optional[float] = None
    debt_to_equity: Optional[float] = None
    roa: Optional[float] = None
    roe: Optional[float] = None
    fifty_two_week_high: Optional[float] = None
    fifty_two_week_low: Optional[float] = None
    book_value: Optional[float] = None
    description: Optional[str] = None
    website: Optional[str] = None
    ceo: Optional[str] = None
    employees: Optional[int] = None


class FundamentalCreate(FundamentalBase):
    pass


class FundamentalUpdate(BaseModel):
    market_cap: Optional[float] = None
    pe_ratio: Optional[float] = None
    eps: Optional[float] = None
    dividend_yield: Optional[float] = None
    dividend_per_share: Optional[float] = None
    revenue: Optional[float] = None
    profit_margin: Optional[float] = None


class Fundamental(FundamentalBase):
    id: int
    updated_at: datetime

    class Config:
        from_attributes = True

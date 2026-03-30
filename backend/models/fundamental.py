from sqlalchemy import Column, Integer, String, Float, DateTime, Index
from datetime import datetime
from database.database import Base


class Fundamental(Base):
    __tablename__ = "fundamentals"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String, unique=True, index=True)
    company_name = Column(String)
    sector = Column(String)
    industry = Column(String)
    market_cap = Column(Float, nullable=True)
    pe_ratio = Column(Float, nullable=True)
    eps = Column(Float, nullable=True)
    dividend_yield = Column(Float, nullable=True)
    dividend_per_share = Column(Float, nullable=True)
    revenue = Column(Float, nullable=True)
    profit_margin = Column(Float, nullable=True)
    debt_to_equity = Column(Float, nullable=True)
    roa = Column(Float, nullable=True)
    roe = Column(Float, nullable=True)
    fifty_two_week_high = Column(Float, nullable=True)
    fifty_two_week_low = Column(Float, nullable=True)
    book_value = Column(Float, nullable=True)
    description = Column(String, nullable=True)
    website = Column(String, nullable=True)
    ceo = Column(String, nullable=True)
    employees = Column(Integer, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index('idx_fundamentals_symbol', 'symbol'),
        Index('idx_fundamentals_sector', 'sector'),
    )

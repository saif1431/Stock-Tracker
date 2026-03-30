from sqlalchemy import Column, Integer, String, Float, DateTime, Index
from datetime import datetime
from database.database import Base


class SectorPerformance(Base):
    __tablename__ = "sector_performance"

    id = Column(Integer, primary_key=True, index=True)
    sector = Column(String, unique=True, index=True)
    day_change_percent = Column(Float)
    week_change_percent = Column(Float)
    month_change_percent = Column(Float)
    three_month_change_percent = Column(Float)
    year_change_percent = Column(Float)
    stocks_count = Column(Integer)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index('idx_sector_performance_sector', 'sector'),
    )


class MarketIndex(Base):
    __tablename__ = "market_indices"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String, unique=True, index=True)
    name = Column(String)
    current_value = Column(Float)
    day_change = Column(Float)
    day_change_percent = Column(Float)
    year_high = Column(Float, nullable=True)
    year_low = Column(Float, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index('idx_market_indices_symbol', 'symbol'),
    )

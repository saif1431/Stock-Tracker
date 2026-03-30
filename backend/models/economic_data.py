from sqlalchemy import Column, Integer, String, Float, DateTime, Index
from datetime import datetime
from database.database import Base


class EconomicIndicator(Base):
    __tablename__ = "economic_indicators"

    id = Column(Integer, primary_key=True, index=True)
    indicator = Column(String, unique=True, index=True)
    country = Column(String, default="USA")
    current_value = Column(Float)
    previous_value = Column(Float, nullable=True)
    forecast_value = Column(Float, nullable=True)
    unit = Column(String, nullable=True)
    release_date = Column(DateTime)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index('idx_economic_indicators_indicator', 'indicator'),
    )


class Commodity(Base):
    __tablename__ = "commodities"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String, unique=True, index=True)
    name = Column(String)
    current_price = Column(Float)
    day_change_percent = Column(Float)
    week_change_percent = Column(Float)
    month_change_percent = Column(Float)
    year_change_percent = Column(Float)
    unit = Column(String)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index('idx_commodities_symbol', 'symbol'),
    )


class CurrencyRate(Base):
    __tablename__ = "currency_rates"

    id = Column(Integer, primary_key=True, index=True)
    pair = Column(String, unique=True, index=True)
    rate = Column(Float)
    day_change_percent = Column(Float)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index('idx_currency_rates_pair', 'pair'),
    )

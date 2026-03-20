from sqlalchemy import Column, Integer, String, JSON, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database.database import Base

class Stock(Base):
    __tablename__ = "stocks"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String, unique=True, index=True, nullable=False)
    company_name = Column(String, nullable=False)
    sector = Column(String, nullable=True)

    # Caching fields
    cached_data = Column(JSON, nullable=True)
    last_fetched = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationship to Watchlist
    watchlist_entries = relationship("Watchlist", back_populates="stock")

    def __repr__(self):
        return f"<Stock(symbol='{self.symbol}', name='{self.company_name}')>"

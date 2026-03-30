from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, Float, Index
from sqlalchemy.orm import relationship
from database.database import Base


class StockScreen(Base):
    __tablename__ = "stock_screens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    criteria = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    results = relationship("ScreenResult", back_populates="screen", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_screen_user", "user_id"),
    )


class ScreenResult(Base):
    __tablename__ = "screen_results"

    id = Column(Integer, primary_key=True, index=True)
    screen_id = Column(Integer, ForeignKey("stock_screens.id"), nullable=False, index=True)
    symbol = Column(String, nullable=False, index=True)
    score = Column(Float, nullable=False, default=0.0)
    matching_criteria = Column(JSON, nullable=False, default={})
    calculated_at = Column(DateTime, default=datetime.utcnow)

    screen = relationship("StockScreen", back_populates="results")

    __table_args__ = (
        Index("idx_screen_result_screen_score", "screen_id", "score"),
    )

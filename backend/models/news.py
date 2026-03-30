from sqlalchemy import Column, Integer, String, DateTime, Float, Index
from datetime import datetime
from database.database import Base


class News(Base):
    __tablename__ = "news"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String, index=True, nullable=True)
    title = Column(String)
    summary = Column(String)
    source = Column(String)
    source_url = Column(String)
    image_url = Column(String, nullable=True)
    published_date = Column(DateTime)
    sentiment = Column(String, nullable=True)
    relevance_score = Column(Float, default=0.5)
    cached_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        Index('idx_news_symbol_published_date', 'symbol', 'published_date'),
        Index('idx_news_published_date', 'published_date'),
    )

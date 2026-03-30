from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class NewsBase(BaseModel):
    symbol: Optional[str] = None
    title: str
    summary: str
    source: str
    source_url: str
    image_url: Optional[str] = None
    published_date: datetime
    sentiment: Optional[str] = None
    relevance_score: Optional[float] = None


class NewsCreate(NewsBase):
    pass


class NewsUpdate(BaseModel):
    sentiment: Optional[str] = None
    relevance_score: Optional[float] = None


class News(NewsBase):
    id: int
    cached_at: datetime

    class Config:
        from_attributes = True

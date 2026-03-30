from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List
from database.database import get_db
from models.news import News
from schemas.news_schema import News as NewsSchema
from routes.auth_utils import get_current_user

router = APIRouter(prefix="/api/news", tags=["news"])


@router.get("/stock/{symbol}", response_model=List[NewsSchema])
def get_stock_news(
    symbol: str,
    limit: int = Query(20, ge=1, le=100),
    days: int = Query(7, ge=1, le=90),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get latest news for a specific stock"""
    date_from = datetime.utcnow() - timedelta(days=days)
    news = (
        db.query(News)
        .filter(
            (News.symbol == symbol.upper()) & (News.published_date >= date_from)
        )
        .order_by(News.published_date.desc())
        .limit(limit)
        .all()
    )
    return news


@router.get("/market", response_model=List[NewsSchema])
def get_market_news(
    limit: int = Query(20, ge=1, le=100),
    days: int = Query(7, ge=1, le=90),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get general market news"""
    date_from = datetime.utcnow() - timedelta(days=days)
    news = (
        db.query(News)
        .filter((News.symbol == None) & (News.published_date >= date_from))
        .order_by(News.published_date.desc())
        .limit(limit)
        .all()
    )
    return news


@router.get("/trending", response_model=List[NewsSchema])
def get_trending_news(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get trending news by relevance score"""
    news = (
        db.query(News)
        .order_by(News.relevance_score.desc(), News.published_date.desc())
        .limit(limit)
        .all()
    )
    return news


@router.get("/sentiment/{sentiment}", response_model=List[NewsSchema])
def get_news_by_sentiment(
    sentiment: str,
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get news filtered by sentiment (positive, neutral, negative)"""
    news = (
        db.query(News)
        .filter(News.sentiment == sentiment.lower())
        .order_by(News.published_date.desc())
        .limit(limit)
        .all()
    )
    return news

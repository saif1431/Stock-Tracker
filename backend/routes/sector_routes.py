from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database.database import get_db
from models.sector import SectorPerformance, MarketIndex
from schemas.sector_schema import (
    SectorPerformance as SectorPerformanceSchema,
    MarketIndex as MarketIndexSchema,
)
from routes.auth_utils import get_current_user

router = APIRouter(prefix="/api/market", tags=["market"])


@router.get("/sectors", response_model=List[SectorPerformanceSchema])
def get_sector_performance(
    db: Session = Depends(get_db), current_user=Depends(get_current_user)
):
    """Get performance data for all sectors"""
    sectors = (
        db.query(SectorPerformance)
        .order_by(SectorPerformance.day_change_percent.desc())
        .all()
    )
    return sectors


@router.get("/sectors/{sector}", response_model=SectorPerformanceSchema)
def get_sector_by_name(
    sector: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)
):
    """Get performance data for a specific sector"""
    sector_perf = (
        db.query(SectorPerformance)
        .filter(SectorPerformance.sector.ilike(f"%{sector}%"))
        .first()
    )
    if not sector_perf:
        raise HTTPException(status_code=404, detail="Sector not found")
    return sector_perf


@router.get("/indices", response_model=List[MarketIndexSchema])
def get_market_indices(
    db: Session = Depends(get_db), current_user=Depends(get_current_user)
):
    """Get all major market indices"""
    indices = db.query(MarketIndex).all()
    return indices


@router.get("/indices/{symbol}", response_model=MarketIndexSchema)
def get_market_index(
    symbol: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)
):
    """Get specific market index data"""
    index = db.query(MarketIndex).filter(MarketIndex.symbol == symbol.upper()).first()
    if not index:
        raise HTTPException(status_code=404, detail="Index not found")
    return index


@router.get("/breadth", response_model=dict)
def get_market_breadth(
    db: Session = Depends(get_db), current_user=Depends(get_current_user)
):
    """Get market breadth data (up/down/unchanged)"""
    indices = db.query(MarketIndex).all()
    up_count = sum(1 for idx in indices if idx.day_change_percent > 0)
    down_count = sum(1 for idx in indices if idx.day_change_percent < 0)
    unchanged_count = sum(1 for idx in indices if idx.day_change_percent == 0)

    return {
        "up": up_count,
        "down": down_count,
        "unchanged": unchanged_count,
        "up_ratio": round(up_count / len(indices), 2) if indices else 0,
    }

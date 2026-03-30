from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from database.database import get_db
from models.fundamental import Fundamental
from schemas.fundamental_schema import Fundamental as FundamentalSchema
from routes.auth_utils import get_current_user

router = APIRouter(prefix="/api/fundamentals", tags=["fundamentals"])


@router.get("/{symbol}", response_model=FundamentalSchema)
def get_fundamental(
    symbol: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)
):
    """Get fundamental data for a stock"""
    fundamental = db.query(Fundamental).filter(Fundamental.symbol == symbol.upper()).first()
    if not fundamental:
        raise HTTPException(status_code=404, detail="Fundamental data not found")
    return fundamental


@router.get("/", response_model=List[FundamentalSchema])
def get_fundamentals(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get all fundamentals"""
    fundamentals = db.query(Fundamental).limit(limit).all()
    return fundamentals


@router.get("/sector/{sector}", response_model=List[FundamentalSchema])
def get_fundamentals_by_sector(
    sector: str,
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get fundamentals for a specific sector"""
    fundamentals = (
        db.query(Fundamental)
        .filter(Fundamental.sector.ilike(f"%{sector}%"))
        .limit(limit)
        .all()
    )
    return fundamentals


@router.get("/compare/{symbols}", response_model=List[FundamentalSchema])
def compare_fundamentals(
    symbols: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)
):
    """Compare fundamentals of multiple stocks (comma-separated symbols)"""
    symbol_list = [s.strip().upper() for s in symbols.split(",")]
    fundamentals = (
        db.query(Fundamental).filter(Fundamental.symbol.in_(symbol_list)).all()
    )
    return fundamentals

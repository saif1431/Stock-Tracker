from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database.database import get_db
from models.economic_data import (
    EconomicIndicator,
    Commodity,
    CurrencyRate,
)
from schemas.economic_data_schema import (
    EconomicIndicator as EconomicIndicatorSchema,
    Commodity as CommoditySchema,
    CurrencyRate as CurrencyRateSchema,
)
from routes.auth_utils import get_current_user

router = APIRouter(prefix="/api/market-overview", tags=["market-overview"])


@router.get("/economic-indicators", response_model=List[EconomicIndicatorSchema])
def get_economic_indicators(
    country: str = Query("USA"),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get economic indicators (unemployment, inflation, GDP, etc.)"""
    indicators = (
        db.query(EconomicIndicator)
        .filter(EconomicIndicator.country == country)
        .all()
    )
    return indicators


@router.get("/economic-indicators/{indicator}", response_model=EconomicIndicatorSchema)
def get_economic_indicator(
    indicator: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)
):
    """Get specific economic indicator value"""
    econ_ind = (
        db.query(EconomicIndicator)
        .filter(EconomicIndicator.indicator.ilike(f"%{indicator}%"))
        .first()
    )
    if not econ_ind:
        raise HTTPException(status_code=404, detail="Economic indicator not found")
    return econ_ind


@router.get("/commodities", response_model=List[CommoditySchema])
def get_commodities(
    db: Session = Depends(get_db), current_user=Depends(get_current_user)
):
    """Get commodity prices and changes"""
    commodities = (
        db.query(Commodity)
        .order_by(Commodity.updated_at.desc())
        .all()
    )
    return commodities


@router.get("/commodities/{symbol}", response_model=CommoditySchema)
def get_commodity(
    symbol: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)
):
    """Get specific commodity data"""
    commodity = (
        db.query(Commodity)
        .filter(Commodity.symbol == symbol.upper())
        .first()
    )
    if not commodity:
        raise HTTPException(status_code=404, detail="Commodity not found")
    return commodity


@router.get("/currencies", response_model=List[CurrencyRateSchema])
def get_currency_rates(
    db: Session = Depends(get_db), current_user=Depends(get_current_user)
):
    """Get forex currency rates"""
    rates = db.query(CurrencyRate).all()
    return rates


@router.get("/currencies/{pair}", response_model=CurrencyRateSchema)
def get_currency_pair(
    pair: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)
):
    """Get specific forex pair rate"""
    currency = (
        db.query(CurrencyRate)
        .filter(CurrencyRate.pair == pair.upper())
        .first()
    )
    if not currency:
        raise HTTPException(status_code=404, detail="Currency pair not found")
    return currency


from fastapi import HTTPException

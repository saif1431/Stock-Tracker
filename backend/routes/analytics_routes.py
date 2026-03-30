from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database.database import get_db
from routes.auth_utils import get_current_user
from services.portfolio_analytics_service import build_portfolio_performance, build_asset_allocation


router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/portfolio-performance")
def portfolio_performance(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return build_portfolio_performance(db, current_user.id)


@router.get("/asset-allocation")
def asset_allocation(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return build_asset_allocation(db, current_user.id)

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database.database import get_db
from routes.auth_utils import get_current_user
from schemas.screener_schema import ScreenerCriteria, ScreenerSaveRequest
from models.stock_screen import StockScreen
from services.screener_service import run_screener, save_screen, store_results


router = APIRouter(prefix="/api/screener", tags=["screener"])


@router.post("/run")
def run_stock_screener(
    criteria: ScreenerCriteria,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    results = run_screener(db, criteria.model_dump())
    return {"count": len(results), "results": results}


@router.post("/save")
def save_stock_screen(
    payload: ScreenerSaveRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    screen = save_screen(
        db=db,
        user_id=current_user.id,
        name=payload.name,
        description=payload.description,
        criteria=payload.criteria.model_dump(),
    )

    results = run_screener(db, payload.criteria.model_dump())
    store_results(db, screen.id, results)

    return {"screen_id": screen.id, "name": screen.name, "result_count": len(results)}


@router.get("/saved")
def list_saved_screens(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return (
        db.query(StockScreen)
        .filter(StockScreen.user_id == current_user.id)
        .order_by(StockScreen.created_at.desc())
        .all()
    )


@router.post("/saved/{screen_id}/run")
def run_saved_screen(
    screen_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    screen = (
        db.query(StockScreen)
        .filter(StockScreen.id == screen_id, StockScreen.user_id == current_user.id)
        .first()
    )
    if not screen:
        raise HTTPException(status_code=404, detail="Saved screen not found")

    results = run_screener(db, screen.criteria)
    store_results(db, screen.id, results)
    return {"screen_id": screen.id, "name": screen.name, "count": len(results), "results": results}

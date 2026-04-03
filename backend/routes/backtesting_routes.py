from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database.database import get_db
from routes.auth_utils import get_current_user
from models.backtest import BacktestRun
from services.backtesting_service import run_sma_backtest, save_backtest_run


router = APIRouter(prefix="/api/backtesting", tags=["backtesting"])


class BacktestRequest(BaseModel):
    symbol: str = Field(min_length=1, max_length=10)
    start_date: str
    end_date: str
    short_window: int = Field(default=20, ge=2, le=200)
    long_window: int = Field(default=50, ge=3, le=400)
    initial_capital: float = Field(default=10000, gt=0)
    fee_pct: float = Field(default=0, ge=0, le=5)
    slippage_bps: float = Field(default=0, ge=0, le=250)
    save_run: bool = False
    run_name: str | None = None


@router.post("/run")
def run_backtest(
    payload: BacktestRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if payload.short_window >= payload.long_window:
        raise HTTPException(status_code=400, detail="short_window must be lower than long_window")

    try:
        result = run_sma_backtest(
            db=db,
            symbol=payload.symbol,
            start_date=payload.start_date,
            end_date=payload.end_date,
            short_window=payload.short_window,
            long_window=payload.long_window,
            initial_capital=payload.initial_capital,
            fee_pct=payload.fee_pct,
            slippage_bps=payload.slippage_bps,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    response = {"result": result}

    if payload.save_run:
        run = save_backtest_run(
            db=db,
            user_id=current_user.id,
            name=payload.run_name,
            symbol=payload.symbol.upper(),
            start_date=payload.start_date,
            end_date=payload.end_date,
            initial_capital=payload.initial_capital,
            result=result,
        )
        response["saved_run_id"] = run.id

    return response


@router.get("/runs")
def list_backtest_runs(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return (
        db.query(BacktestRun)
        .filter(BacktestRun.user_id == current_user.id)
        .order_by(BacktestRun.created_at.desc())
        .limit(50)
        .all()
    )

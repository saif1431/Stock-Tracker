from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database.database import get_db
from routes.auth_utils import get_current_user
from models.paper_trading import PaperTradingAccount
from schemas.paper_trading_schema import (
    PaperAccountCreate,
    PaperTradeRequest,
)
from services.paper_trading_service import create_account, execute_trade, account_performance


router = APIRouter(prefix="/api/paper-trading", tags=["paper-trading"])


@router.post("/accounts")
def create_paper_account(
    payload: PaperAccountCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return create_account(db, current_user.id, payload.name, payload.initial_balance)


@router.get("/accounts")
def list_paper_accounts(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return (
        db.query(PaperTradingAccount)
        .filter(PaperTradingAccount.user_id == current_user.id)
        .order_by(PaperTradingAccount.created_at.desc())
        .all()
    )


@router.post("/trade")
def place_paper_trade(
    payload: PaperTradeRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return execute_trade(
        db=db,
        user_id=current_user.id,
        account_id=payload.account_id,
        symbol=payload.symbol,
        side=payload.side,
        quantity=payload.quantity,
    )


@router.get("/accounts/{account_id}/performance")
def get_paper_performance(
    account_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return account_performance(db, current_user.id, account_id)

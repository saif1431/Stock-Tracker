from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from database.database import get_db
from models.transaction import Transaction, TransactionType
from models.user import User
from routes.auth_utils import get_current_user
from schemas.transaction_schema import TransactionCreate, TransactionResponse
from typing import List, Optional
import csv
from io import StringIO

router = APIRouter(prefix="/transactions", tags=["transactions"])


@router.get("/", response_model=List[TransactionResponse])
async def get_transactions(
    symbol: Optional[str] = None,
    transaction_type: Optional[str] = None,
    days: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get user's transaction history with optional filters
    """
    query = db.query(Transaction).filter(Transaction.user_id == current_user.id)

    if symbol:
        query = query.filter(Transaction.symbol == symbol.upper())

    if transaction_type:
        query = query.filter(Transaction.transaction_type == transaction_type.lower())

    if days:
        start_date = datetime.utcnow() - timedelta(days=days)
        query = query.filter(Transaction.transaction_date >= start_date)

    transactions = query.order_by(Transaction.transaction_date.desc()).all()
    return transactions


@router.get("/summary", response_model=dict)
async def get_transaction_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get transaction statistics
    """
    transactions = (
        db.query(Transaction)
        .filter(Transaction.user_id == current_user.id)
        .all()
    )

    buy_count = sum(
        1 for t in transactions if t.transaction_type == TransactionType.BUY
    )
    sell_count = sum(
        1 for t in transactions if t.transaction_type == TransactionType.SELL
    )
    total_invested = sum(
        t.total_value for t in transactions if t.transaction_type == TransactionType.BUY
    )
    total_sold = sum(
        t.total_value for t in transactions if t.transaction_type == TransactionType.SELL
    )

    return {
        "total_transactions": len(transactions),
        "buy_count": buy_count,
        "sell_count": sell_count,
        "total_invested": total_invested,
        "total_sold": total_sold,
        "net_invested": total_invested - total_sold,
    }


@router.post("/", response_model=TransactionResponse)
async def create_transaction(
    transaction: TransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a new transaction (used by portfolio routes)
    """
    total_value = transaction.quantity * transaction.price_per_share

    db_transaction = Transaction(
        user_id=current_user.id,
        symbol=transaction.symbol.upper(),
        transaction_type=transaction.transaction_type.lower(),
        quantity=transaction.quantity,
        price_per_share=transaction.price_per_share,
        total_value=total_value,
        notes=transaction.notes,
    )

    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)
    return db_transaction


@router.get("/{transaction_id}", response_model=TransactionResponse)
async def get_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get a specific transaction
    """
    transaction = (
        db.query(Transaction)
        .filter(
            Transaction.id == transaction_id, Transaction.user_id == current_user.id
        )
        .first()
    )

    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")

    return transaction


@router.delete("/{transaction_id}")
async def delete_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Delete a transaction
    """
    transaction = (
        db.query(Transaction)
        .filter(
            Transaction.id == transaction_id, Transaction.user_id == current_user.id
        )
        .first()
    )

    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")

    db.delete(transaction)
    db.commit()
    return {"message": "Transaction deleted"}


@router.get("/export/csv")
async def export_transactions_csv(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Export transactions as CSV
    """
    transactions = (
        db.query(Transaction)
        .filter(Transaction.user_id == current_user.id)
        .order_by(Transaction.transaction_date.desc())
        .all()
    )

    output = StringIO()
    writer = csv.writer(output)

    writer.writerow(["Date", "Symbol", "Type", "Quantity", "Price", "Total", "Notes"])

    for t in transactions:
        writer.writerow(
            [
                t.transaction_date.strftime("%Y-%m-%d %H:%M"),
                t.symbol,
                t.transaction_type.value,
                t.quantity,
                f"${t.price_per_share:.2f}",
                f"${t.total_value:.2f}",
                t.notes or "",
            ]
        )

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment;filename=transactions.csv"},
    )

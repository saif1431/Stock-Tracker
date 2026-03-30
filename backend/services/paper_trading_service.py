from sqlalchemy.orm import Session
from fastapi import HTTPException

from models.paper_trading import PaperTradingAccount, PaperPosition, PaperTransaction
from services.stock_service import get_current_stock_price


def create_account(db: Session, user_id: int, name: str, initial_balance: float) -> PaperTradingAccount:
    account = PaperTradingAccount(
        user_id=user_id,
        name=name,
        initial_balance=initial_balance,
        current_balance=initial_balance,
    )
    db.add(account)
    db.commit()
    db.refresh(account)
    return account


def execute_trade(db: Session, user_id: int, account_id: int, symbol: str, side: str, quantity: float) -> PaperTransaction:
    account = (
        db.query(PaperTradingAccount)
        .filter(PaperTradingAccount.id == account_id, PaperTradingAccount.user_id == user_id)
        .first()
    )
    if not account:
        raise HTTPException(status_code=404, detail="Paper trading account not found")

    symbol = symbol.upper()
    side = side.lower()
    price = get_current_stock_price(symbol)
    total_value = price * quantity

    position = (
        db.query(PaperPosition)
        .filter(PaperPosition.account_id == account.id, PaperPosition.symbol == symbol)
        .first()
    )

    if side == "buy":
        if account.current_balance < total_value:
            raise HTTPException(status_code=400, detail="Insufficient paper cash balance")

        if position:
            new_qty = position.quantity + quantity
            new_avg = ((position.quantity * position.average_cost) + total_value) / new_qty
            position.quantity = new_qty
            position.average_cost = new_avg
        else:
            position = PaperPosition(
                account_id=account.id,
                symbol=symbol,
                quantity=quantity,
                average_cost=price,
            )
            db.add(position)

        account.current_balance -= total_value

    else:  # sell
        if not position or position.quantity < quantity:
            raise HTTPException(status_code=400, detail="Not enough paper shares to sell")

        position.quantity -= quantity
        account.current_balance += total_value

        if position.quantity <= 0:
            db.delete(position)

    transaction = PaperTransaction(
        account_id=account.id,
        symbol=symbol,
        transaction_type=side,
        quantity=quantity,
        price=price,
        total_value=total_value,
    )

    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return transaction


def account_performance(db: Session, user_id: int, account_id: int) -> dict:
    account = (
        db.query(PaperTradingAccount)
        .filter(PaperTradingAccount.id == account_id, PaperTradingAccount.user_id == user_id)
        .first()
    )
    if not account:
        raise HTTPException(status_code=404, detail="Paper trading account not found")

    positions = db.query(PaperPosition).filter(PaperPosition.account_id == account.id).all()
    transactions = (
        db.query(PaperTransaction)
        .filter(PaperTransaction.account_id == account.id)
        .order_by(PaperTransaction.created_at.desc())
        .limit(25)
        .all()
    )

    position_items = []
    positions_value = 0.0

    for p in positions:
        market_price = get_current_stock_price(p.symbol)
        market_value = market_price * p.quantity
        unrealized_pnl = (market_price - p.average_cost) * p.quantity

        positions_value += market_value
        position_items.append(
            {
                "symbol": p.symbol,
                "quantity": round(p.quantity, 4),
                "average_cost": round(p.average_cost, 2),
                "market_price": round(market_price, 2),
                "market_value": round(market_value, 2),
                "unrealized_pnl": round(unrealized_pnl, 2),
            }
        )

    total_equity = account.current_balance + positions_value
    total_pnl = total_equity - account.initial_balance
    total_pnl_pct = (total_pnl / account.initial_balance * 100) if account.initial_balance > 0 else 0.0

    return {
        "account_id": account.id,
        "cash_balance": round(account.current_balance, 2),
        "positions_value": round(positions_value, 2),
        "total_equity": round(total_equity, 2),
        "total_pnl": round(total_pnl, 2),
        "total_pnl_pct": round(total_pnl_pct, 2),
        "positions": position_items,
        "recent_transactions": transactions,
    }

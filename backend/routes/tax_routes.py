from collections import defaultdict, deque
from datetime import datetime

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from database.database import get_db
from models.portfolio import Portfolio
from models.transaction import Transaction, TransactionType
from models.user import User
from routes.auth_utils import get_current_user
from services.stock_service import get_daily_stock_data

import csv
from io import StringIO

router = APIRouter(prefix="/tax", tags=["tax"])


def _last_close_price(symbol: str, db: Session) -> float | None:
    data = get_daily_stock_data(symbol, db)
    series = data.get("Time Series (Daily)", {}) if isinstance(data, dict) else {}
    if not series:
        return None
    latest_day = sorted(series.keys(), reverse=True)[0]
    return float(series[latest_day]["4. close"])


def _all_user_transactions(db: Session, user_id: int) -> list[Transaction]:
    return (
        db.query(Transaction)
        .filter(Transaction.user_id == user_id)
        .order_by(Transaction.transaction_date.asc(), Transaction.id.asc())
        .all()
    )


def _wash_sale_detected(transactions: list[Transaction], sell_tx: Transaction, realized_gain: float) -> bool:
    if realized_gain >= 0:
        return False

    for tx in transactions:
        if tx.symbol != sell_tx.symbol:
            continue
        if tx.transaction_type != TransactionType.BUY:
            continue
        delta_days = abs((tx.transaction_date.date() - sell_tx.transaction_date.date()).days)
        if delta_days <= 30:
            return True
    return False


def _compute_capital_gains(transactions: list[Transaction], year: int) -> dict:
    lots: dict[str, deque] = defaultdict(deque)
    gains: list[dict] = []

    for tx in transactions:
        tx_type = tx.transaction_type
        if tx_type == TransactionType.BUY:
            lots[tx.symbol].append(
                {
                    "remaining_qty": float(tx.quantity),
                    "price": float(tx.price_per_share),
                    "purchase_date": tx.transaction_date,
                }
            )
            continue

        if tx_type != TransactionType.SELL:
            continue

        remaining_to_match = float(tx.quantity)
        while remaining_to_match > 0 and lots[tx.symbol]:
            lot = lots[tx.symbol][0]
            matched_qty = min(remaining_to_match, lot["remaining_qty"])
            purchase_cost = matched_qty * lot["price"]
            sale_value = matched_qty * float(tx.price_per_share)
            gain_loss = sale_value - purchase_cost

            holding_days = (tx.transaction_date.date() - lot["purchase_date"].date()).days
            holding_period = "long-term" if holding_days > 365 else "short-term"

            if tx.transaction_date.year == year:
                gains.append(
                    {
                        "symbol": tx.symbol,
                        "purchase_date": lot["purchase_date"],
                        "sale_date": tx.transaction_date,
                        "purchase_price": lot["price"],
                        "sale_price": float(tx.price_per_share),
                        "quantity": matched_qty,
                        "cost_basis": purchase_cost,
                        "proceeds": sale_value,
                        "gain_loss": gain_loss,
                        "holding_period": holding_period,
                        "wash_sale": _wash_sale_detected(transactions, tx, gain_loss),
                    }
                )

            lot["remaining_qty"] -= matched_qty
            if lot["remaining_qty"] <= 0:
                lots[tx.symbol].popleft()

            remaining_to_match -= matched_qty

    short_term = sum(item["gain_loss"] for item in gains if item["holding_period"] == "short-term")
    long_term = sum(item["gain_loss"] for item in gains if item["holding_period"] == "long-term")

    return {
        "year": year,
        "short_term_gains": short_term,
        "long_term_gains": long_term,
        "total_gain": short_term + long_term,
        "transactions_count": len(gains),
        "gains": gains,
    }


@router.get("/capital-gains/{year}")
def get_capital_gains(
    year: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    transactions = _all_user_transactions(db, current_user.id)
    return _compute_capital_gains(transactions, year)


@router.get("/summary/{year}")
def get_annual_tax_summary(
    year: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    data = _compute_capital_gains(_all_user_transactions(db, current_user.id), year)
    losses = abs(sum(item["gain_loss"] for item in data["gains"] if item["gain_loss"] < 0))

    return {
        "year": year,
        "short_term_gains": data["short_term_gains"],
        "long_term_gains": data["long_term_gains"],
        "total_gain": data["total_gain"],
        "total_losses": losses,
        "wash_sale_count": sum(1 for item in data["gains"] if item["wash_sale"]),
    }


@router.get("/form-8949/{year}")
def get_form_8949_data(
    year: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    data = _compute_capital_gains(_all_user_transactions(db, current_user.id), year)

    return {
        "year": year,
        "rows": [
            {
                "description": item["symbol"],
                "date_acquired": item["purchase_date"].date().isoformat(),
                "date_sold": item["sale_date"].date().isoformat(),
                "proceeds": item["proceeds"],
                "cost_basis": item["cost_basis"],
                "adjustment_code": "W" if item["wash_sale"] else None,
                "gain_or_loss": item["gain_loss"],
                "category": "long" if item["holding_period"] == "long-term" else "short",
            }
            for item in data["gains"]
        ],
    }


@router.get("/harvesting-opportunities")
def get_tax_harvesting_opportunities(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    positions = db.query(Portfolio).filter(Portfolio.user_id == current_user.id).all()
    opportunities: list[dict] = []

    for position in positions:
        market_price = _last_close_price(position.symbol, db)
        if market_price is None:
            continue

        cost_basis = float(position.quantity) * float(position.average_price)
        current_value = float(position.quantity) * market_price
        unrealized_loss = cost_basis - current_value

        if unrealized_loss > 0:
            opportunities.append(
                {
                    "symbol": position.symbol,
                    "quantity": float(position.quantity),
                    "average_cost": float(position.average_price),
                    "current_price": market_price,
                    "cost_basis": cost_basis,
                    "current_value": current_value,
                    "potential_loss": unrealized_loss,
                }
            )

    opportunities.sort(key=lambda item: item["potential_loss"], reverse=True)
    return {"count": len(opportunities), "opportunities": opportunities}


@router.get("/export/{year}")
def export_tax_csv(
    year: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    data = _compute_capital_gains(_all_user_transactions(db, current_user.id), year)

    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(
        [
            "Symbol",
            "Purchase Date",
            "Sale Date",
            "Quantity",
            "Purchase Price",
            "Sale Price",
            "Cost Basis",
            "Proceeds",
            "Gain/Loss",
            "Holding Period",
            "Wash Sale",
        ]
    )

    for item in data["gains"]:
        writer.writerow(
            [
                item["symbol"],
                item["purchase_date"].date().isoformat(),
                item["sale_date"].date().isoformat(),
                item["quantity"],
                item["purchase_price"],
                item["sale_price"],
                item["cost_basis"],
                item["proceeds"],
                item["gain_loss"],
                item["holding_period"],
                item["wash_sale"],
            ]
        )

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=tax_report_{year}.csv"},
    )

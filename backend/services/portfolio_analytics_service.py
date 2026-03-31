from __future__ import annotations

from collections import defaultdict
from datetime import datetime
from math import sqrt
from sqlalchemy.orm import Session

from models.transaction import Transaction
from models.portfolio import Portfolio
from models.fundamental import Fundamental
from services.stock_service import get_daily_stock_data


def _current_price(symbol: str, db: Session) -> float:
    data = get_daily_stock_data(symbol, db)
    series = data.get("Time Series (Daily)", {}) if isinstance(data, dict) else {}
    if not series:
        return 0.0
    latest_date = max(series.keys())
    latest = series.get(latest_date, {})
    return float(latest.get("4. close", 0.0))


def _safe_pct(numerator: float, denominator: float) -> float:
    if denominator == 0:
        return 0.0
    return (numerator / denominator) * 100


def _max_drawdown(values: list[float]) -> float:
    if not values:
        return 0.0
    peak = values[0]
    max_dd = 0.0
    for value in values:
        peak = max(peak, value)
        if peak > 0:
            dd = (peak - value) / peak
            max_dd = max(max_dd, dd)
    return max_dd * 100


def _sharpe_ratio(values: list[float]) -> float:
    if len(values) < 3:
        return 0.0

    returns = []
    for i in range(1, len(values)):
        prev = values[i - 1]
        if prev <= 0:
            continue
        returns.append((values[i] - prev) / prev)

    if len(returns) < 2:
        return 0.0

    avg = sum(returns) / len(returns)
    variance = sum((r - avg) ** 2 for r in returns) / (len(returns) - 1)
    std = variance ** 0.5
    if std == 0:
        return 0.0

    return (avg / std) * sqrt(252)


def build_portfolio_performance(db: Session, user_id: int) -> dict:
    transactions = (
        db.query(Transaction)
        .filter(Transaction.user_id == user_id)
        .order_by(Transaction.transaction_date.asc())
        .all()
    )

    if not transactions:
        return {
            "metrics": {
                "invested_capital": 0.0,
                "current_value": 0.0,
                "total_return_pct": 0.0,
                "annualized_return_pct": 0.0,
                "max_drawdown_pct": 0.0,
                "sharpe_ratio": 0.0,
                "benchmark_return_pct": None,
            },
            "history": [],
            "monthly_returns": [],
        }

    holdings: dict[str, float] = defaultdict(float)
    last_seen_prices: dict[str, float] = {}
    history = []

    total_buys = 0.0
    total_sells = 0.0

    for tx in transactions:
        symbol = tx.symbol.upper()
        price = tx.price_per_share
        side = tx.transaction_type.value if hasattr(tx.transaction_type, "value") else str(tx.transaction_type).lower()

        if side == "buy":
            holdings[symbol] += tx.quantity
            total_buys += tx.total_value
        else:
            holdings[symbol] -= tx.quantity
            total_sells += tx.total_value
            if holdings[symbol] < 0:
                holdings[symbol] = 0

        last_seen_prices[symbol] = price
        value = sum(max(qty, 0) * last_seen_prices.get(sym, 0.0) for sym, qty in holdings.items())
        history.append(
            {
                "date": tx.transaction_date.date().isoformat(),
                "portfolio_value": round(value, 2),
            }
        )

    invested_capital = max(total_buys - total_sells, 0.0)

    portfolios = db.query(Portfolio).filter(Portfolio.user_id == user_id).all()
    current_value = 0.0
    for p in portfolios:
        if p.quantity <= 0:
            continue
        current_price = _current_price(p.symbol, db)
        current_value += p.quantity * current_price

    if current_value <= 0 and history:
        current_value = history[-1]["portfolio_value"]

    if history:
        history.append(
            {
                "date": datetime.utcnow().date().isoformat(),
                "portfolio_value": round(current_value, 2),
            }
        )

    total_return_pct = _safe_pct(current_value - invested_capital, invested_capital)

    first_date = transactions[0].transaction_date.date()
    days = max((datetime.utcnow().date() - first_date).days, 1)
    years = days / 365.25
    annualized_return_pct = 0.0
    if years > 0 and invested_capital > 0 and current_value > 0:
        annualized_return_pct = ((current_value / invested_capital) ** (1 / years) - 1) * 100

    values = [point["portfolio_value"] for point in history]
    max_drawdown_pct = _max_drawdown(values)
    sharpe_ratio = _sharpe_ratio(values)

    monthly_returns = []
    month_end_values = {}
    for point in history:
        month_key = point["date"][:7]
        month_end_values[month_key] = point["portfolio_value"]

    months = sorted(month_end_values.keys())
    for i in range(1, len(months)):
        prev_v = month_end_values[months[i - 1]]
        curr_v = month_end_values[months[i]]
        monthly_returns.append(
            {
                "month": months[i],
                "return_pct": round(_safe_pct(curr_v - prev_v, prev_v), 2),
            }
        )

    benchmark_return = None
    try:
        spy_data = get_daily_stock_data("SPY", db)
        spy_series = spy_data.get("Time Series (Daily)", {}) if isinstance(spy_data, dict) else {}
        filtered_dates = sorted(
            [d for d in spy_series.keys() if datetime.strptime(d, "%Y-%m-%d").date() >= first_date]
        )
        if len(filtered_dates) >= 2:
            start_price = float(spy_series[filtered_dates[0]].get("4. close", 0.0))
            end_price = float(spy_series[filtered_dates[-1]].get("4. close", 0.0))
            if start_price > 0:
                benchmark_return = _safe_pct(end_price - start_price, start_price)
    except Exception:
        benchmark_return = None

    return {
        "metrics": {
            "invested_capital": round(invested_capital, 2),
            "current_value": round(current_value, 2),
            "total_return_pct": round(total_return_pct, 2),
            "annualized_return_pct": round(annualized_return_pct, 2),
            "max_drawdown_pct": round(max_drawdown_pct, 2),
            "sharpe_ratio": round(sharpe_ratio, 2),
            "benchmark_return_pct": round(benchmark_return, 2) if benchmark_return is not None else None,
        },
        "history": history,
        "monthly_returns": monthly_returns,
    }


def build_asset_allocation(db: Session, user_id: int) -> dict:
    portfolios = db.query(Portfolio).filter(Portfolio.user_id == user_id).all()

    if not portfolios:
        return {
            "total_value": 0.0,
            "sector_allocation": [],
            "holding_allocation": [],
            "diversification_score": 0.0,
        }

    sector_values: dict[str, float] = defaultdict(float)
    holding_values = []

    total_value = 0.0

    for holding in portfolios:
        if holding.quantity <= 0:
            continue

        current_price = _current_price(holding.symbol, db)
        market_value = current_price * holding.quantity
        total_value += market_value

        fundamental = db.query(Fundamental).filter(Fundamental.symbol == holding.symbol.upper()).first()
        sector = (fundamental.sector if fundamental and fundamental.sector else "Unknown").strip()
        sector_values[sector] += market_value

        holding_values.append(
            {
                "symbol": holding.symbol,
                "value": round(market_value, 2),
            }
        )

    if total_value <= 0:
        return {
            "total_value": 0.0,
            "sector_allocation": [],
            "holding_allocation": [],
            "diversification_score": 0.0,
        }

    sector_allocation = [
        {
            "name": sector,
            "value": round(value, 2),
            "percentage": round((value / total_value) * 100, 2),
        }
        for sector, value in sector_values.items()
    ]
    sector_allocation.sort(key=lambda x: x["value"], reverse=True)

    for item in holding_values:
        item["percentage"] = round((item["value"] / total_value) * 100, 2)

    holding_values.sort(key=lambda x: x["value"], reverse=True)

    # Lower concentration in the top holding means better diversification.
    top_holding_pct = holding_values[0]["percentage"] if holding_values else 100.0
    diversification_score = max(0.0, min(100.0, 100.0 - top_holding_pct))

    return {
        "total_value": round(total_value, 2),
        "sector_allocation": sector_allocation,
        "holding_allocation": holding_values,
        "diversification_score": round(diversification_score, 2),
    }

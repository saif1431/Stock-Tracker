from __future__ import annotations

from datetime import datetime
from math import sqrt
from sqlalchemy.orm import Session

from models.backtest import BacktestRun
from services.stock_service import get_daily_stock_data


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


def run_sma_backtest(
    symbol: str,
    start_date: str,
    end_date: str,
    short_window: int,
    long_window: int,
    initial_capital: float,
) -> dict:
    symbol = symbol.upper()

    all_data = get_daily_stock_data(symbol)
    start = datetime.strptime(start_date, "%Y-%m-%d").date()
    end = datetime.strptime(end_date, "%Y-%m-%d").date()

    rows = []
    for row in all_data:
        d = datetime.strptime(row["date"], "%Y-%m-%d").date()
        if start <= d <= end:
            rows.append({"date": row["date"], "close": row["close"]})

    rows.sort(key=lambda x: x["date"])

    if len(rows) < long_window + 2:
        raise ValueError("Not enough historical data for selected window sizes")

    closes = [r["close"] for r in rows]

    def sma(index: int, window: int) -> float:
        segment = closes[index - window + 1 : index + 1]
        return sum(segment) / window

    cash = initial_capital
    shares = 0.0
    equity_curve = []
    trades = []
    trade_pnls = []
    open_trade_cost = None

    prev_signal = None

    for i in range(len(rows)):
        price = rows[i]["close"]

        if i >= long_window - 1:
            short_sma = sma(i, short_window)
            long_sma = sma(i, long_window)
            signal = "buy" if short_sma > long_sma else "sell"

            if signal == "buy" and prev_signal != "buy" and shares == 0:
                shares = cash / price if price > 0 else 0.0
                cost = shares * price
                cash -= cost
                open_trade_cost = cost
                trades.append({"date": rows[i]["date"], "side": "buy", "price": round(price, 2), "shares": round(shares, 4)})

            elif signal == "sell" and prev_signal == "buy" and shares > 0:
                proceeds = shares * price
                cash += proceeds
                if open_trade_cost is not None:
                    trade_pnls.append(proceeds - open_trade_cost)
                trades.append({"date": rows[i]["date"], "side": "sell", "price": round(price, 2), "shares": round(shares, 4)})
                shares = 0.0
                open_trade_cost = None

            prev_signal = signal

        equity = cash + shares * price
        equity_curve.append({"date": rows[i]["date"], "equity": round(equity, 2)})

    final_capital = equity_curve[-1]["equity"]
    total_return_pct = ((final_capital - initial_capital) / initial_capital) * 100 if initial_capital > 0 else 0.0

    values = [p["equity"] for p in equity_curve]
    max_drawdown_pct = _max_drawdown(values)

    returns = []
    for i in range(1, len(values)):
        prev = values[i - 1]
        if prev > 0:
            returns.append((values[i] - prev) / prev)

    sharpe_ratio = 0.0
    if len(returns) > 1:
        avg = sum(returns) / len(returns)
        variance = sum((r - avg) ** 2 for r in returns) / (len(returns) - 1)
        std = variance ** 0.5
        if std > 0:
            sharpe_ratio = (avg / std) * sqrt(252)

    wins = len([x for x in trade_pnls if x > 0])
    losses = len([x for x in trade_pnls if x < 0])
    win_rate = (wins / len(trade_pnls) * 100) if trade_pnls else 0.0

    return {
        "symbol": symbol,
        "strategy": "sma_crossover",
        "parameters": {
            "short_window": short_window,
            "long_window": long_window,
        },
        "initial_capital": round(initial_capital, 2),
        "final_capital": round(final_capital, 2),
        "total_return_pct": round(total_return_pct, 2),
        "max_drawdown_pct": round(max_drawdown_pct, 2),
        "sharpe_ratio": round(sharpe_ratio, 2),
        "win_rate_pct": round(win_rate, 2),
        "total_trades": len([t for t in trades if t["side"] == "sell"]) + (1 if shares > 0 else 0),
        "wins": wins,
        "losses": losses,
        "equity_curve": equity_curve,
        "trades": trades,
    }


def save_backtest_run(
    db: Session,
    user_id: int,
    name: str | None,
    symbol: str,
    start_date: str,
    end_date: str,
    initial_capital: float,
    result: dict,
) -> BacktestRun:
    run = BacktestRun(
        user_id=user_id,
        name=name,
        symbol=symbol,
        strategy=result.get("parameters", {}),
        start_date=datetime.strptime(start_date, "%Y-%m-%d"),
        end_date=datetime.strptime(end_date, "%Y-%m-%d"),
        initial_capital=initial_capital,
        final_capital=result["final_capital"],
        total_return_pct=result["total_return_pct"],
        results=result,
    )
    db.add(run)
    db.commit()
    db.refresh(run)
    return run

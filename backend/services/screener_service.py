from sqlalchemy.orm import Session

from models.fundamental import Fundamental
from models.stock import Stock
from models.stock_screen import StockScreen, ScreenResult
from services.stock_service import get_daily_stock_data


def _matches_range(value: float | None, min_v: float | None, max_v: float | None) -> bool:
    if value is None:
        return False
    if min_v is not None and value < min_v:
        return False
    if max_v is not None and value > max_v:
        return False
    return True


def run_screener(db: Session, criteria: dict) -> list[dict]:
    rows = db.query(Fundamental).all()

    sector_filter = criteria.get("sector")
    limit = int(criteria.get("limit", 50))

    output = []
    for row in rows:
        if sector_filter and (row.sector or "").lower() != sector_filter.lower():
            continue

        if not _matches_range(row.market_cap, criteria.get("min_market_cap"), criteria.get("max_market_cap")):
            continue

        if not _matches_range(row.pe_ratio, criteria.get("min_pe_ratio"), criteria.get("max_pe_ratio")):
            continue

        if criteria.get("min_dividend_yield") is not None:
            if row.dividend_yield is None or row.dividend_yield < criteria.get("min_dividend_yield"):
                continue

        if criteria.get("min_revenue_growth") is not None:
            revenue_growth = getattr(row, "revenue_growth", None)
            if revenue_growth is None or revenue_growth < criteria.get("min_revenue_growth"):
                continue

        if criteria.get("min_profit_margin") is not None:
            if row.profit_margin is None or row.profit_margin < criteria.get("min_profit_margin"):
                continue

        stock_row = db.query(Stock).filter(Stock.symbol == row.symbol).first()
        market_data = stock_row.cached_data if stock_row and stock_row.cached_data else get_daily_stock_data(row.symbol, db)
        series = market_data.get("Time Series (Daily)", {}) if isinstance(market_data, dict) else {}
        if not series:
            continue
        dates = sorted(series.keys(), reverse=True)
        latest = series[dates[0]]
        current_price = float(latest.get("4. close", 0.0))
        volume = float(latest.get("5. volume", 0.0))

        prev_close = None
        if len(dates) > 1:
            prev_close = float(series[dates[1]].get("4. close", 0.0))
        price_change_pct = ((current_price - prev_close) / prev_close * 100) if prev_close and prev_close > 0 else 0.0

        if criteria.get("min_price") is not None and current_price < float(criteria.get("min_price")):
            continue
        if criteria.get("max_price") is not None and current_price > float(criteria.get("max_price")):
            continue
        if criteria.get("min_volume") is not None and volume < float(criteria.get("min_volume")):
            continue
        if criteria.get("min_price_change_pct") is not None and abs(price_change_pct) < float(criteria.get("min_price_change_pct")):
            continue

        score = 0.0
        revenue_growth = getattr(row, "revenue_growth", None)
        if revenue_growth is not None:
            score += max(0.0, revenue_growth)
        if row.profit_margin is not None:
            score += max(0.0, row.profit_margin)
        if row.dividend_yield is not None:
            score += row.dividend_yield * 0.5
        if row.pe_ratio is not None and row.pe_ratio > 0:
            score += max(0.0, 50 - row.pe_ratio) * 0.1
        score += max(0.0, abs(price_change_pct)) * 0.2

        output.append(
            {
                "symbol": row.symbol,
                "current_price": round(current_price, 4),
                "volume": round(volume, 2),
                "price_change_pct": round(price_change_pct, 2),
                "market_cap": row.market_cap,
                "pe_ratio": row.pe_ratio,
                "dividend_yield": row.dividend_yield,
                "revenue_growth": revenue_growth,
                "profit_margin": row.profit_margin,
                "sector": row.sector,
                "score": round(score, 2),
            }
        )

    output.sort(key=lambda x: x["score"], reverse=True)
    return output[:limit]


def save_screen(db: Session, user_id: int, name: str, description: str | None, criteria: dict) -> StockScreen:
    screen = StockScreen(
        user_id=user_id,
        name=name,
        description=description,
        criteria=criteria,
    )
    db.add(screen)
    db.commit()
    db.refresh(screen)
    return screen


def store_results(db: Session, screen_id: int, results: list[dict]) -> None:
    db.query(ScreenResult).filter(ScreenResult.screen_id == screen_id).delete()
    for row in results:
        db.add(
            ScreenResult(
                screen_id=screen_id,
                symbol=row["symbol"],
                score=row["score"],
                matching_criteria=row,
            )
        )
    db.commit()

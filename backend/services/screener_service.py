from sqlalchemy.orm import Session

from models.fundamental import Fundamental
from models.stock_screen import StockScreen, ScreenResult


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

        output.append(
            {
                "symbol": row.symbol,
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

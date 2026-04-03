from __future__ import annotations

import asyncio
import logging
from datetime import datetime

from sqlalchemy.orm import Session

from core.config import settings
from models.alert import Alert, AlertType
from models.notification import Notification
from services.realtime_service import alert_ws_manager
from services.stock_service import get_daily_stock_data

logger = logging.getLogger(__name__)


def _evaluate_alert(alert: Alert, current_price: float, prev_close: float | None) -> bool:
    if alert.alert_type == AlertType.ABOVE and alert.threshold_price is not None:
        return current_price >= alert.threshold_price
    if alert.alert_type == AlertType.BELOW and alert.threshold_price is not None:
        return current_price <= alert.threshold_price
    if alert.alert_type == AlertType.CHANGE_PERCENT and alert.change_percent is not None and prev_close and prev_close > 0:
        move_pct = abs((current_price - prev_close) / prev_close) * 100
        return move_pct >= alert.change_percent
    return False


def _build_notification(alert: Alert, current_price: float, prev_close: float | None) -> tuple[str, str, dict]:
    if alert.alert_type == AlertType.ABOVE:
        title = f"{alert.symbol} crossed above target"
        message = f"Price is {current_price:.2f}, above {alert.threshold_price:.2f}."
    elif alert.alert_type == AlertType.BELOW:
        title = f"{alert.symbol} dropped below target"
        message = f"Price is {current_price:.2f}, below {alert.threshold_price:.2f}."
    else:
        change_pct = 0.0
        if prev_close and prev_close > 0:
            change_pct = ((current_price - prev_close) / prev_close) * 100
        title = f"{alert.symbol} moved {abs(change_pct):.2f}%"
        message = f"Daily move is {change_pct:.2f}% and crossed {alert.change_percent:.2f}% threshold."

    payload = {
        "alert_id": alert.id,
        "symbol": alert.symbol,
        "alert_type": alert.alert_type.value if hasattr(alert.alert_type, "value") else str(alert.alert_type),
        "current_price": round(current_price, 4),
        "threshold_price": alert.threshold_price,
        "change_percent": alert.change_percent,
        "triggered_at": datetime.utcnow().isoformat(),
    }
    return title, message, payload


async def evaluate_active_alerts_once(db: Session) -> int:
    active_alerts = (
        db.query(Alert)
        .filter(Alert.is_active == True, Alert.triggered == False)
        .all()
    )

    triggered_count = 0

    for alert in active_alerts:
        data = get_daily_stock_data(alert.symbol, db)
        series = data.get("Time Series (Daily)", {}) if isinstance(data, dict) else {}
        if not series:
            continue

        dates = sorted(series.keys(), reverse=True)
        latest = series[dates[0]]
        current_price = float(latest.get("4. close", 0.0))
        prev_close = None
        if len(dates) > 1:
            prev_close = float(series[dates[1]].get("4. close", 0.0))

        if not _evaluate_alert(alert, current_price, prev_close):
            continue

        alert.triggered = True
        alert.triggered_at = datetime.utcnow()

        title, message, payload = _build_notification(alert, current_price, prev_close)
        db.add(
            Notification(
                user_id=alert.user_id,
                kind="alert_triggered",
                title=title,
                message=message,
                payload=payload,
            )
        )
        triggered_count += 1

    if triggered_count > 0:
        db.commit()

    # Push events after commit so the frontend can fetch consistent state.
    for alert in active_alerts:
        if not alert.triggered:
            continue
        await alert_ws_manager.send_to_user(
            alert.user_id,
            {
                "event": "alert_triggered",
                "alert_id": alert.id,
                "symbol": alert.symbol,
                "triggered_at": alert.triggered_at.isoformat() if alert.triggered_at else None,
            },
        )

    return triggered_count


async def run_alert_monitor_forever(session_factory):
    interval = max(10, settings.ALERT_MONITOR_INTERVAL_SECONDS)
    while True:
        db = session_factory()
        try:
            count = await evaluate_active_alerts_once(db)
            if count > 0:
                logger.info("Alert monitor triggered %s alerts", count)
        except Exception as exc:
            logger.exception("Alert monitor iteration failed: %s", exc)
            db.rollback()
        finally:
            db.close()

        await asyncio.sleep(interval)

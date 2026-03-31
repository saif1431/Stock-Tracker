import json
import logging
from datetime import datetime
from typing import Any

import redis

from core.config import settings

logger = logging.getLogger(__name__)

_redis_client: redis.Redis | None = None


def _json_default(value: Any) -> Any:
    if isinstance(value, datetime):
        return value.isoformat()
    return str(value)


def init_cache() -> None:
    """Initialize redis client once at startup; fail open if Redis is unavailable."""
    global _redis_client

    try:
        client = redis.Redis.from_url(settings.REDIS_URL, decode_responses=True)
        client.ping()
        _redis_client = client
        logger.info("Redis cache connected", extra={"redis_url": settings.REDIS_URL})
    except Exception as exc:
        _redis_client = None
        logger.warning("Redis cache unavailable; continuing without cache", extra={"error": str(exc)})


def cache_available() -> bool:
    return _redis_client is not None


def get_json(key: str) -> Any | None:
    if _redis_client is None:
        return None

    raw = _redis_client.get(key)
    if not raw:
        return None

    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return None


def set_json(key: str, value: Any, ttl_seconds: int) -> None:
    if _redis_client is None:
        return

    payload = json.dumps(value, default=_json_default)
    _redis_client.setex(key, ttl_seconds, payload)


def delete_pattern(pattern: str) -> int:
    if _redis_client is None:
        return 0

    total_deleted = 0
    for key in _redis_client.scan_iter(match=pattern, count=100):
        total_deleted += int(_redis_client.delete(key))
    return total_deleted

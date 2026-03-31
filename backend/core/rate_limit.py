import json
import threading
import time
from collections.abc import Callable
from dataclasses import dataclass

from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.types import ASGIApp
from jose import jwt, JWTError

from core import security
from core.cache import cache_available, get_json, set_json
from core.config import settings
from database.database import SessionLocal
from models.user import User


@dataclass
class LimitConfig:
    minute: int
    hour: int


RATE_LIMITS: dict[str, LimitConfig] = {
    "free": LimitConfig(minute=60, hour=1000),
    "premium": LimitConfig(minute=100, hour=1000),
    "enterprise": LimitConfig(minute=0, hour=0),
}

_memory_lock = threading.Lock()
_memory_store: dict[str, dict[str, int]] = {}


def reset_rate_limit_state() -> None:
    with _memory_lock:
        _memory_store.clear()


def _now_seconds() -> int:
    return int(time.time())


def _window_start(now: int, window_seconds: int) -> int:
    return now - (now % window_seconds)


def _cache_get_dict(key: str) -> dict[str, int] | None:
    value = get_json(key)
    if isinstance(value, dict):
        return {str(k): int(v) for k, v in value.items()}
    return None


def _cache_set_dict(key: str, value: dict[str, int], ttl_seconds: int) -> None:
    set_json(key, value, ttl_seconds)


def _in_memory_increment(key: str, field: str, ttl_seconds: int) -> int:
    now = _now_seconds()
    with _memory_lock:
        bucket = _memory_store.get(key)
        if not bucket or now >= int(bucket.get("expires_at", 0)):
            bucket = {"expires_at": now + ttl_seconds}
            _memory_store[key] = bucket
        current = int(bucket.get(field, 0)) + 1
        bucket[field] = current
        return current


def _increment_counter(identifier: str, window_seconds: int) -> tuple[int, int]:
    now = _now_seconds()
    start = _window_start(now, window_seconds)
    key = f"rate:{identifier}:{window_seconds}:{start}"
    ttl = max(window_seconds + 2, 10)

    # Prefer Redis-backed cache when available, fallback to local memory.
    if cache_available():
        payload = _cache_get_dict(key) or {"count": 0}
        payload["count"] = int(payload.get("count", 0)) + 1
        _cache_set_dict(key, payload, ttl)
        return int(payload["count"]), (start + window_seconds - now)

    count = _in_memory_increment(key, "count", ttl)
    return count, (start + window_seconds - now)


def _parse_user_from_token(request: Request) -> User | None:
    auth_header = request.headers.get("authorization")
    if not auth_header or not auth_header.lower().startswith("bearer "):
        return None

    token = auth_header.split(" ", 1)[1].strip()
    if not token:
        return None

    try:
        payload = jwt.decode(token, security.SECRET_KEY, algorithms=[security.ALGORITHM])
        username = payload.get("sub")
        if not username:
            return None
    except JWTError:
        return None

    db = SessionLocal()
    try:
        return db.query(User).filter(User.username == username).first()
    finally:
        db.close()


def _is_exempt_path(path: str) -> bool:
    return (
        path.startswith("/docs")
        or path.startswith("/redoc")
        or path.startswith("/openapi")
        or path.startswith("/health")
        or path == "/auth/login"
        or path == "/auth/register"
        or path == "/auth/login-2fa"
    )


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: ASGIApp, enabled: bool = True):
        super().__init__(app)
        self.enabled = enabled

    async def dispatch(self, request: Request, call_next: Callable):
        # CORS preflight requests should never consume API quotas.
        if request.method.upper() == "OPTIONS":
            return await call_next(request)

        if not self.enabled or _is_exempt_path(request.url.path):
            return await call_next(request)

        user = _parse_user_from_token(request)
        tier = "free"
        identifier = f"ip:{request.client.host if request.client else 'unknown'}"

        if user is not None:
            tier = (user.subscription or "free").lower()
            if tier not in RATE_LIMITS:
                tier = "free"
            identifier = f"user:{user.id}"

            # Admin override support.
            if user.is_admin:
                tier = "enterprise"

        limits = RATE_LIMITS[tier]

        # In local development, the dashboard triggers several concurrent polling calls.
        # Relax limits for localhost to avoid noisy 429s while preserving protection elsewhere.
        client_host = request.client.host if request.client else "unknown"
        if settings.DEBUG and client_host in {"127.0.0.1", "::1", "localhost"}:
            limits = LimitConfig(minute=max(limits.minute, 300), hour=max(limits.hour, 10000))

        if tier == "enterprise":
            return await call_next(request)

        minute_count, minute_retry = _increment_counter(identifier, 60)
        hour_count, hour_retry = _increment_counter(identifier, 3600)

        if minute_count > limits.minute or hour_count > limits.hour:
            retry_after = max(1, minute_retry if minute_count > limits.minute else hour_retry)
            return JSONResponse(
                status_code=429,
                content={
                    "error": "Rate limit exceeded",
                    "tier": tier,
                    "retry_after_seconds": retry_after,
                },
                headers={"Retry-After": str(retry_after)},
            )

        response = await call_next(request)
        response.headers["X-RateLimit-Tier"] = tier
        response.headers["X-RateLimit-Limit-Minute"] = str(limits.minute)
        response.headers["X-RateLimit-Remaining-Minute"] = str(max(0, limits.minute - minute_count))
        response.headers["X-RateLimit-Limit-Hour"] = str(limits.hour)
        response.headers["X-RateLimit-Remaining-Hour"] = str(max(0, limits.hour - hour_count))
        return response

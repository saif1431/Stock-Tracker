import threading
import time
from collections import deque

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.types import ASGIApp

_metrics_lock = threading.Lock()
_metrics = {
    "total_requests": 0,
    "error_requests": 0,
    "total_duration_ms": 0.0,
    "endpoints": {},
    "recent_timestamps": deque(),
}


def _prune_recent(now: float) -> None:
    cutoff = now - (24 * 60 * 60)
    timestamps = _metrics["recent_timestamps"]
    while timestamps and timestamps[0] < cutoff:
        timestamps.popleft()


def record_request(path: str, method: str, status_code: int, duration_ms: float) -> None:
    now = time.time()
    key = f"{method.upper()} {path}"

    with _metrics_lock:
        _prune_recent(now)
        _metrics["total_requests"] += 1
        _metrics["total_duration_ms"] += float(duration_ms)
        if int(status_code) >= 400:
            _metrics["error_requests"] += 1

        endpoints = _metrics["endpoints"]
        endpoint = endpoints.get(key, {"count": 0, "errors": 0, "avg_ms": 0.0})
        endpoint["count"] += 1
        if int(status_code) >= 400:
            endpoint["errors"] += 1
        endpoint["avg_ms"] = ((endpoint["avg_ms"] * (endpoint["count"] - 1)) + float(duration_ms)) / endpoint["count"]
        endpoints[key] = endpoint

        _metrics["recent_timestamps"].append(now)


def get_metrics_snapshot() -> dict:
    now = time.time()
    with _metrics_lock:
        _prune_recent(now)
        total = int(_metrics["total_requests"])
        errors = int(_metrics["error_requests"])
        avg_ms = float(_metrics["total_duration_ms"]) / total if total > 0 else 0.0
        error_rate = (errors / total * 100.0) if total > 0 else 0.0

        endpoints = [
            {
                "endpoint": endpoint,
                "count": int(data["count"]),
                "errors": int(data["errors"]),
                "avg_ms": round(float(data["avg_ms"]), 2),
            }
            for endpoint, data in _metrics["endpoints"].items()
        ]
        endpoints.sort(key=lambda item: item["count"], reverse=True)

        return {
            "total_requests": total,
            "error_requests": errors,
            "error_rate_percent": round(error_rate, 2),
            "average_response_ms": round(avg_ms, 2),
            "api_calls_24h": len(_metrics["recent_timestamps"]),
            "top_endpoints": endpoints[:10],
        }


class RequestMetricsMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: ASGIApp, enabled: bool = True):
        super().__init__(app)
        self.enabled = enabled

    async def dispatch(self, request: Request, call_next):
        if not self.enabled:
            return await call_next(request)

        start = time.perf_counter()
        try:
            response = await call_next(request)
            duration_ms = (time.perf_counter() - start) * 1000.0
            record_request(request.url.path, request.method, response.status_code, duration_ms)
            return response
        except Exception:
            duration_ms = (time.perf_counter() - start) * 1000.0
            record_request(request.url.path, request.method, 500, duration_ms)
            raise

from fastapi import APIRouter, Depends

from core.rate_limit import RATE_LIMITS
from models.user import User
from routes.auth_utils import get_current_user

router = APIRouter(prefix="/metrics", tags=["metrics"])


@router.get("/rate-limit")
def get_rate_limit_metrics(current_user: User = Depends(get_current_user)):
    tier = "enterprise" if current_user.is_admin else (current_user.subscription or "free").lower()
    if tier not in RATE_LIMITS:
        tier = "free"

    limits = RATE_LIMITS[tier]
    return {
        "tier": tier,
        "limits": {
            "per_minute": limits.minute,
            "per_hour": limits.hour,
        },
        "admin_override": bool(current_user.is_admin),
    }

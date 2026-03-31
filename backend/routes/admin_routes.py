from datetime import datetime
from io import StringIO
import csv

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import or_
from sqlalchemy import text
from fastapi.responses import StreamingResponse

from core.security import get_password_hash
from core.cache import cache_available
from core.request_metrics import get_metrics_snapshot
from core.config import settings
from database.database import get_db
from models.admin import AdminLog
from models.portfolio import Portfolio
from models.transaction import Transaction
from models.user import User
from routes.auth_utils import get_admin_user

router = APIRouter(prefix="/admin", tags=["admin"])


class BanUserRequest(BaseModel):
    reason: str = Field(min_length=3, max_length=250)


class ResetPasswordRequest(BaseModel):
    new_password: str = Field(min_length=8, max_length=128)


class UserStatusResponse(BaseModel):
    message: str
    user_id: int


def _database_size_mb(db: Session) -> float | None:
    if "postgresql" in settings.DATABASE_URL:
        result = db.execute(text("SELECT pg_database_size(current_database())")).scalar()
        if result is None:
            return None
        return round(float(result) / (1024 * 1024), 2)

    if "sqlite:///" in settings.DATABASE_URL:
        db_path = settings.DATABASE_URL.replace("sqlite:///", "", 1)
        try:
            import os

            size_bytes = os.path.getsize(db_path)
            return round(float(size_bytes) / (1024 * 1024), 2)
        except OSError:
            return None

    return None


def _system_health(db: Session) -> dict:
    db_ok = True
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        db_ok = False

    return {
        "database_connected": db_ok,
        "database_size_mb": _database_size_mb(db),
        "cache_connected": cache_available(),
    }


def _log_action(db: Session, admin_id: int, action: str, target_user_id: int | None, details: str | None = None) -> None:
    db.add(
        AdminLog(
            admin_id=admin_id,
            action=action,
            target_user_id=target_user_id,
            details=details,
            created_at=datetime.utcnow(),
        )
    )


@router.get("/dashboard")
def get_admin_dashboard(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_admin_user),
):
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.is_active == True, User.is_banned == False).count()
    banned_users = db.query(User).filter(User.is_banned == True).count()
    total_transactions = db.query(Transaction).count()
    portfolio_positions = db.query(Portfolio).count()
    api_usage = get_metrics_snapshot()
    health = _system_health(db)

    recent_actions = (
        db.query(AdminLog)
        .order_by(AdminLog.created_at.desc())
        .limit(10)
        .all()
    )

    return {
        "total_users": total_users,
        "active_users": active_users,
        "banned_users": banned_users,
        "total_transactions": total_transactions,
        "portfolio_positions": portfolio_positions,
        "api_usage": api_usage,
        "system_health": health,
        "recent_admin_actions": [
            {
                "id": action.id,
                "action": action.action,
                "target_user_id": action.target_user_id,
                "details": action.details,
                "created_at": action.created_at,
            }
            for action in recent_actions
        ],
        "requested_by": current_admin.username,
    }


@router.get("/users")
def list_users(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=200),
    search: str | None = Query(default=None, min_length=1, max_length=100),
    sort_by: str = Query(default="id", pattern="^(id|username|email|is_active|is_admin|is_banned|subscription)$"),
    sort_dir: str = Query(default="asc", pattern="^(asc|desc)$"),
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_admin_user),
):
    query = db.query(User)

    if search:
        like_pattern = f"%{search.strip()}%"
        query = query.filter(
            or_(
                User.username.ilike(like_pattern),
                User.email.ilike(like_pattern),
            )
        )

    sort_column = getattr(User, sort_by)
    query = query.order_by(sort_column.desc() if sort_dir == "desc" else sort_column.asc())
    users = query.offset(skip).limit(limit).all()
    return [
        {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "is_active": user.is_active,
            "is_admin": user.is_admin,
            "is_banned": user.is_banned,
            "ban_reason": user.ban_reason,
            "subscription": user.subscription,
            "two_fa_enabled": user.two_fa_enabled,
        }
        for user in users
    ]


@router.post("/users/{user_id}/ban")
def ban_user(
    user_id: int,
    payload: BanUserRequest,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_admin_user),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if user.is_admin:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Admin users cannot be banned")

    user.is_banned = True
    user.ban_reason = payload.reason
    _log_action(db, current_admin.id, "ban_user", user.id, payload.reason)
    db.commit()

    return {"message": "User banned", "user_id": user.id, "reason": payload.reason}


@router.post("/users/{user_id}/unban")
def unban_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_admin_user),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user.is_banned = False
    user.ban_reason = None
    _log_action(db, current_admin.id, "unban_user", user.id, "Removed ban")
    db.commit()

    return {"message": "User unbanned", "user_id": user.id}


@router.post("/users/{user_id}/deactivate", response_model=UserStatusResponse)
def deactivate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_admin_user),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if user.is_admin:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Admin users cannot be deactivated")

    user.is_active = False
    _log_action(db, current_admin.id, "deactivate_user", user.id, "Deactivated by admin")
    db.commit()

    return {"message": "User deactivated", "user_id": user.id}


@router.post("/users/{user_id}/reactivate", response_model=UserStatusResponse)
def reactivate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_admin_user),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user.is_active = True
    _log_action(db, current_admin.id, "reactivate_user", user.id, "Reactivated by admin")
    db.commit()

    return {"message": "User reactivated", "user_id": user.id}


@router.post("/users/{user_id}/reset-password")
def reset_user_password(
    user_id: int,
    payload: ResetPasswordRequest,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_admin_user),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user.hashed_password = get_password_hash(payload.new_password)
    _log_action(db, current_admin.id, "reset_password", user.id, "Password reset by admin")
    db.commit()

    return {"message": "Password reset", "user_id": user.id}


@router.get("/logs")
def get_admin_logs(
    limit: int = Query(default=100, ge=1, le=500),
    action: str | None = Query(default=None),
    admin_id: int | None = Query(default=None),
    target_user_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_admin_user),
):
    query = db.query(AdminLog)
    if action:
        query = query.filter(AdminLog.action == action)
    if admin_id is not None:
        query = query.filter(AdminLog.admin_id == admin_id)
    if target_user_id is not None:
        query = query.filter(AdminLog.target_user_id == target_user_id)

    logs = query.order_by(AdminLog.created_at.desc()).limit(limit).all()
    return [
        {
            "id": log.id,
            "admin_id": log.admin_id,
            "action": log.action,
            "target_user_id": log.target_user_id,
            "details": log.details,
            "created_at": log.created_at,
        }
        for log in logs
    ]


@router.get("/logs/export")
def export_admin_logs(
    limit: int = Query(default=500, ge=1, le=2000),
    action: str | None = Query(default=None),
    admin_id: int | None = Query(default=None),
    target_user_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_admin_user),
):
    query = db.query(AdminLog)
    if action:
        query = query.filter(AdminLog.action == action)
    if admin_id is not None:
        query = query.filter(AdminLog.admin_id == admin_id)
    if target_user_id is not None:
        query = query.filter(AdminLog.target_user_id == target_user_id)

    logs = query.order_by(AdminLog.created_at.desc()).limit(limit).all()

    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(["id", "admin_id", "action", "target_user_id", "details", "created_at"])
    for log in logs:
        writer.writerow([log.id, log.admin_id, log.action, log.target_user_id, log.details, log.created_at.isoformat()])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=admin_logs.csv"},
    )

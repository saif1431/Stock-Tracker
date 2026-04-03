from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database.database import get_db
from models.notification import Notification
from models.user import User
from routes.auth_utils import get_current_user

router = APIRouter(prefix="/notifications", tags=["notifications"])


def _serialize_notification(row: Notification) -> dict:
    return {
        "id": row.id,
        "user_id": row.user_id,
        "kind": row.kind,
        "title": row.title,
        "message": row.message,
        "payload": row.payload,
        "is_read": row.is_read,
        "created_at": row.created_at,
    }


@router.get("/")
def list_notifications(
    limit: int = 50,
    unread_only: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    safe_limit = min(max(limit, 1), 200)
    query = db.query(Notification).filter(Notification.user_id == current_user.id)
    if unread_only:
        query = query.filter(Notification.is_read == False)

    rows = (
        query.order_by(Notification.created_at.desc())
        .limit(safe_limit)
        .all()
    )
    return [_serialize_notification(row) for row in rows]


@router.patch("/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    row = (
        db.query(Notification)
        .filter(Notification.id == notification_id, Notification.user_id == current_user.id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Notification not found")

    row.is_read = True
    db.commit()
    db.refresh(row)
    return _serialize_notification(row)


@router.patch("/read-all")
def mark_all_notifications_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id, Notification.is_read == False)
        .update({"is_read": True}, synchronize_session=False)
    )
    db.commit()
    return {"message": "All notifications marked as read"}

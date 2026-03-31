from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String

from database.database import Base


class AdminLog(Base):
    __tablename__ = "admin_logs"

    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    action = Column(String(64), nullable=False)
    target_user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    details = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

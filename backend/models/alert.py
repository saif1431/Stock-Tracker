from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from database.database import Base
from datetime import datetime
import enum


class AlertType(str, enum.Enum):
    ABOVE = "above"  # Price goes above threshold
    BELOW = "below"  # Price goes below threshold
    CHANGE_PERCENT = "change_percent"  # Price changes by X%


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    symbol = Column(String(50), index=True, nullable=False)  # Increased from 10 to 50 for company names
    alert_type = Column(Enum(AlertType), nullable=False)
    threshold_price = Column(Float, nullable=True)  # For ABOVE/BELOW
    change_percent = Column(Float, nullable=True)  # For CHANGE_PERCENT
    is_active = Column(Boolean, default=True)
    triggered = Column(Boolean, default=False)
    triggered_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="alerts")

    def __repr__(self):
        return f"<Alert {self.symbol} {self.alert_type} threshold={self.threshold_price}>"

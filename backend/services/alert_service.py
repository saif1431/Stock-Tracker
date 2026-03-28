from typing import List, Optional
from sqlalchemy.orm import Session
from models.alert import Alert, AlertType
from models.user import User
from datetime import datetime


class AlertService:
    def __init__(self, db: Session):
        self.db = db

    def create_alert(
        self,
        user: User,
        symbol: str,
        alert_type: AlertType,
        threshold_price: Optional[float] = None,
        change_percent: Optional[float] = None
    ) -> Alert:
        """Create a new price alert"""
        alert = Alert(
            user_id=user.id,
            symbol=symbol.upper(),
            alert_type=alert_type,
            threshold_price=threshold_price,
            change_percent=change_percent
        )
        self.db.add(alert)
        self.db.commit()
        self.db.refresh(alert)
        return alert

    def get_user_alerts(self, user_id: int) -> List[Alert]:
        """Get all alerts for a user"""
        return self.db.query(Alert).filter(Alert.user_id == user_id).all()

    def get_alert_by_id(self, alert_id: int) -> Optional[Alert]:
        """Get a specific alert by ID"""
        return self.db.query(Alert).filter(Alert.id == alert_id).first()

    def delete_alert(self, alert_id: int) -> bool:
        """Delete an alert"""
        alert = self.db.query(Alert).filter(Alert.id == alert_id).first()
        if alert:
            self.db.delete(alert)
            self.db.commit()
            return True
        return False

    def toggle_alert_active(self, alert_id: int) -> Optional[Alert]:
        """Toggle alert active status"""
        alert = self.db.query(Alert).filter(Alert.id == alert_id).first()
        if alert:
            alert.is_active = not alert.is_active
            self.db.commit()
            self.db.refresh(alert)
            return alert
        return None

    def reset_alert_triggered_status(self, alert_id: int) -> Optional[Alert]:
        """Reset alert triggered status"""
        alert = self.db.query(Alert).filter(Alert.id == alert_id).first()
        if alert:
            alert.triggered = False
            alert.triggered_at = None
            self.db.commit()
            self.db.refresh(alert)
            return alert
        return None

    def get_active_alerts(self) -> List[Alert]:
        """Get all active, non-triggered alerts"""
        return self.db.query(Alert).filter(
            Alert.is_active == True,
            Alert.triggered == False
        ).all()

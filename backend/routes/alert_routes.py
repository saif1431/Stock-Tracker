from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database.database import get_db
from models.user import User
from models.alert import Alert, AlertType
from services.alert_service import AlertService
from routes.auth_utils import get_current_user
from pydantic import BaseModel, field_validator
from typing import List, Optional
from datetime import datetime

router = APIRouter(prefix="/stock", tags=["alerts"])


class AlertCreate(BaseModel):
    symbol: str
    alert_type: str  # Changed to str for more flexible validation
    threshold_price: Optional[float] = None
    change_percent: Optional[float] = None

    class Config:
        use_enum_values = True
    
    @field_validator('symbol')
    @classmethod
    def validate_symbol(cls, v):
        if not v or not v.strip():
            raise ValueError("Symbol is required")
        return v.upper()
    
    @field_validator('alert_type')
    @classmethod
    def validate_alert_type(cls, v):
        if not v or not v.strip():
            raise ValueError("Alert type is required")
        alert_type = v.lower()
        valid_types = ["above", "below", "change_percent"]
        if alert_type not in valid_types:
            raise ValueError(f"Invalid alert type. Must be one of: {', '.join(valid_types)}")
        return alert_type


class AlertResponse(BaseModel):
    id: int
    symbol: str
    alert_type: str
    threshold_price: Optional[float] = None
    change_percent: Optional[float] = None
    is_active: bool
    triggered: bool
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True
    
    @field_validator('alert_type', mode='before')
    @classmethod
    def serialize_alert_type(cls, v):
        """Convert AlertType enum to string value"""
        if isinstance(v, AlertType):
            return v.value
        return str(v).lower()
    
    @field_validator('created_at', 'updated_at', mode='before')
    @classmethod
    def serialize_datetime(cls, v):
        """Convert datetime to ISO string"""
        if hasattr(v, 'isoformat'):
            return v.isoformat()
        return str(v)


@router.post("/alerts", response_model=AlertResponse)
async def create_alert(
    alert_data: AlertCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new price alert for a stock"""
    try:
        # Validate input
        if not alert_data.symbol or not alert_data.symbol.strip():
            raise ValueError("Symbol is required")
        
        # Convert string to AlertType enum
        alert_type_str = alert_data.alert_type.lower()
        
        # Map string values to AlertType enum
        alert_type_map = {
            "above": AlertType.ABOVE,
            "below": AlertType.BELOW,
            "change_percent": AlertType.CHANGE_PERCENT,
        }
        
        if alert_type_str not in alert_type_map:
            raise ValueError(f"Invalid alert type: {alert_data.alert_type}. Must be 'above', 'below', or 'change_percent'")
        
        alert_type = alert_type_map[alert_type_str]
        
        # Validate threshold values
        if alert_type in [AlertType.ABOVE, AlertType.BELOW]:
            if alert_data.threshold_price is None or alert_data.threshold_price <= 0:
                raise ValueError(f"Threshold price must be provided and be greater than 0 for {alert_type_str} alerts")
        
        if alert_type == AlertType.CHANGE_PERCENT:
            if alert_data.change_percent is None or alert_data.change_percent <= 0:
                raise ValueError("Change percentage must be provided and be greater than 0 for change_percent alerts")
        
        service = AlertService(db)
        alert = service.create_alert(
            current_user,
            alert_data.symbol.upper(),
            alert_type,
            alert_data.threshold_price,
            alert_data.change_percent
        )
        return alert
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error creating alert: {str(e)}")


@router.get("/alerts", response_model=List[AlertResponse])
async def get_user_alerts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all alerts for current user"""
    try:
        service = AlertService(db)
        alerts = service.get_user_alerts(current_user.id)
        print(f"DEBUG: Fetched {len(alerts)} alerts for user {current_user.id}")
        return alerts
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error fetching alerts: {str(e)}")


@router.get("/alerts/{alert_id}", response_model=AlertResponse)
async def get_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific alert"""
    service = AlertService(db)
    alert = service.get_alert_by_id(alert_id)
    
    if not alert or alert.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    return alert


@router.delete("/alerts/{alert_id}")
async def delete_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete an alert"""
    service = AlertService(db)
    alert = service.get_alert_by_id(alert_id)
    
    if not alert or alert.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    service.delete_alert(alert_id)
    return {"message": "Alert deleted successfully"}


@router.patch("/alerts/{alert_id}/toggle")
async def toggle_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Toggle alert active/inactive status"""
    service = AlertService(db)
    alert = service.get_alert_by_id(alert_id)
    
    if not alert or alert.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    updated_alert = service.toggle_alert_active(alert_id)
    return {
        "message": f"Alert {'activated' if updated_alert.is_active else 'deactivated'}",
        "alert": updated_alert
    }


@router.patch("/alerts/{alert_id}/reset")
async def reset_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Reset alert triggered status"""
    service = AlertService(db)
    alert = service.get_alert_by_id(alert_id)
    
    if not alert or alert.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    updated_alert = service.reset_alert_triggered_status(alert_id)
    return {
        "message": "Alert reset successfully",
        "alert": updated_alert
    }

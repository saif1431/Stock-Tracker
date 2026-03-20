from pydantic import BaseModel
from typing import Optional

class PortfolioBase(BaseModel):
    symbol: str
    quantity: float
    average_price: float

class PortfolioCreate(PortfolioBase):
    pass

class PortfolioUpdate(BaseModel):
    quantity: Optional[float] = None
    average_price: Optional[float] = None

class PortfolioResponse(PortfolioBase):
    id: int
    user_id: int
    current_price: float = 0.0
    profit_loss: float = 0.0
    profit_loss_percent: float = 0.0

    class Config:
        from_attributes = True

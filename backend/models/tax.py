from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String

from database.database import Base


class CapitalGain(Base):
    __tablename__ = "capital_gains"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    symbol = Column(String(16), nullable=False, index=True)
    purchase_date = Column(DateTime, nullable=False)
    sale_date = Column(DateTime, nullable=False)
    purchase_price = Column(Float, nullable=False)
    sale_price = Column(Float, nullable=False)
    quantity = Column(Float, nullable=False)
    gain_loss = Column(Float, nullable=False)
    holding_period = Column(String(16), nullable=False)
    year = Column(Integer, nullable=False, index=True)

from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, Index
from sqlalchemy.orm import relationship
from database.database import Base


class PaperTradingAccount(Base):
    __tablename__ = "paper_trading_accounts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    initial_balance = Column(Float, nullable=False)
    current_balance = Column(Float, nullable=False)
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    positions = relationship("PaperPosition", back_populates="account", cascade="all, delete-orphan")
    transactions = relationship("PaperTransaction", back_populates="account", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_paper_account_user", "user_id"),
    )


class PaperPosition(Base):
    __tablename__ = "paper_positions"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey("paper_trading_accounts.id"), nullable=False, index=True)
    symbol = Column(String, nullable=False, index=True)
    quantity = Column(Float, nullable=False)
    average_cost = Column(Float, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    account = relationship("PaperTradingAccount", back_populates="positions")

    __table_args__ = (
        Index("idx_paper_position_account_symbol", "account_id", "symbol"),
    )


class PaperTransaction(Base):
    __tablename__ = "paper_transactions"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey("paper_trading_accounts.id"), nullable=False, index=True)
    symbol = Column(String, nullable=False, index=True)
    transaction_type = Column(String, nullable=False)  # buy / sell
    quantity = Column(Float, nullable=False)
    price = Column(Float, nullable=False)
    total_value = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    account = relationship("PaperTradingAccount", back_populates="transactions")

    __table_args__ = (
        Index("idx_paper_tx_account_created", "account_id", "created_at"),
    )

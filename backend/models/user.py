from sqlalchemy import Boolean, Column, Integer, JSON, String
from sqlalchemy.orm import relationship
from database.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False, nullable=False)
    is_banned = Column(Boolean, default=False, nullable=False)
    ban_reason = Column(String, nullable=True)
    subscription = Column(String, default="free", nullable=False)

    two_fa_enabled = Column(Boolean, default=False, nullable=False)
    two_fa_secret = Column(String, nullable=True)
    backup_codes = Column(JSON, nullable=True)

    # Relationship to Watchlist
    watchlist_items = relationship("Watchlist", back_populates="user", cascade="all, delete-orphan")
    # Relationship to Portfolio
    portfolio_items = relationship("Portfolio", back_populates="user", cascade="all, delete-orphan")
    # Relationship to Alerts
    alerts = relationship("Alert", back_populates="user", cascade="all, delete-orphan")
    # Relationship to Transactions
    transactions = relationship("Transaction", back_populates="user", cascade="all, delete-orphan")

    # Social relationships
    profile = relationship("UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    followers = relationship(
        "Follow",
        foreign_keys="Follow.following_id",
        back_populates="following",
        cascade="all, delete-orphan",
    )
    following = relationship(
        "Follow",
        foreign_keys="Follow.follower_id",
        back_populates="follower",
        cascade="all, delete-orphan",
    )
    portfolio_shares = relationship("PortfolioShare", back_populates="user", cascade="all, delete-orphan")
    discussions = relationship("StockDiscussion", back_populates="user", cascade="all, delete-orphan")
    discussion_comments = relationship("DiscussionComment", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User(username='{self.username}', email='{self.email}')>"

from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.db.session import Base

class UserAnalytics(Base):
    __tablename__ = "user_analytics"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True)
    total_chats = Column(Integer, default=0)
    total_pdfs = Column(Integer, default=0)
    active_time_minutes = Column(Float, default=0)
    messages_sent = Column(Integer, default=0)
    messages_received = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Weekly/daily usage metrics for charts
    daily_usage = relationship("DailyUsage", back_populates="analytics")

class DailyUsage(Base):
    __tablename__ = "daily_usage"

    id = Column(Integer, primary_key=True, index=True)
    analytics_id = Column(Integer, ForeignKey("user_analytics.id"))
    date = Column(DateTime(timezone=True), index=True)
    minutes_active = Column(Float, default=0)
    chats_created = Column(Integer, default=0)
    pdfs_uploaded = Column(Integer, default=0)
    messages_sent = Column(Integer, default=0)
    
    analytics = relationship("UserAnalytics", back_populates="daily_usage") 
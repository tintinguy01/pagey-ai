from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from datetime import datetime, timedelta, UTC
import random

from app.db.session import get_db
from app.models.analytics import UserAnalytics, DailyUsage
from app.db.models import User, Chat, Document, Message

router = APIRouter()

@router.get("/{user_id}")
def get_user_analytics(user_id: str, db: Session = Depends(get_db)):
    """Get analytics for a specific user"""
    # Only count non-archived chats
    chats = db.query(Chat).filter(Chat.user_id == user_id, Chat.is_archived == False).all()
    chat_ids = [c.id for c in chats]
    total_chats = len(chats)

    # Only count PDFs linked to non-archived chats
    # Find all documents linked to at least one non-archived chat
    doc_ids = set()
    for chat in chats:
        for doc in chat.documents:
            doc_ids.add(doc.id)
    total_pdfs = len(doc_ids)

    # Get user's message counts (for non-archived chats only)
    messages = db.query(Message).filter(Message.chat_id.in_(chat_ids)).all()
    messages_sent = len([m for m in messages if m.role == "user"])
    messages_received = len([m for m in messages if m.role == "assistant"])

    # Estimate active time based on chat and message count
    estimated_active_time = max(30, (messages_sent + messages_received) * 1.5)

    # Get or create analytics record (for legacy reasons, but always return live data)
    analytics = db.query(UserAnalytics).filter(UserAnalytics.user_id == user_id).first()
    if not analytics:
        analytics = UserAnalytics(
            user_id=user_id,
            total_chats=total_chats,
            total_pdfs=total_pdfs,
            active_time_minutes=estimated_active_time,
            messages_sent=messages_sent,
            messages_received=messages_received
        )
        db.add(analytics)
        db.commit()
        db.refresh(analytics)
    else:
        analytics.total_chats = total_chats
        analytics.total_pdfs = total_pdfs
        analytics.active_time_minutes = estimated_active_time
        analytics.messages_sent = messages_sent
        analytics.messages_received = messages_received
        db.commit()

    # Get daily usage data for charts (only for non-archived chats and their PDFs)
    daily_data = get_daily_usage_data_filtered(db, analytics.id, chat_ids)

    return {
        "overview": {
            "total_chats": total_chats,
            "total_pdfs": total_pdfs,
            "active_time_minutes": int(estimated_active_time),
            "messages_sent": messages_sent,
            "messages_received": messages_received,
        },
        "daily_usage": daily_data
    }

def get_daily_usage_data_filtered(db: Session, analytics_id: int, chat_ids: list) -> Dict[str, list]:
    """Get daily usage data for charts, only for non-archived chats and their PDFs"""
    # Get all DailyUsage records for this analytics_id
    daily_records = db.query(DailyUsage).filter(
        DailyUsage.analytics_id == analytics_id
    ).order_by(DailyUsage.date).all()

    # Recompute daily stats for only non-archived chats and their PDFs
    # Get all messages, chats, and documents for these chat_ids
    chats = db.query(Chat).filter(Chat.id.in_(chat_ids)).all()
    chat_dates = {c.id: c.created_at.date() for c in chats}
    docs = []
    for chat in chats:
        docs.extend(chat.documents)
    doc_dates = [d.upload_date.date() for d in docs]
    messages = db.query(Message).filter(Message.chat_id.in_(chat_ids)).all()
    message_dates = [(m.timestamp.date(), m.role) for m in messages]

    # Prepare daily data dictionary
    today = datetime.now(UTC).date()
    daily_data = {}
    for i in range(14):
        date = today - timedelta(days=i)
        daily_data[date] = {
            "minutes_active": 0,
            "chats_created": 0,
            "pdfs_uploaded": 0,
            "messages_sent": 0
        }

    # Count messages by date
    for msg_date, role in message_dates:
        if msg_date in daily_data:
            if role == "user":
                daily_data[msg_date]["messages_sent"] += 1
            daily_data[msg_date]["minutes_active"] += 1.5

    # Count chats created by date
    for chat_id, chat_date in chat_dates.items():
        if chat_date in daily_data:
            daily_data[chat_date]["chats_created"] += 1
            daily_data[chat_date]["minutes_active"] += 2

    # Count PDFs uploaded by date
    for doc_date in doc_dates:
        if doc_date in daily_data:
            daily_data[doc_date]["pdfs_uploaded"] += 1
            daily_data[doc_date]["minutes_active"] += 3

    # Format data for charts
    dates = []
    minutes = []
    chats_ = []
    pdfs = []
    messages_ = []
    for i in range(14):
        date = today - timedelta(days=i)
        date_str = date.strftime("%m/%d")
        dates.insert(0, date_str)
        minutes.insert(0, daily_data[date]["minutes_active"])
        chats_.insert(0, daily_data[date]["chats_created"])
        pdfs.insert(0, daily_data[date]["pdfs_uploaded"])
        messages_.insert(0, daily_data[date]["messages_sent"])
    return {
        "dates": dates,
        "minutes": minutes,
        "chats": chats_,
        "pdfs": pdfs,
        "messages": messages_
    }

@router.post("/{user_id}/track-activity")
def track_user_activity(
    user_id: str, 
    minutes: float = Body(..., embed=True),
    db: Session = Depends(get_db)
):
    """Track user activity time"""
    today = datetime.now(UTC).date()
    
    # Get or create analytics for this user
    analytics = db.query(UserAnalytics).filter(UserAnalytics.user_id == user_id).first()
    if not analytics:
        analytics = UserAnalytics(
            user_id=user_id,
            total_chats=0,
            total_pdfs=0,
            active_time_minutes=minutes,
            messages_sent=0,
            messages_received=0
        )
        db.add(analytics)
        db.commit()
        db.refresh(analytics)
    else:
        # Update total active time
        analytics.active_time_minutes += minutes
        db.commit()
    
    # Update daily usage for today
    daily_usage = db.query(DailyUsage).filter(
        DailyUsage.analytics_id == analytics.id,
        DailyUsage.date == today
    ).first()
    
    if daily_usage:
        daily_usage.minutes_active += minutes
        db.commit()
    else:
        daily_usage = DailyUsage(
            analytics_id=analytics.id,
            date=today,
            minutes_active=minutes,
            chats_created=0,
            pdfs_uploaded=0,
            messages_sent=0
        )
        db.add(daily_usage)
        db.commit()
    
    return {"status": "success"} 
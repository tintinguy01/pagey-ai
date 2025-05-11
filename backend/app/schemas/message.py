from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel
from app.schemas.source import Source

class MessageBase(BaseModel):
    """Base message schema"""
    content: str
    role: str  # "user" or "assistant"

class MessageCreate(MessageBase):
    """Message creation schema"""
    chat_id: int

class Message(MessageBase):
    """Message response schema"""
    id: int
    chat_id: int
    timestamp: datetime
    sources: List[Source] = []
    
    class Config:
        from_attributes = True

class MessageInDB(Message):
    """Message in database schema"""
    pass 
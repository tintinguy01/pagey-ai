from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel
from app.schemas.document import Document
from app.schemas.message import Message

class ChatBase(BaseModel):
    """Base chat schema"""
    title: str

class ChatCreate(ChatBase):
    """Chat creation schema"""
    user_id: str
    
class ChatUpdate(BaseModel):
    """Chat update schema"""
    title: Optional[str] = None
    is_archived: Optional[bool] = None

class Chat(ChatBase):
    """Chat response schema"""
    id: int
    user_id: str
    is_archived: bool
    created_at: datetime
    last_active: datetime
    preview: Optional[str] = None
    document_count: int
    message_count: int
    
    class Config:
        from_attributes = True

class ChatDetail(Chat):
    """Detailed chat response schema including messages and documents"""
    documents: List[Document] = []
    messages: List[Message] = [] 
from typing import List, Optional
from pydantic import BaseModel
from app.schemas.source import SourceBase

class ChatSource(SourceBase):
    """Source reference in AI responses"""
    file: str

class ChatRequest(BaseModel):
    """Chat request schema for AI conversation"""
    message: str
    chat_id: int

class ChatResponse(BaseModel):
    """Chat response schema for AI conversation"""
    id: int
    content: str
    role: str
    sources: Optional[List[ChatSource]] = None 
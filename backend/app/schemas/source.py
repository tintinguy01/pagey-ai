from typing import Optional, List
from pydantic import BaseModel

class SourceBase(BaseModel):
    """Base source schema"""
    page: int
    highlight: str  # The actual highlighted text from the PDF (required)
    line_start: Optional[int] = None
    line_end: Optional[int] = None
    content: Optional[str] = None
    key_phrases: Optional[List[str]] = None  # Key phrases for bidirectional highlighting

class SourceCreate(SourceBase):
    """Source creation schema"""
    document_id: int
    message_id: int
    key_phrases: Optional[List[str]] = None

class Source(SourceBase):
    """Source response schema"""
    id: int
    message_id: int
    document_id: int
    file: str  # Document name (added by API)
    
    class Config:
        from_attributes = True 
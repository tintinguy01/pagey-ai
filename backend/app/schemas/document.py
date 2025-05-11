from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel

class DocumentBase(BaseModel):
    """Base document schema"""
    name: str
    size: int
    pages: int

class DocumentCreate(DocumentBase):
    """Document creation schema"""
    user_id: str
    chat_id: Optional[int] = None
    content_type: Optional[str] = "application/pdf"

class Document(DocumentBase):
    """Document response schema"""
    id: int
    user_id: str
    upload_date: datetime
    content_type: str = "application/pdf"
    file_url: Optional[str] = None
    
    class Config:
        from_attributes = True

class DocumentInDB(Document):
    """Document in database schema"""
    file_path: str

class PageContent(BaseModel):
    """Page content schema"""
    page_number: int
    text: str
    title: Optional[str] = None

class ExtractedPDFData(BaseModel):
    """Extracted PDF data schema"""
    total_pages: int
    extracted_text: str
    page_contents: List[PageContent] 
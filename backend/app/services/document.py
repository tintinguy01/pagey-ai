import os
import uuid
from typing import List, Optional
from fastapi import UploadFile
import aiofiles
from sqlalchemy.orm import Session
from app.db import models
from app.schemas import document as schemas
from app.core.config import settings
from app.services.pdf import extract_pdf_content
from app.services.chat import add_document_to_chat
import pdfplumber
import pytesseract
pytesseract.pytesseract.tesseract_cmd = r"C:\\Program Files\\Tesseract-OCR\\tesseract.exe"
import logging
logger = logging.getLogger(__name__)

async def create_document(db: Session, file: UploadFile, user_id: str, chat_id: Optional[int] = None):
    """Create a new document record and save the file"""
    # Generate unique filename
    file_ext = os.path.splitext(file.filename)[1]
    filename = f"{uuid.uuid4()}{file_ext}"
    
    # Save file to uploads directory
    file_path = os.path.join(settings.UPLOAD_DIR, filename)
    
    # Ensure the directory exists
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    
    # Save file to disk
    async with aiofiles.open(file_path, 'wb') as out_file:
        content = await file.read()
        await out_file.write(content)
    # Always reset file pointer before extracting content
    await file.seek(0)
    pdf_data = await extract_pdf_content(file)
    
    # Create public file URL that can be accessed directly
    file_url = f"/uploads/{filename}"
    
    # Create document record
    db_document = models.Document(
        name=file.filename,
        size=os.path.getsize(file_path),
        pages=pdf_data.total_pages,
        user_id=user_id,
        file_path=file_path,
        content_type=file.content_type,
        file_url=file_url,  # Add the public URL
    )
    
    db.add(db_document)
    db.commit()
    db.refresh(db_document)
    
    # Store extracted page content
    for page in pdf_data.page_contents:
        db_content = models.DocumentContent(
            document_id=db_document.id,
            page_number=page.page_number,
            content=page.text,
        )
        db.add(db_content)
    
    db.commit()
    
    # Associate with chat if provided
    if chat_id:
        add_document_to_chat(db, chat_id, db_document.id)
    
    return db_document

def get_document_by_id(db: Session, document_id: int):
    """Get a document by ID"""
    return db.query(models.Document).filter(models.Document.id == document_id).first()

def get_documents_by_user_id(db: Session, user_id: str) -> List[models.Document]:
    """Get all documents for a user"""
    return db.query(models.Document).filter(models.Document.user_id == user_id).all()

def get_documents_by_chat_id(db: Session, chat_id: int) -> List[models.Document]:
    """Get all documents for a chat"""
    chat = db.query(models.Chat).filter(models.Chat.id == chat_id).first()
    if chat:
        return chat.documents
    return []

def delete_document_by_id(db: Session, document_id: int):
    """Delete a document and its file"""
    db_document = get_document_by_id(db, document_id)
    if db_document:
        # Delete file from disk if it exists
        if os.path.exists(db_document.file_path):
            os.remove(db_document.file_path)
        
        # Delete from database
        db.delete(db_document)
        db.commit()
    return True 
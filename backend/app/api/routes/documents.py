from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query, Response
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.document import (
    get_document_by_id, get_documents_by_user_id,
    get_documents_by_chat_id, create_document,
    delete_document_by_id
)
from app.schemas.document import Document
from app.core.config import settings
import os
import mimetypes

router = APIRouter()

@router.get("/", response_model=List[Document])
async def read_documents(
    user_id: Optional[str] = Query(None, description="Filter by user ID"),
    chat_id: Optional[int] = Query(None, description="Filter by chat ID"),
    db: Session = Depends(get_db)
):
    """
    Get documents
    
    This endpoint returns documents, filtered by user ID and/or chat ID.
    """
    if chat_id:
        return get_documents_by_chat_id(db, chat_id)
    elif user_id:
        return get_documents_by_user_id(db, user_id)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either user_id or chat_id is required",
        )

@router.get("/content/{document_id}")
async def get_document_content(document_id: int, db: Session = Depends(get_db)):
    """
    Get document content directly
    
    This endpoint returns the document file content directly.
    """
    document = get_document_by_id(db, document_id)
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )
    
    if not document.file_path or not os.path.exists(document.file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document file not found",
        )
    
    try:
        with open(document.file_path, "rb") as file:
            content = file.read()
            
        content_type = document.content_type or mimetypes.guess_type(document.file_path)[0] or "application/pdf"
        
        return Response(
            content=content,
            media_type=content_type,
            headers={
                "Content-Disposition": f"inline; filename={document.name}",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
                "Cache-Control": "public, max-age=86400",
                "Content-Length": str(len(content))
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error reading document file: {str(e)}",
        )

@router.post("/", response_model=Document, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    user_id: str = Form(...),
    chat_id: Optional[int] = Form(None),
    db: Session = Depends(get_db)
):
    """
    Upload a document
    
    This endpoint uploads a document file (PDF) and associates it with a chat and/or user.
    """
    # Check file size
    file_size = 0
    content = await file.read()
    file_size = len(content)
    await file.seek(0)  # Reset file position
    
    if file_size > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Maximum size is {settings.MAX_UPLOAD_SIZE / 1024 / 1024} MB",
        )
    
    # Check file type
    if not file.content_type.startswith("application/pdf"):
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Only PDF files are supported",
        )
    
    return await create_document(db=db, file=file, user_id=user_id, chat_id=chat_id)

@router.get("/{document_id}", response_model=Document)
async def read_document(document_id: int, db: Session = Depends(get_db)):
    """
    Get document by ID
    
    This endpoint returns a document by its ID.
    """
    document = get_document_by_id(db, document_id)
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )
    return document

@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(document_id: int, db: Session = Depends(get_db)):
    """
    Delete document
    
    This endpoint deletes a document and its content.
    """
    document = get_document_by_id(db, document_id)
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )
    delete_document_by_id(db=db, document_id=document_id)
    return None 
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.message import (
    get_messages_by_chat_id, create_message,
    get_message_by_id
)
from app.schemas.message import Message, MessageCreate
from app.schemas.chat import ChatDetail
import logging

router = APIRouter()

@router.get("/", response_model=List[Message])
async def read_messages(
    chat_id: int = Query(..., description="Chat ID to filter messages"),
    db: Session = Depends(get_db)
):
    """
    Get all messages for a chat
    
    This endpoint returns all messages for a given chat.
    """
    messages = get_messages_by_chat_id(db, chat_id)
    # Sort messages by timestamp ascending
    messages = sorted(messages, key=lambda m: m.timestamp)
    filtered = []
    i = 0
    while i < len(messages):
        msg = messages[i]
        filtered.append(msg)
        if msg.role == "user":
            # Find the first assistant message after this user message
            for j in range(i+1, len(messages)):
                if messages[j].role == "assistant":
                    filtered.append(messages[j])
                    i = j
                    break
        i += 1
    def serialize_source(source):
        # Get document name for the 'file' field
        file = source.document.name if source.document else "Unknown"
        return {
            "id": source.id,
            "message_id": source.message_id,
            "document_id": source.document_id,
            "file": file,
            "page": source.page,
            "highlight": source.highlight,
            "line_start": source.line_start,
            "line_end": source.line_end,
            "content": source.content,
        }
    def serialize_message(msg):
        return {
            "id": msg.id,
            "chat_id": msg.chat_id,
            "content": msg.content,
            "role": msg.role,
            "timestamp": msg.timestamp,
            "sources": [serialize_source(s) for s in msg.sources] if msg.sources else [],
        }
    for msg in filtered:
        if msg.role == "assistant":
            logger = logging.getLogger(__name__)
            logger.info(f"API returning message (id={msg.id}): {msg.content}")
    return [serialize_message(msg) for msg in filtered]

@router.post("/", response_model=Message, status_code=status.HTTP_201_CREATED)
async def create_new_message(message: MessageCreate, db: Session = Depends(get_db)):
    """
    Create a new message
    
    This endpoint creates a new message in a chat.
    """
    return create_message(db=db, message=message)

@router.get("/{message_id}", response_model=Message)
async def read_message(message_id: int, db: Session = Depends(get_db)):
    """
    Get message by ID
    
    This endpoint returns a message by its ID.
    """
    message = get_message_by_id(db, message_id)
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found",
        )
    return message

@router.get("/{chat_id}", response_model=ChatDetail)
async def read_chat(chat_id: int, db: Session = Depends(get_db)):
    chat = get_chat_by_id(db, chat_id)
    if not chat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat not found",
        )
    def serialize_source(source):
        file = source.document.name if source.document else "Unknown"
        return {
            "id": source.id,
            "message_id": source.message_id,
            "document_id": source.document_id,
            "file": file,
            "page": source.page,
            "highlight": source.highlight,
            "line_start": source.line_start,
            "line_end": source.line_end,
            "content": source.content,
        }
    def serialize_message(msg):
        return {
            "id": msg.id,
            "chat_id": msg.chat_id,
            "content": msg.content,
            "role": msg.role,
            "timestamp": msg.timestamp,
            "sources": [serialize_source(s) for s in msg.sources] if msg.sources else [],
        }
    return {
        "id": chat.id,
        "title": chat.title,
        "user_id": chat.user_id,
        "document_count": len(chat.documents),
        "message_count": len(chat.messages),
        "is_archived": chat.is_archived,
        "last_active": chat.last_active,
        "preview": chat.preview,
        "created_at": chat.created_at,
        "documents": list(chat.documents),
        "messages": [serialize_message(m) for m in chat.messages],
    } 
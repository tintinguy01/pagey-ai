from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.db import models
from app.schemas import message as schemas
from app.services.chat import update_chat_last_active, update_chat_preview
import logging

def get_message_by_id(db: Session, message_id: int):
    """Get a message by ID"""
    return db.query(models.Message).filter(models.Message.id == message_id).first()

def get_messages_by_chat_id(db: Session, chat_id: int) -> List[models.Message]:
    """Get all messages for a chat, ordered by timestamp"""
    return (
        db.query(models.Message)
        .filter(models.Message.chat_id == chat_id)
        .order_by(models.Message.timestamp)
        .all()
    )

def create_message(db: Session, message: schemas.MessageCreate):
    """Create a new message"""
    db_message = models.Message(
        chat_id=message.chat_id,
        content=message.content,
        role=message.role,
    )
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    
    # Update chat last_active and preview
    update_chat_last_active(db, message.chat_id)
    
    # Only use user messages for preview
    if message.role == "user":
        update_chat_preview(db, message.chat_id, message.content)
    
    logger = logging.getLogger(__name__)
    logger.info(f"Saved message content (id={db_message.id}): {db_message.content}")
    
    return db_message

def create_message_with_sources(db: Session, message: schemas.MessageCreate, sources: List[Dict[str, Any]]) -> models.Message:
    """Create a message with associated sources

    Args:
        db: Database session
        message: Message data
        sources: List of source data including document_id, page, highlight, etc.

    Returns:
        Created message
    """
    
    db_message = models.Message(
        chat_id=message.chat_id,
        role=message.role,
        content=message.content,
    )
    db.add(db_message)
    db.flush()  # Flush to get the message ID without committing transaction

    for source in sources:
        highlight_text = source.get("highlight") or source.get("content")
        db_source = models.Source(
            message_id=db_message.id,
            document_id=source["document_id"],
            page=source["page"],
            highlight=highlight_text,
            line_start=source.get("line_start"),
            line_end=source.get("line_end"),
            content=source.get("content"),
            key_phrases=source.get("key_phrases", []),  # Add key_phrases for bidirectional highlighting
        )
        db.add(db_source)

    db.commit()
    db.refresh(db_message)
    return db_message 
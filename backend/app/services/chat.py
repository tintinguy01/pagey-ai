from datetime import datetime, UTC
from typing import List, Optional
from sqlalchemy.orm import Session
from app.db import models
from app.schemas import chat as schemas

def get_chat_by_id(db: Session, chat_id: int):
    """Get a chat by ID with related messages and documents"""
    db_chat = db.query(models.Chat).filter(models.Chat.id == chat_id).first()
    if db_chat:
        # Add calculated properties
        setattr(db_chat, 'document_count', len(db_chat.documents))
        setattr(db_chat, 'message_count', len(db_chat.messages))
    return db_chat

def get_chats_by_user_id(db: Session, user_id: str, include_archived: bool = False) -> List[models.Chat]:
    """Get all chats for a user, optionally including archived chats"""
    query = db.query(models.Chat).filter(models.Chat.user_id == user_id)
    
    if not include_archived:
        query = query.filter(models.Chat.is_archived == False)
    
    chats = query.order_by(models.Chat.last_active.desc()).all()
    
    # Add calculated properties for each chat
    for chat in chats:
        setattr(chat, 'document_count', len(chat.documents))
        setattr(chat, 'message_count', len(chat.messages))
    
    return chats

def create_chat(db: Session, chat: schemas.ChatCreate):
    """Create a new chat"""
    db_chat = models.Chat(
        title=chat.title,
        user_id=chat.user_id,
        is_archived=False,
        preview="New chat",
    )
    db.add(db_chat)
    db.commit()
    db.refresh(db_chat)
    
    # Add calculated properties for response
    setattr(db_chat, 'document_count', 0)
    setattr(db_chat, 'message_count', 0)
    
    return db_chat

def update_chat(db: Session, chat_id: int, chat_update: schemas.ChatUpdate):
    """Update a chat"""
    db_chat = get_chat_by_id(db, chat_id)
    
    # Update fields if provided
    if chat_update.title is not None:
        db_chat.title = chat_update.title
    
    if chat_update.is_archived is not None:
        db_chat.is_archived = chat_update.is_archived
    
    db.commit()
    db.refresh(db_chat)
    
    # Add calculated properties for response
    setattr(db_chat, 'document_count', len(db_chat.documents))
    setattr(db_chat, 'message_count', len(db_chat.messages))
    
    return db_chat

def delete_chat_by_id(db: Session, chat_id: int):
    """Delete a chat and all associated messages"""
    db_chat = get_chat_by_id(db, chat_id)
    if db_chat:
        db.delete(db_chat)
        db.commit()
    return True

def add_document_to_chat(db: Session, chat_id: int, document_id: int):
    """Add a document to a chat"""
    chat = get_chat_by_id(db, chat_id)
    document = db.query(models.Document).filter(models.Document.id == document_id).first()
    
    if chat and document:
        chat.documents.append(document)
        db.commit()
        return True
    return False

def remove_document_from_chat(db: Session, chat_id: int, document_id: int):
    """Remove a document from a chat"""
    chat = get_chat_by_id(db, chat_id)
    document = db.query(models.Document).filter(models.Document.id == document_id).first()
    
    if chat and document and document in chat.documents:
        chat.documents.remove(document)
        db.commit()
        return True
    return False

def update_chat_last_active(db: Session, chat_id: int):
    """Update the last active timestamp of a chat"""
    chat = get_chat_by_id(db, chat_id)
    if chat:
        chat.last_active = datetime.now(UTC)
        db.commit()
        return True
    return False

def update_chat_preview(db: Session, chat_id: int, preview: str):
    """Update the preview text of a chat"""
    chat = get_chat_by_id(db, chat_id)
    if chat:
        chat.preview = preview[:100]  # Limit preview length
        db.commit()
        return True
    return False 
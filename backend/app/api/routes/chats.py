from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.chat import (
    get_chat_by_id, get_chats_by_user_id,
    create_chat, update_chat, delete_chat_by_id
)
from app.services.ai import PDFChatBot
from app.schemas.chat import Chat, ChatCreate, ChatUpdate, ChatDetail
from app.schemas.conversation import ChatRequest, ChatResponse
from app.services.user import create_user_if_not_exists
from app.schemas.user import UserCreate
from app.api.dependencies.users import ensure_user_exists

router = APIRouter()

@router.get("/", response_model=List[Chat])
async def read_chats(
    user_id: str = Depends(ensure_user_exists),
    include_archived: Optional[bool] = Query(False, description="Include archived chats"),
    db: Session = Depends(get_db)
):
    """
    Get all chats for a user
    
    This endpoint returns all chats for a given user, optionally including archived chats.
    """
    return get_chats_by_user_id(db, user_id, include_archived)

@router.post("/", response_model=Chat, status_code=status.HTTP_201_CREATED)
async def create_new_chat(chat: ChatCreate, db: Session = Depends(get_db)):
    """
    Create a new chat
    
    This endpoint creates a new chat for a user.
    """
    # Create user if they don't exist
    user = UserCreate(id=chat.user_id, email=f"{chat.user_id}@example.com")
    
    # Create user if not exists
    create_user_if_not_exists(db, user)
    
    # Now create the chat
    return create_chat(db=db, chat=chat)

@router.get("/{chat_id}", response_model=ChatDetail)
async def read_chat(chat_id: int, db: Session = Depends(get_db)):
    """
    Get chat by ID
    
    This endpoint returns a chat with its messages and documents.
    """
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

@router.put("/{chat_id}", response_model=Chat)
async def update_chat_details(
    chat_id: int, 
    chat_update: ChatUpdate, 
    db: Session = Depends(get_db)
):
    """
    Update chat
    
    This endpoint updates chat details like title or archived status.
    """
    chat = get_chat_by_id(db, chat_id)
    if not chat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat not found",
        )
    return update_chat(db=db, chat_id=chat_id, chat_update=chat_update)

@router.delete("/{chat_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_chat(chat_id: int, db: Session = Depends(get_db)):
    """
    Delete chat
    
    This endpoint deletes a chat and all its messages and document associations.
    """
    chat = get_chat_by_id(db, chat_id)
    if not chat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat not found",
        )
    delete_chat_by_id(db=db, chat_id=chat_id)
    return None

@router.post("/{chat_id}/conversation", response_model=ChatResponse)
async def chat_with_ai(
    chat_id: int, 
    chat_request: ChatRequest, 
    db: Session = Depends(get_db)
):
    """
    Chat with AI
    
    This endpoint processes user message and generates AI response for a specific chat.
    """
    # Check if chat exists
    chat = get_chat_by_id(db, chat_id)
    if not chat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat not found",
        )
    
    # Initialize chat bot and process message
    chat_bot = PDFChatBot(chat_id=chat_id, db=db)
    result = await chat_bot.process_message(chat_request.message)
    
    return result 
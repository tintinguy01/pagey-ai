from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.user import create_user_if_not_exists
from app.schemas.user import User, UserCreate

router = APIRouter()

@router.post("/clerk-webhook", status_code=status.HTTP_200_OK)
async def clerk_webhook(payload: dict):
    """
    Webhook endpoint for Clerk authentication events
    
    This endpoint handles webhook events from Clerk such as user creation,
    user updates, etc.
    """
    # Handle webhook based on event type
    event_type = payload.get("type")
    
    if event_type == "user.created":
        # Process user creation
        pass
    elif event_type == "user.updated":
        # Process user update
        pass
    
    return {"status": "success"}

@router.post("/sync-user", response_model=User)
async def sync_user(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Sync user from Clerk to backend database
    
    This endpoint ensures that a Clerk user exists in the backend database.
    """
    return create_user_if_not_exists(db=db, user=user_data) 
from fastapi import Depends, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.user import create_user_if_not_exists
from app.schemas.user import UserCreate

def ensure_user_exists(
    user_id: str = Query(..., description="User ID"),
    db: Session = Depends(get_db)
):
    """
    Dependency to ensure a user exists in the database.
    This is used for Clerk integration where users are created in Clerk first.
    """
    user = UserCreate(id=user_id, email=f"{user_id}@example.com")
    create_user_if_not_exists(db, user)
    return user_id 
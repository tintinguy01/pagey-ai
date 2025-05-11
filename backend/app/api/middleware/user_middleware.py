from fastapi import Request, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.user import create_user_if_not_exists
from app.schemas.user import UserCreate

async def user_middleware(request: Request, db: Session = Depends(get_db)):
    """
    Middleware to automatically create users if they don't exist in the database
    to handle clerk authentication
    """
    # Check if there's a user_id in the query parameters
    user_id = request.query_params.get("user_id")
    
    # If user_id exists in query, create the user if they don't exist
    if user_id:
        # Create a minimal user object
        user = UserCreate(id=user_id, email=f"{user_id}@example.com")
        
        # Create user if not exists
        create_user_if_not_exists(db, user)
        
    return request 
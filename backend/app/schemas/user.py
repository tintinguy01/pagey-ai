from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr

class UserBase(BaseModel):
    """Base user schema"""
    email: EmailStr
    subscription_type: Optional[str] = "Free"

class UserCreate(UserBase):
    """User creation schema"""
    id: str  # Clerk user ID

class User(UserBase):
    """User response schema"""
    id: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class UserInDB(User):
    """User in database schema"""
    pass 
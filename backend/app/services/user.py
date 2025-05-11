from sqlalchemy.orm import Session
from app.db import models
from app.schemas import user as schemas

def get_user_by_id(db: Session, user_id: str):
    """Get a user by ID"""
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_email(db: Session, email: str):
    """Get a user by email"""
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate):
    """Create a new user"""
    db_user = models.User(
        id=user.id,
        email=user.email,
        subscription_type=user.subscription_type or "Free",
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def create_user_if_not_exists(db: Session, user: schemas.UserCreate):
    """Create a user if it doesn't exist, otherwise return existing user"""
    db_user = get_user_by_id(db, user.id)
    if db_user:
        return db_user
    return create_user(db, user) 

def update_user_subscription(db: Session, user_id: str, subscription_type: str):
    db_user = get_user_by_id(db, user_id)
    if not db_user:
        return None
    db_user.subscription_type = subscription_type
    db.commit()
    db.refresh(db_user)
    return db_user 
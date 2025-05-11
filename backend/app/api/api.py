from fastapi import APIRouter

from app.api.routes import users, chats, analytics
 
api_router = APIRouter()
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(chats.router, prefix="/chats", tags=["chats"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"]) 
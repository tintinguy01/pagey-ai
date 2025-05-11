from fastapi import APIRouter
from app.api.routes import users, chats, documents, messages, pdf, auth, analytics

router = APIRouter()

router.include_router(auth.router, prefix="/auth", tags=["auth"])
router.include_router(users.router, prefix="/users", tags=["users"])
router.include_router(chats.router, prefix="/chats", tags=["chats"])
router.include_router(documents.router, prefix="/documents", tags=["documents"])
router.include_router(messages.router, prefix="/messages", tags=["messages"])
router.include_router(pdf.router, prefix="/pdf", tags=["pdf"])
router.include_router(analytics.router, prefix="/analytics", tags=["analytics"]) 
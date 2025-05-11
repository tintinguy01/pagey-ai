from datetime import datetime, timedelta, UTC
from typing import List
from sqlalchemy import (
    Boolean, Column, ForeignKey, Integer, String, 
    Text, DateTime, Float, Table, UniqueConstraint, ARRAY
)
from sqlalchemy.orm import relationship
from app.db.session import Base

# Document-Chat association table
document_chat = Table(
    "document_chat",
    Base.metadata,
    Column("document_id", Integer, ForeignKey("documents.id"), primary_key=True),
    Column("chat_id", Integer, ForeignKey("chats.id"), primary_key=True),
)

class User(Base):
    """User model representing application users"""
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, index=True)  # Using Clerk ID
    email = Column(String, unique=True, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC))
    subscription_type = Column(String, default="Free")
    
    # Relationships
    chats = relationship("Chat", back_populates="user")
    documents = relationship("Document", back_populates="user")

class Chat(Base):
    """Chat model representing conversation sessions"""
    __tablename__ = "chats"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    user_id = Column(String, ForeignKey("users.id"))
    is_archived = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC))
    last_active = Column(DateTime, default=lambda: datetime.now(UTC))
    preview = Column(String, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="chats")
    messages = relationship("Message", back_populates="chat", cascade="all, delete-orphan")
    documents = relationship("Document", secondary=document_chat, back_populates="chats")
    
    # Calculated properties (handled in API)
    # document_count, message_count

class Document(Base):
    """Document model representing uploaded PDFs"""
    __tablename__ = "documents"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    size = Column(Integer)  # Size in bytes
    pages = Column(Integer)
    user_id = Column(String, ForeignKey("users.id"))
    upload_date = Column(DateTime, default=lambda: datetime.now(UTC))
    content_type = Column(String, default="application/pdf")
    file_path = Column(String)  # Path to stored file
    file_url = Column(String, nullable=True)  # Public URL for file access
    
    # Relationships
    user = relationship("User", back_populates="documents")
    chats = relationship("Chat", secondary=document_chat, back_populates="documents")
    content = relationship("DocumentContent", back_populates="document", cascade="all, delete-orphan")
    sources = relationship("Source", back_populates="document", cascade="all, delete-orphan")

class DocumentContent(Base):
    """Document content model representing extracted text from PDFs"""
    __tablename__ = "document_content"
    
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"))
    page_number = Column(Integer)
    content = Column(Text)
    
    # Relationships
    document = relationship("Document", back_populates="content")
    
    __table_args__ = (
        UniqueConstraint('document_id', 'page_number', name='uix_document_page'),
    )

class Message(Base):
    """Message model representing chat messages"""
    __tablename__ = "messages"
    
    id = Column(Integer, primary_key=True, index=True)
    chat_id = Column(Integer, ForeignKey("chats.id"))
    content = Column(Text)
    role = Column(String)  # "user" or "assistant"
    timestamp = Column(DateTime, default=lambda: datetime.now(UTC))
    
    # Relationships
    chat = relationship("Chat", back_populates="messages")
    sources = relationship("Source", back_populates="message", cascade="all, delete-orphan")

class Source(Base):
    """Source model representing citations/references from documents"""
    __tablename__ = "sources"
    
    id = Column(Integer, primary_key=True, index=True)
    message_id = Column(Integer, ForeignKey("messages.id", ondelete="CASCADE"))
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"))
    page = Column(Integer)
    highlight = Column(Text)
    line_start = Column(Integer, nullable=True)
    line_end = Column(Integer, nullable=True)
    content = Column(Text, nullable=True)
    key_phrases = Column(ARRAY(String), nullable=True)  # Array of strings for bidirectional highlighting
    
    # Relationships
    message = relationship("Message", back_populates="sources")
    document = relationship("Document") 
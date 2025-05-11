import logging
from typing import Callable
from fastapi import FastAPI
from sqlalchemy import text
from app.db.session import engine, SessionLocal
from app.db.models import Base

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

async def startup_event_handler() -> None:
    """
    Function to handle startup events:
    - Initialize database if needed
    - Validate environment variables
    - Set up any required resources
    """
    logger.info("Starting up Pagey AI application")
    
    # Create database tables if they don't exist
    Base.metadata.create_all(bind=engine)
    
    # Test database connection
    db = SessionLocal()
    try:
        # Execute simple query to check connection
        db.execute(text("SELECT 1"))
        logger.info("Database connection successful")
    except Exception as e:
        logger.error(f"Database connection failed: {str(e)}")
        raise e
    finally:
        db.close()

async def shutdown_event_handler() -> None:
    """
    Function to handle shutdown events:
    - Close database connections
    - Release any resources
    """
    logger.info("Shutting down Pagey AI application")
    
    # Close the database engine pool
    engine.dispose()
    logger.info("Database connections closed") 
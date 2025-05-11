# Import main modules to make them available when importing app
from app.core.config import settings
from app.db.session import Base, engine, SessionLocal 
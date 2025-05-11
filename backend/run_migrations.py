"""
Simple script to run Alembic migrations
"""
import os
import subprocess
from app.core.config import settings

def main():
    # Set database URL environment variable for Alembic
    os.environ["DATABASE_URL"] = settings.DATABASE_URL
    
    # Print database info
    print(f"Running migrations on: {settings.DATABASE_URL}")
    
    # Run Alembic upgrade
    try:
        subprocess.run(["alembic", "upgrade", "head"], check=True)
        print("Migrations completed successfully!")
    except subprocess.CalledProcessError as e:
        print(f"Migration failed: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main()) 
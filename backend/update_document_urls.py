"""
Script to update file_url for existing documents
"""
import os
from sqlalchemy import update, text
from app.db.session import engine, SessionLocal
from app.db.models import Document
from app.core.config import settings

def main():
    """Update file_url for all existing documents"""
    print(f"Connecting to PostgreSQL: {settings.DATABASE_URL}")
    
    # Get all documents without file_url
    db = SessionLocal()
    try:
        # Get all documents 
        documents = db.query(Document).all()
        print(f"Found {len(documents)} documents")
        
        updated_count = 0
        for doc in documents:
            if doc.file_path:
                # Extract the filename from the file_path
                filename = os.path.basename(doc.file_path)
                
                # Set file_url to /uploads/filename
                file_url = f"/uploads/{filename}"
                
                # Print the update
                print(f"Updating document {doc.id} ({doc.name}): {file_url}")
                
                # Update the document
                doc.file_url = file_url
                updated_count += 1
        
        # Commit all changes
        if updated_count > 0:
            db.commit()
            print(f"Updated {updated_count} documents")
        else:
            print("No documents needed updating")
        
        return 0
    finally:
        db.close()

if __name__ == "__main__":
    exit(main()) 
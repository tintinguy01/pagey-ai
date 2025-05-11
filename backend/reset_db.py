from app.db.session import engine
from sqlalchemy.schema import DropTable, Table, MetaData
from sqlalchemy.ext.compiler import compiles
from sqlalchemy import inspect

# Add CASCADE to PostgreSQL drop statements
@compiles(DropTable, "postgresql")
def _compile_drop_table(element, compiler, **kwargs):
    return compiler.visit_drop_table(element) + " CASCADE"

def reset_database():
    # Get all table names
    inspector = inspect(engine)
    metadata = MetaData()
    
    # Reflect all tables
    metadata.reflect(bind=engine)
    
    # Drop all tables with CASCADE
    if metadata.tables:
        print("Dropping all tables...")
        metadata.drop_all(engine)
        print("All tables dropped successfully!")
    else:
        print("No tables found to drop.")
    
    # Import and recreate all tables
    from app.db.models import Base
    print("Creating all tables...")
    Base.metadata.create_all(engine)
    print("All tables created successfully!")
    print("Database reset completed!")

if __name__ == "__main__":
    reset_database() 
from sqlalchemy import create_engine, text
from app.core.config import settings

engine = create_engine(settings.DATABASE_URL)

with engine.connect() as conn:
    # Disable foreign key checks for SQLite
    if settings.USE_SQLITE:
        conn.execute(text("PRAGMA foreign_keys = OFF;"))
        tables = conn.execute(text("SELECT name FROM sqlite_master WHERE type='table';")).fetchall()
        for (table_name,) in tables:
            if table_name != 'alembic_version':
                conn.execute(text(f"DELETE FROM {table_name};"))
        conn.execute(text("PRAGMA foreign_keys = ON;"))
    else:
        # For PostgreSQL, truncate all tables except alembic_version
        conn.execute(text('''
            DO $$ DECLARE
                r RECORD;
            BEGIN
                FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = current_schema() AND tablename != 'alembic_version') LOOP
                    EXECUTE 'TRUNCATE TABLE ' || quote_ident(r.tablename) || ' CASCADE;';
                END LOOP;
            END $$;
        '''))
    print("All data deleted from all tables (except alembic_version).") 
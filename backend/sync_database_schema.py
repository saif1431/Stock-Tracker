#!/usr/bin/env python
"""
Migration script to sync the users table schema.
Adds missing 2FA columns if they don't exist.
"""

from sqlalchemy import text
from database.database import engine

def sync_user_schema():
    """Add 2FA columns to the users table if they are missing"""
    columns_to_add = [
        ("two_fa_enabled", "BOOLEAN DEFAULT FALSE NOT NULL"),
        ("two_fa_secret", "VARCHAR NULL"),
        ("backup_codes", "JSON NULL"),
        ("is_banned", "BOOLEAN DEFAULT FALSE NOT NULL"),
        ("ban_reason", "VARCHAR NULL"),
        ("is_admin", "BOOLEAN DEFAULT FALSE NOT NULL"),
        ("subscription", "VARCHAR DEFAULT 'free' NOT NULL"),
    ]
    
    with engine.connect() as conn:
        # Start a transaction
        trans = conn.begin()
        try:
            # Get existing columns
            # This works for PostgreSQL
            result = conn.execute(text(
                "SELECT column_name FROM information_schema.columns WHERE table_name = 'users';"
            ))
            existing_columns = [row[0] for row in result.fetchall()]
            print(f"Existing columns in 'users': {existing_columns}")

            for col_name, col_type in columns_to_add:
                if col_name not in existing_columns:
                    print(f"Adding column '{col_name}' to 'users' table...")
                    conn.execute(text(
                        f"ALTER TABLE users ADD COLUMN {col_name} {col_type};"
                    ))
                    print(f"✓ Successfully added '{col_name}'")
                else:
                    print(f"Column '{col_name}' already exists.")

            trans.commit()
            print("✓ Database schema sync completed successfully.")
            return True
        except Exception as e:
            trans.rollback()
            print(f"✗ Error syncing schema: {e}")
            # If it's not PostgreSQL, try a simpler approach or report error
            print("Note: This script is optimized for PostgreSQL. If you use SQLite, columns are usually added automatically on table creation but cannot be easily added to existing tables without migrations.")
            return False

if __name__ == "__main__":
    success = sync_user_schema()
    import sys
    sys.exit(0 if success else 1)

#!/usr/bin/env python
"""
Migration script to fix the alerts.symbol column size from VARCHAR(10) to VARCHAR(50)
Run this script once to apply the fix.
"""

from sqlalchemy import text
from database.database import engine

def fix_alert_symbol_column():
    """Alter the alerts.symbol column to support longer stock symbols"""
    with engine.connect() as conn:
        # Start a transaction
        trans = conn.begin()
        try:
            # PostgreSQL syntax to alter column type
            conn.execute(text(
                "ALTER TABLE alerts ALTER COLUMN symbol TYPE varchar(50);"
            ))
            trans.commit()
            print("✓ Successfully updated alerts.symbol column to VARCHAR(50)")
            return True
        except Exception as e:
            trans.rollback()
            print(f"✗ Error updating column: {e}")
            return False

if __name__ == "__main__":
    success = fix_alert_symbol_column()
    exit(0 if success else 1)

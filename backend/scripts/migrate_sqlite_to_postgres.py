"""Migrate all SQLAlchemy models from SQLite to PostgreSQL.

Usage:
    python scripts/migrate_sqlite_to_postgres.py \
        --sqlite-url sqlite:///./stock_dashboard.db \
        --postgres-url postgresql://user:password@localhost:5432/stock_tracker
"""

from __future__ import annotations

import argparse
from collections.abc import Iterator
from contextlib import contextmanager
from typing import Any

from sqlalchemy import MetaData, Table, create_engine, select
from sqlalchemy.engine import Engine


@contextmanager
def transaction(engine: Engine) -> Iterator[Any]:
    connection = engine.connect()
    tx = connection.begin()
    try:
        yield connection
        tx.commit()
    except Exception:
        tx.rollback()
        raise
    finally:
        connection.close()


def copy_table_data(sqlite_engine: Engine, postgres_engine: Engine, table_name: str, metadata: MetaData) -> int:
    table = Table(table_name, metadata, autoload_with=sqlite_engine)

    with sqlite_engine.connect() as sqlite_conn:
        rows = [dict(row._mapping) for row in sqlite_conn.execute(select(table)).fetchall()]

    if not rows:
        return 0

    target_table = Table(table_name, metadata, autoload_with=postgres_engine)

    with transaction(postgres_engine) as pg_conn:
        pg_conn.execute(target_table.insert(), rows)

    return len(rows)


def migrate(sqlite_url: str, postgres_url: str) -> None:
    sqlite_engine = create_engine(sqlite_url)
    postgres_engine = create_engine(postgres_url)

    metadata = MetaData()
    metadata.reflect(bind=sqlite_engine)

    # Ensure tables exist in PostgreSQL before data copy.
    metadata.create_all(bind=postgres_engine)

    copied_counts: dict[str, int] = {}

    for table_name in metadata.tables.keys():
        copied_counts[table_name] = copy_table_data(sqlite_engine, postgres_engine, table_name, metadata)

    total_rows = sum(copied_counts.values())
    print(f"Migration complete. Copied {total_rows} rows across {len(copied_counts)} tables.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Migrate data from SQLite to PostgreSQL")
    parser.add_argument("--sqlite-url", required=True, help="SQLAlchemy URL for source SQLite database")
    parser.add_argument("--postgres-url", required=True, help="SQLAlchemy URL for target PostgreSQL database")

    args = parser.parse_args()
    migrate(args.sqlite_url, args.postgres_url)

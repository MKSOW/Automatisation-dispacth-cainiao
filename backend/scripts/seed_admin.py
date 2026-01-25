#!/usr/bin/env python3
"""
Seed script: create default users (admin, driver, sorter) if none exist.

Usage:
    python -m scripts.seed_admin

Override credentials via env vars:
    DEFAULT_ADMIN_EMAIL=admin@example.com DEFAULT_ADMIN_PASSWORD=secret \
    DEFAULT_DRIVER_EMAIL=driver@example.com DEFAULT_DRIVER_PASSWORD=secret \
    DEFAULT_SORTER_EMAIL=sorter@example.com DEFAULT_SORTER_PASSWORD=secret \
    python -m scripts.seed_admin
"""
import sys
import os

# Add parent to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.core.database import SessionLocal
from app.core.config import get_settings
from app.core.password import hash_password


def ensure_user(db, username: str, role: str, password: str) -> None:
    """Create a user with given role if email doesn't already exist."""
    existing = db.execute(
        text("SELECT id, role FROM users WHERE lower(username) = lower(:username) LIMIT 1"),
        {"username": username},
    ).first()

    if existing:
        print(f"605 User {username} already exists (id={existing[0]}, role={existing[1]})")
        return

    hashed = hash_password(password)
    db.execute(
        text(
            """
            INSERT INTO users (username, password, role)
            VALUES (:username, :password, :role)
            """
        ),
        {"username": username, "password": hashed, "role": role},
    )
    db.commit()
    print(f"605 Created {role}: {username}")
    print(f"  Password: {password}")


def seed_users():
    """Create admin, driver, and sorter demo accounts if missing."""
    settings = get_settings()

    admin_email = os.getenv("DEFAULT_ADMIN_EMAIL") or settings.default_admin_email or "admin@logistics-hub.io"
    admin_password = os.getenv("DEFAULT_ADMIN_PASSWORD") or settings.default_admin_password or "ChangeMe123!"

    driver_email = os.getenv("DEFAULT_DRIVER_EMAIL") or "driver@logistics-hub.io"
    driver_password = os.getenv("DEFAULT_DRIVER_PASSWORD") or "Driver123!"

    sorter_email = os.getenv("DEFAULT_SORTER_EMAIL") or "sorter@logistics-hub.io"
    sorter_password = os.getenv("DEFAULT_SORTER_PASSWORD") or "Sorter123!"

    db = SessionLocal()
    try:
        ensure_user(db, admin_email, "admin", admin_password)
        ensure_user(db, driver_email, "chauffeur", driver_password)
        ensure_user(db, sorter_email, "trieur", sorter_password)
        print("389 Seeding complete.")
        print("  Roles created: admin, chauffeur (driver), trieur (sorter)")
    except Exception as e:
        print(f"4e7 Error seeding users: {e}")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    seed_users()

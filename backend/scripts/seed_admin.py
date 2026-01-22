#!/usr/bin/env python3
"""
Seed script: create default admin user if none exists.

Usage:
    python -m scripts.seed_admin
    
Or with custom credentials:
    DEFAULT_ADMIN_EMAIL=admin@example.com DEFAULT_ADMIN_PASSWORD=secret python -m scripts.seed_admin
"""
import sys
import os

# Add parent to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.core.database import SessionLocal
from app.core.config import get_settings
from app.core.password import hash_password


def seed_admin():
    """Create default admin user if none exists."""
    settings = get_settings()
    
    email = settings.default_admin_email or "admin@logistics-hub.io"
    password = settings.default_admin_password or "ChangeMe123!"
    
    db = SessionLocal()
    try:
        # Check if admin exists
        existing = db.execute(
            text("SELECT id FROM users WHERE role = 'admin' LIMIT 1")
        ).first()
        
        if existing:
            print(f"✓ Admin user already exists (id={existing[0]})")
            return
        
        # Check if this email exists
        existing_email = db.execute(
            text("SELECT id FROM users WHERE username = :email LIMIT 1"),
            {"email": email}
        ).first()
        
        if existing_email:
            print(f"✓ User {email} already exists (id={existing_email[0]})")
            return
        
        # Create admin
        hashed = hash_password(password)
        db.execute(
            text("""
                INSERT INTO users (username, password, role)
                VALUES (:username, :password, 'admin')
            """),
            {"username": email, "password": hashed}
        )
        db.commit()
        
        print(f"✓ Admin user created: {email}")
        print(f"  Password: {password}")
        print("  ⚠️  Change this password in production!")
        
    except Exception as e:
        print(f"✗ Error creating admin: {e}")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    seed_admin()

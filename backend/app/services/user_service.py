"""Domain services for user management."""
from sqlalchemy import text
from sqlalchemy.orm import Session

from security import verify_password, hash_password as _hash_password


def hash_password(password: str) -> str:
    """Re-export hash_password for convenience."""
    return _hash_password(password)


def authenticate_user(db: Session, username: str, password: str) -> dict | None:
    row = db.execute(
        text(
            """
            SELECT id, username, password, role
            FROM users
            WHERE lower(username) = lower(:username)
            LIMIT 1
            """
        ),
        {"username": username.strip()},
    ).mappings().first()

    if not row:
        return None

    if not verify_password(password, row["password"]):
        return None

    return {"id": row["id"], "username": row["username"], "role": row["role"]}

"""Utility helpers for hashing and verifying passwords."""
from __future__ import annotations

import hashlib


def hash_password(password: str) -> str:
    """Hash passwords using SHA-256 (upgrade path to bcrypt later)."""
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def verify_password(password: str, hashed: str) -> bool:
    """Compare a plain password against a stored hash."""
    if not password or not hashed:
        return False
    return hash_password(password) == hashed

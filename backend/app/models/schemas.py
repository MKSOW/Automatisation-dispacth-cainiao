"""Pydantic schemas used by the API."""
from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    id: int
    username: EmailStr
    role: str
    access_token: str
    token_type: str = "bearer"
    message: str = "Authenticated"


# ───────────────────────────────────────
# User management schemas
# ───────────────────────────────────────
class UserCreate(BaseModel):
    username: EmailStr
    password: str
    role: str = "chauffeur"  # admin | trieur | chauffeur


class UserRead(BaseModel):
    id: int
    username: str
    role: str

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    password: str | None = None
    role: str | None = None


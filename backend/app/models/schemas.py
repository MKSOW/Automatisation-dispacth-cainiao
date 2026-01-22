"""Pydantic schemas used by the API."""
from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    id: int
    username: EmailStr
    role: str
    message: str = "Authenticated"

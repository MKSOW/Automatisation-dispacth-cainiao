"""Authentication helpers for Streamlit pages."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

import streamlit as st
from sqlalchemy import text

from database import get_engine
from security import verify_password

SESSION_KEY = "auth_user"


@dataclass
class AuthenticatedUser:
    id: int
    username: str
    role: str


def authenticate(username: str, password: str) -> Optional[AuthenticatedUser]:
    """Return an authenticated user if credentials are valid."""
    engine = get_engine()
    if not engine:
        st.error("Connexion base indisponible.")
        return None

    with engine.connect() as conn:
        row = conn.execute(
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

    return AuthenticatedUser(id=row["id"], username=row["username"], role=row["role"])


def get_current_user() -> Optional[AuthenticatedUser]:
    user_dict = st.session_state.get(SESSION_KEY)
    if not user_dict:
        return None
    return AuthenticatedUser(**user_dict)


def logout():
    st.session_state.pop(SESSION_KEY, None)
    st.experimental_rerun()


def _store_user(user: AuthenticatedUser, remember_device: bool = False):
    st.session_state[SESSION_KEY] = {
        "id": user.id,
        "username": user.username,
        "role": user.role,
        "remember": remember_device,
    }


def render_login_screen():
    st.markdown(
        """
        <style>
        .login-card {
            max-width: 420px;
            margin: 4rem auto;
            padding: 2.5rem;
            border-radius: 18px;
            background: #fff;
            box-shadow: 0 20px 60px rgba(15, 23, 42, 0.12);
        }
        .login-title {text-align:center; margin-bottom:1rem;}
        .login-subtitle {text-align:center; color:#64748b; margin-bottom:2rem;}
        .login-footer {text-align:center; font-size:0.85rem; color:#64748b; margin-top:1.5rem;}
        </style>
        """,
        unsafe_allow_html=True,
    )

    st.markdown("## ")  # spacer
    with st.container():
        st.markdown('<div class="login-card">', unsafe_allow_html=True)
        st.markdown("<h3 class='login-title'>Welcome Back</h3>", unsafe_allow_html=True)
        st.markdown(
            "<p class='login-subtitle'>Smart dispatch. Faster deliveries.</p>",
            unsafe_allow_html=True,
        )

        with st.form("login_form", clear_on_submit=False):
            username = st.text_input("Work Email", placeholder="name@company.com")
            password = st.text_input("Password", type="password", placeholder="Enter your password")
            cols = st.columns(2)
            with cols[0]:
                remember = st.checkbox("Remember this device")
            with cols[1]:
                st.markdown("<p style='text-align:right'><a href='#'>Forgot password?</a></p>", unsafe_allow_html=True)

            submitted = st.form_submit_button("Sign In to Dashboard", use_container_width=True)

        st.markdown(
            "<p class='login-footer'>Don't have an account? <strong>Contact Admin</strong></p>",
            unsafe_allow_html=True,
        )
        st.markdown("</div>", unsafe_allow_html=True)

    if submitted:
        if not username or not password:
            st.error("Veuillez saisir votre email professionnel et votre mot de passe.")
            return

        user = authenticate(username, password)
        if user:
            _store_user(user, remember)
            st.experimental_rerun()
        else:
            st.error("Identifiants invalides. Veuillez réessayer.")


def require_login() -> AuthenticatedUser:
    user = get_current_user()
    if user:
        return user

    render_login_screen()
    st.stop()


def require_role(roles: list[str]):
    user = require_login()
    if user.role not in roles:
        st.error("Accès refusé pour ce rôle.")
        st.stop()
    return user


def render_user_sidebar():
    user = get_current_user()
    if not user:
        return

    with st.sidebar:
        st.markdown("---")
        st.markdown(f"**Connecté :** {user.username}")
        st.markdown(f"**Rôle :** {user.role.capitalize()}")
        st.button("Se déconnecter", on_click=logout)

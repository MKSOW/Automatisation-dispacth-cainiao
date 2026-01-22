import os
import psycopg2
from sqlalchemy import create_engine, text
import streamlit as st

from security import hash_password

def get_engine():
    """Récupère l'URL de la base depuis les secrets et crée l'engine SQLAlchemy."""
    try:
        # Récupération de l'URL externe depuis les secrets Streamlit
        raw_url = st.secrets["postgres_url"]
        
        # Correction automatique du protocole pour SQLAlchemy
        if raw_url.startswith("postgres://"):
            raw_url = raw_url.replace("postgres://", "postgresql://", 1)
        
        return create_engine(raw_url)
    except Exception as e:
        st.error(f"Erreur de configuration de la base de données : {e}")
        return None

def _get_secret(key: str, env_key: str) -> str | None:
    try:
        return st.secrets[key]
    except Exception:
        return os.environ.get(env_key)


def _ensure_default_admin(conn):
    default_email = _get_secret("default_admin_email", "DEFAULT_ADMIN_EMAIL")
    default_password = _get_secret("default_admin_password", "DEFAULT_ADMIN_PASSWORD")

    if not default_email or not default_password:
        return

    existing = conn.execute(
        text("SELECT 1 FROM users WHERE role = 'admin' LIMIT 1")
    ).scalar()
    if existing:
        return

    conn.execute(
        text(
            """
            INSERT INTO users (username, password, role)
            VALUES (:username, :password, 'admin')
            """
        ),
        {
            "username": default_email.strip().lower(),
            "password": hash_password(default_password),
        },
    )
    st.info("Compte admin par défaut créé depuis les secrets.")


def init_db():
    """Initialise les tables si elles n'existent pas."""
    engine = get_engine()
    if not engine:
        return
    
    with engine.connect() as conn:
        # Table des Utilisateurs
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT NOT NULL CHECK (role IN ('admin', 'trieur', 'chauffeur'))
            );
        """))
        
        # Table des Colis (Parcels)
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS parcels (
                id SERIAL PRIMARY KEY,
                tracking_no TEXT UNIQUE NOT NULL,
                source TEXT,
                status TEXT DEFAULT 'pending',
                driver_id INTEGER,
                sorter_id INTEGER,
                lat FLOAT,
                lon FLOAT,
                sequence_order INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """))
        
        # Table des Zones
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS zones (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                geojson_data JSONB NOT NULL
            );
        """))
    _ensure_default_admin(conn)
    conn.commit()
    print("Base de données initialisée avec succès.")

# Initialisation au démarrage
if __name__ == "__main__":
    init_db()
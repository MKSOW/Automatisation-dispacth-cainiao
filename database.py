import os
import psycopg2
from sqlalchemy import create_engine, text
import streamlit as st

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

def init_db():
    """Initialise les tables si elles n'existent pas."""
    engine = get_engine()
    if not engine: return
    
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
        conn.commit()
        print("Base de données initialisée avec succès.")

# Initialisation au démarrage
if __name__ == "__main__":
    init_db()
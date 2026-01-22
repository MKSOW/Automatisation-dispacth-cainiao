import streamlit as st
from sqlalchemy import text
from database import get_engine

from auth import render_user_sidebar, require_role
from security import hash_password

require_role(["admin"])
render_user_sidebar()

st.title("🔐 Administration - Gestion des Utilisateurs")

def get_all_users():
    """Récupère tous les utilisateurs de la base."""
    engine = get_engine()
    if not engine:
        return []
    
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT id, username, role FROM users ORDER BY id
        """))
        return result.fetchall()

def create_user(username: str, password: str, role: str) -> tuple[bool, str]:
    """Crée un nouvel utilisateur dans la base."""
    engine = get_engine()
    if not engine:
        return False, "Erreur de connexion à la base de données"

    username = username.strip().lower()
    
    try:
        with engine.connect() as conn:
            conn.execute(text("""
                INSERT INTO users (username, password, role)
                VALUES (:username, :password, :role)
            """), {
                "username": username,
                "password": hash_password(password),
                "role": role
            })
            conn.commit()
        return True, f"Utilisateur '{username}' créé avec succès !"
    except Exception as e:
        if "duplicate key" in str(e).lower() or "unique" in str(e).lower():
            return False, f"Le nom d'utilisateur '{username}' existe déjà."
        return False, f"Erreur lors de la création : {e}"

def delete_user(user_id: int) -> tuple[bool, str]:
    """Supprime un utilisateur de la base."""
    engine = get_engine()
    if not engine:
        return False, "Erreur de connexion à la base de données"
    
    try:
        with engine.connect() as conn:
            # Empêcher la suppression d'un administrateur
            role = conn.execute(text("SELECT role FROM users WHERE id = :id"), {"id": user_id}).scalar()
            if role == "admin":
                return False, "Impossible de supprimer un administrateur."

            conn.execute(text("DELETE FROM users WHERE id = :id"), {"id": user_id})
            conn.commit()
        return True, "Utilisateur supprimé avec succès !"
    except Exception as e:
        return False, f"Erreur lors de la suppression : {e}"

# --- Section Création d'utilisateur ---
st.header("➕ Créer un nouvel utilisateur")

with st.form("create_user_form", clear_on_submit=True):
    col1, col2 = st.columns(2)
    
    with col1:
        new_username = st.text_input("Email professionnel", placeholder="ex: jean.dupont@hub.com")
        new_password = st.text_input("Mot de passe", type="password")
    
    with col2:
        new_role = st.selectbox(
            "Rôle",
            options=["chauffeur", "trieur"],
            help="Sélectionnez le rôle de l'utilisateur"
        )
        confirm_password = st.text_input("Confirmer le mot de passe", type="password")
    
    submitted = st.form_submit_button("✅ Créer l'utilisateur", use_container_width=True)
    
    if submitted:
        if not new_username or not new_password:
            st.error("Veuillez remplir tous les champs.")
        elif new_password != confirm_password:
            st.error("Les mots de passe ne correspondent pas.")
        elif len(new_password) < 4:
            st.error("Le mot de passe doit contenir au moins 4 caractères.")
        else:
            success, message = create_user(new_username.strip().lower(), new_password, new_role)
            if success:
                st.success(message)
                st.rerun()
            else:
                st.error(message)

st.divider()

# --- Section Liste des utilisateurs ---
st.header("👥 Liste des utilisateurs")

users = get_all_users()

if not users:
    st.info("Aucun utilisateur enregistré.")
else:
    # Affichage sous forme de tableau
    for user in users:
        user_id, username, role = user
        
        col1, col2, col3, col4 = st.columns([3, 2, 2, 1])
        
        with col1:
            st.write(f"**{username}**")
        
        with col2:
            role_emoji = "🚗" if role == "chauffeur" else "📦" if role == "trieur" else "👑"
            st.write(f"{role_emoji} {role.capitalize()}")
        
        with col3:
            st.write(f"ID: {user_id}")
        
        with col4:
            if role != "admin":  # Protection pour ne pas supprimer les admins
                if st.button("🗑️", key=f"delete_{user_id}", help=f"Supprimer {username}"):
                    success, message = delete_user(user_id)
                    if success:
                        st.success(message)
                        st.rerun()
                    else:
                        st.error(message)

st.divider()

# --- Statistiques ---
st.header("📊 Statistiques")

if users:
    chauffeurs = sum(1 for u in users if u[2] == "chauffeur")
    trieurs = sum(1 for u in users if u[2] == "trieur")
    admins = sum(1 for u in users if u[2] == "admin")
    
    col1, col2, col3 = st.columns(3)
    
    with col1:
        st.metric("🚗 Chauffeurs", chauffeurs)
    
    with col2:
        st.metric("📦 Trieurs", trieurs)
    
    with col3:
        st.metric("👑 Admins", admins)

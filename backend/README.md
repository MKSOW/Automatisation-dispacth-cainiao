# Backend (FastAPI)

## Installation
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
cp .env.example .env  # puis éditer les secrets
```

## Lancement
```bash
uvicorn app.main:app --reload
```

## Endpoints
- `GET /` – message d'accueil + environnement
- `GET /health` – liveness
- `GET /health/db` – vérifie la connexion PostgreSQL
- `POST /auth/login` – authentifie un utilisateur (email + mot de passe)

## À venir
- JWT + rôles
- Routes dispatch / tri / chauffeur
- Tests automatiques
```
}
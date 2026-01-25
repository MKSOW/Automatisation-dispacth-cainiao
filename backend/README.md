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

### Comptes de démo créés par `python -m scripts.seed_admin`
- Admin : `admin@logistics-hub.io` / `ChangeMe123!`
- Chauffeur : `driver@logistics-hub.io` / `Driver123!`
- Trieur : `sorter@logistics-hub.io` / `Sorter123!`

Env overrides possibles avant d'exécuter le script :
`DEFAULT_ADMIN_EMAIL`, `DEFAULT_ADMIN_PASSWORD`, `DEFAULT_DRIVER_EMAIL`,
`DEFAULT_DRIVER_PASSWORD`, `DEFAULT_SORTER_EMAIL`, `DEFAULT_SORTER_PASSWORD`.

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
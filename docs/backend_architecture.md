# Backend FastAPI – Architecture Initiale

## Objectifs
- Remplacer l'UI Streamlit par une API REST indépendante.
- Réutiliser la même base PostgreSQL (Render) pour `users`, `parcels`, `zones`.
- Offrir des endpoints consommables par un frontend Next.js (auth, dispatch, tri, chauffeur).

## Stack
- **Framework** : FastAPI
- **Serveur** : Uvicorn
- **ORM** : SQLAlchemy (déjà présent)
- **Config** : Pydantic `BaseSettings` (lecture env / .env)
- **Sécurité** : Hash SHA-256 existant (migration bcrypt prévue)

## Structure proposée
```
backend/
├── app/
│   ├── api/
│   │   ├── deps.py
│   │   ├── routes/
│   │   │   ├── auth.py
│   │   │   └── health.py
│   ├── core/
│   │   ├── config.py
│   │   └── database.py
│   ├── models/   # SQLAlchemy models + Pydantic schemas
│   ├── services/ # logique métier (users, parcels, dispatch)
│   └── main.py
├── requirements.txt
└── .env.example
```

## Endpoints cibles (v1)
1. `GET /health` → statut API + DB
2. `POST /auth/login` → renvoie un token de session (JWT ou simple payload temporaire)
3. `GET /users` / `POST /users` (admin)
4. `POST /dispatch/upload` → persister les colis importés
5. `POST /dispatch/optimize` → renvoyer l'ordre optimisé (geopy + OR-Tools)
6. `POST /sorting/scan` → enregistrer un scan trieur
7. `GET /driver/{id}/route` → tournée ordonnée + liens Google Maps

## Étapes
1. **Scaffold** minimal (main + /health + /auth/login dummy) ✅ *(à réaliser)*
2. Intégrer connexion DB + services utilisateurs
3. Ajouter authentification JWT + middleware
4. Étendre aux modules dispatch/tri/chauffeur

Ce document servira de référence pendant la migration.

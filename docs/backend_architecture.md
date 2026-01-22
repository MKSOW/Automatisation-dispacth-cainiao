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
1. **Scaffold** minimal (main + /health + /auth/login dummy) ✅
2. **Intégrer connexion DB + services utilisateurs** ✅
   - Modèles SQLAlchemy (User, Parcel, Zone)
   - CRUD utilisateurs GET/POST/PATCH/DELETE /users (admin)
   - Authentification JWT + middleware de protection
3. **Module Dispatch** ✅
   - `POST /dispatch/parcels` : créer un colis
   - `POST /dispatch/upload` : import en masse
   - `POST /dispatch/assign` : assigner à un chauffeur
   - `POST /dispatch/geocode` : géocoder les adresses
   - `POST /dispatch/optimize` : optimisation TSP (geopy + OR-Tools)
   - `GET /dispatch/my-route` : tournée du chauffeur connecté
   - `PATCH /dispatch/parcels/{id}/status` : marquer livré
4. **Module Tri (Station de Scan)** ✅
   - `POST /sorting/scan` : scanner un colis → retourne chauffeur + position sac
   - `GET /sorting/stats` : statistiques du trieur (scans du jour)
   - `GET /sorting/driver/{id}/bag` : progression du sac d'un chauffeur
   - `GET /sorting/drivers/progress` : vue globale tous chauffeurs
   - `GET /sorting/pending` : colis assignés mais pas encore triés
5. Tests & déploiement — à faire

Ce document servira de référence pendant la migration.

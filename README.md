# Automatisation Dispatch Cainiao

## Démarrage avec Docker

### Prérequis
- Docker et Docker Compose installés

### Lancement rapide
```bash
# Démarrer tous les services
docker compose up -d

# Vérifier le statut
docker compose ps

# Arrêter tous les services
docker compose down
```

### Services disponibles
- **Frontend**: http://localhost:3001 (Next.js)
- **Backend API**: http://localhost:8001 (FastAPI)
- **Base de données**: localhost:5433 (PostgreSQL)

### Endpoints utiles
- Health check: http://localhost:8001/health
- Database check: http://localhost:8001/health/db
- API Documentation: http://localhost:8001/docs

### Développement
Les volumes sont montés pour permettre le développement en temps réel :
- `./backend:/app` pour le backend
- Pas de volume pour le frontend (image statique)

### Base de données
- **Host**: localhost:5433
- **User**: cainiao
- **Password**: cainiao
- **Database**: cainiao
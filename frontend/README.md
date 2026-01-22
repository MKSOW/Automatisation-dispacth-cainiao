# Cainiao Frontend (Next.js + Tailwind)

## Prérequis
- Node.js 18+
- npm (ou yarn/pnpm si vous adaptez les scripts)
- API backend accessible (variable `NEXT_PUBLIC_API_URL`)

## Installation
```bash
cd frontend
npm install
```

Créez un fichier `.env.local` pour définir l'URL de l'API :
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Développement
```bash
npm run dev
```
L’application est disponible sur http://localhost:3000.

## Scripts utiles
- `npm run build` : build production
- `npm start` : lancer le serveur Next.js en mode production
- `npm run lint` : ESLint (config Next.js)

## Pages incluses
- `/` : placeholder avec lien vers la connexion
- `/login` : écran de connexion reprenant la maquette (formulaire connecté à l’API)

Les styles globaux sont gérés par Tailwind (fichier `app/globals.css`).

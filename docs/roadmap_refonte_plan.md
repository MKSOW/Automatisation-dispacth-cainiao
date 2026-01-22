# Plan de Refonte Aligné sur la Roadmap

## 1. Résumé des Écarts Identifiés

| Domaine | Attendu (Roadmap + Maquettes) | État Actuel | Décision de Refonte |
| --- | --- | --- | --- |
| Authentification | Écran de connexion (maquette login) + rôles Admin/Trieur/Chauffeur | Aucune auth, pages accessibles sans login | Implémenter un module d'auth DB (login + session) et bloquer l'accès au dashboard tant que non connecté |
| Gestion Admin | CRUD utilisateurs, stats | Page `pages/1_Admin.py` déjà existante | Garder la page mais la protéger (admins uniquement) et ajouter protections (pas de suppression admin, feedbacks) |
| Dispatch & Optimisation | Carte + zones, enregistrements en DB, calcul des distances (geopy) + OR-Tools | Carte & filtre déjà présents mais pas de persistance ni optimisation | Réécrire la logique pour : (1) enregistrer les colis sélectionnés, (2) appeler un service d'optimisation, (3) afficher ordre + métriques |
| Modèle `parcels` | Champs status détaillé, timestamps dispatch/sort, assignation chauffeur/trieur | Table créée mais colonnes manquantes | Mettre à jour le schéma + migrations soft |
| Module Trieur | Interface de scan (maquettes `TRIEUR/…`) + enregistrement timestamp & id trieur | Non implémenté | Créer page `pages/2_Tri.py` avec UI douchette, intégrée au workflow |
| Module Chauffeur | App mobile (maquettes `LIVREUR_CHAUFFEUR/…`), liste ordonnée + bouton Maps | Non implémenté | Créer page `pages/3_Chauffeur.py` responsive |

## 2. Priorités Immédiates

1. **Authentification & Session**
   - Ajouter `bcrypt` + `streamlit-authenticator` ou module maison.
   - Écran inspiré de la maquette fournie (champ email + mot de passe, lien mot de passe oublié).
   - Gestion des rôles en session (admin, trieur, chauffeur).

2. **Hardening base `users`**
   - Migration pour ajouter `created_at`, `updated_at`, `last_login`, `is_active`.
   - Script de seed pour créer un admin initial.

3. **Persistance Dispatch**
   - Adapter `app.py` pour écrire les colis sélectionnés dans `parcels` (statut `pending` → `assigned`).
   - Introduire `geopy` (calcul distance) + squelette OR-Tools (ordre 1..N).

## 3. Backlog Fonctionnel (Phase)

- **Phase 1**
  - [ ] Login protégé + session
  - [ ] Page admin accessible uniquement aux admins
  - [ ] CRUD utilisateurs avec validations renforcées

- **Phase 2**
  - [ ] Persist dispatch dans `parcels`
  - [ ] Calcul des distances (geopy) + affichage KPI
  - [ ] Intégration OR-Tools pour l'ordre optimal

- **Phase 3**
  - [ ] Page Trieur (scan success/error states)
  - [ ] Sauvegarde timestamps et `sorter_id`

- **Phase 4**
  - [ ] Page Chauffeur (liste numérotée + bouton Maps)
  - [ ] Mise à jour statut à chaque stop

## 4. Actions Techniques Transverses

- Mettre à jour `requirements.txt` : `bcrypt`, `streamlit-authenticator`, `geopy`, `ortools`.
- Centraliser les accès DB (`database.py`).
- Ajouter des tests unitaires pour la logique d'auth et d'optimisation.
- Documenter la configuration (`README`, secrets Streamlit).

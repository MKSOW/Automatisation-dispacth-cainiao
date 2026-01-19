# 🚀 Logistics Hub - Master Plan d'Exécution

## 1. Vision du Projet
Créer un écosystème logistique complet : 
- **Admin :** Dispatch visuel, optimisation d'itinéraires et gestion des comptes.
- **Trieur :** Interface de scan rapide pour mise en sac par chauffeur.
- **Chauffeur :** Web-app mobile avec ordre de passage et guidage GPS.

## 2. Architecture Technique
- **Langage :** Python (Streamlit)
- **Base de Données :** SQLite (local) ou PostgreSQL (cloud)
- **Algorithme :** OR-Tools (Google) pour l'optimisation TSP (Trajet le plus court)
- **Authentification :** Streamlit Authenticator

## 3. Structure de la Base de Données (SQL)
- **users** : id, username, password, role (admin, trieur, chauffeur)
- **parcels** : id, tracking_no, source, status (pending, assigned, sorted, delivered), driver_id, sorter_id, sequence_order, timestamp_dispatch, timestamp_sort
- **zones** : id, zone_name, geojson_data

## 4. Phase 1 : Sécurisation et Comptes (Priorité 1)
- Créer un système de login.
- Créer l'interface "Admin : Gestion des Utilisateurs" (Ajouter/Supprimer chauffeurs et trieurs).

## 5. Phase 2 : Dispatch Master & Optimisation
- Modifier le module de dispatch pour enregistrer les colis en base de données.
- Intégrer `geopy` pour calculer les distances.
- **ALGORITHME :** Classer les colis de 1 à N dans la zone sélectionnée pour minimiser la distance totale.

## 6. Phase 3 : Module Station de Tri (Scan)
- Interface simplifiée : Champ de saisie (focus automatique pour douchette).
- Logique : `SI scan == tracking_no ALORS afficher NOM_CHAUFFEUR + POSITION_DANS_SAC`.
- Enregistrer le `timestamp` et l'`id_trieur` pour chaque scan réussi.

## 7. Phase 4 : Module Driver App (Mobile)
- Vue filtrée par `driver_id` et `status=assigned/sorted`.
- Affichage en liste numérotée (1, 2, 3...).
- Bouton "Démarrer Navigation" vers Google Maps via URL : `https://www.google.com/maps/search/?api=1&query={lat},{lon}`.
# Projet Géocaching – Explication

Bienvenue dans notre projet de Géocaching moderne !  
Cette application sert à organiser une chasse au trésor où chaque utilisateur peut cacher ou trouver des "géocaches" à l’aide de coordonnées GPS.

## Objectif Principal

- **Côté Serveur** : Gérer les utilisateurs (inscription, connexion via JWT), stocker les géocaches dans une base de données MongoDB, et définir des routes sécurisées pour créer, modifier ou supprimer des caches.
- **Côté Client** : Proposer une application mobile (React Native) permettant à l’utilisateur de localiser, commenter et marquer comme trouvées les différentes caches.

## Fonctionnalités Clés

1. **Inscription / Authentification**  
   - Création de compte avec e-mail et mot de passe.  
   - Génération d’un token JWT (valable 24h).  
   - Possibilité de se déconnecter.

2. **Gestion des Géocaches**  
   - Ajouter une cache avec : coordonnées GPS, créateur, difficulté, description optionnelle.  
   - Modifier ou supprimer une cache (uniquement si vous en êtes le créateur).

3. **Recherche & Affichage**  
   - Récupérer toutes les caches, filtrer par proximité.  
   - Afficher les caches sur une carte.  
   - Marquer une cache comme trouvée et laisser un commentaire.

## Extension Possible (Bonus)

- Classements divers (meilleurs joueurs, caches les plus populaires, etc.).  
- Ajout de photos sur les géocaches ou sur le profil d’un joueur.

## Organisation du Projet

- **serveur/** : le backend Node.js (Express, routes, contrôleurs, modèles, scripts d’initialisation DB).  
- **client/** : l’application mobile React Native (composants, écrans, services d’API, etc.).  
- **README.md** : document explicatif (celui-ci) décrivant le fonctionnement et les étapes d’installation.

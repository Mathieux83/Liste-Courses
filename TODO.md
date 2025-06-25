## 1. Backend

### Sécurité & Authentification
- Vérifier la robustesse de l’authentification (hashage des mots de passe, gestion des tokens JWT, middleware de protection des routes). ✅ <!-- Normalement c'est bon --> 
- Ajouter la validation des entrées côté serveur (express-validator ou Joi). ✅ <!-- Normalement c'est bon -->
- Protéger contre les injections SQL (ORM ou requêtes préparées).

### API & Contrôleurs
- S’assurer que toutes les routes renvoient des statuts HTTP cohérents.
- Gérer proprement les erreurs (try/catch, middleware d’erreur global).
- Ajouter des tests unitaires et d’intégration pour chaque contrôleur.

### Notifications & Web Push
- Vérifier la gestion des clés VAPID et la sécurité des notifications push.
- Tester la réception des notifications sur différents navigateurs.


## 2. Frontend

### Authentification & Sécurité
- Sécuriser le stockage des tokens (éviter localStorage si possible, préférer httpOnly cookies).
- Gérer l’expiration des sessions et la déconnexion automatique.

### UI/UX
- Améliorer l’ergonomie mobile (responsive, accessibilité).
- Ajouter des feedbacks utilisateurs (chargement, erreurs, succès).
- Uniformiser le design avec Tailwind (vérifier la cohérence des couleurs, polices, boutons).

### Fonctionnalités
- Vérifier la gestion offline (service worker, synchronisation des données).
- Tester le partage de liste et la gestion des droits d’accès.
- Ajouter la possibilité de modifier/supprimer des éléments de liste.

### Tests
- Couvrir tous les composants React avec des tests (Jest, React Testing Library).
- Tester les hooks personnalisés.
- Vérifier la couverture de code (coverage).

## 3. Qualité du code

### Refactoring
- Nettoyer le code mort ou non utilisé.
- Factoriser les fonctions utilitaires.
- Ajouter des commentaires et de la documentation.

### Performance
- Optimiser le chargement initial (code splitting, lazy loading).
- Réduire la taille des bundles (analyser avec Vite).

### Accessibilité
- Vérifier l’accessibilité (labels, navigation clavier, contrastes).

## 4. Déploiement & CI/CD

- Mettre en place un pipeline de déploiement (GitHub Actions, Vercel, etc.).
- Automatiser les tests à chaque push.
- Préparer un environnement de production sécurisé.

---

**Note** : Priorisez d’abord la sécurité et la robustesse, puis l’UX/UI, et enfin les optimisations/performance.
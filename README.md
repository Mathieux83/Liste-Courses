# Liste de Courses - Version 5-Beta

Application web moderne pour gérer vos listes de courses avec fonctionnalités de partage avancées et authentification utilisateur.

## ✨ Fonctionnalités

- ✅ Gestion complète des articles avec prix approximatifs
- 📱 Interface responsive avec Tailwind CSS
- 🔗 Partage par lien direct (lecture seule avec possibilité de cocher)
- 📸 Capture d'écran de la liste
- 📄 Export PDF formaté
- 🖨️ Impression optimisée
- 💰 Calcul automatique des totaux
- 💾 Sauvegarde automatique en base de données MongoDB
- 👤 Authentification utilisateur JWT (connexion, inscription, sécurité)
- 🗂️ Listes multiples par utilisateur

## 🛠️ Technologies

### Frontend
- **React 18** - Framework JavaScript moderne
- **Tailwind CSS** - Framework CSS utilitaire
- **Vite** - Build tool rapide
- **React Router** - Navigation
- **Axios** - Client HTTP
- **html2canvas** - Capture d'écran
- **jsPDF** - Génération PDF

### Backend
- **Node.js**
- **Express**
- **MongoDB + Mongoose**
- **CORS**
- **Helmet**
- **jsonwebtoken**

## 🚀 Installation

### Prérequis
- Node.js 18+
- npm ou yarn
- MongoDB (local ou cloud)

### Backend

```bash
cd backend
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## 📊 Structure de Base de Données (MongoDB)

### Collection `listes`
- `_id` - Identifiant unique (ObjectId)
- `nom` - Nom de la liste
- `description` - Description de la liste
- `articles` - Tableau d'articles (JSON)
- `utilisateurId` - Référence vers l'utilisateur (ObjectId)
- `estPrincipale` - Indicateur liste principale
- `dateCreation` - Date de création
- `dateModification` - Date de modification

### Collection `tokens_partage`
- `_id` - Identifiant unique
- `token` - Token de partage
- `listeId` - Référence vers la liste
- `dateCreation` - Date de création
- `dateExpiration` - Date d'expiration

### Collection `users`
- `_id` - Identifiant unique
- `email` - Email utilisateur
- `password` - Mot de passe hashé

## 🔧 Configuration

### Variables d'environnement (backend)

```env
PORT=3001
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/liste-courses
JWT_SECRET=une_chaine_secrete
```

### Ports par défaut
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:3001`

## 📡 API Endpoints

### Authentification
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `GET /api/auth/me` - Infos utilisateur connecté
- `POST /api/auth/logout` - Déconnexion

### Listes
- `GET /api/listes` - Obtenir toutes les listes de l'utilisateur
- `POST /api/listes` - Créer une nouvelle liste 
- `GET /api/listes/principale` - Obtenir la liste principale
- `POST /api/listes/principale` - Créer/mettre à jour la liste principale
- `POST /api/listes/:id/partage` - Générer un lien de partage
- `GET /api/listes/partage/:token` - Obtenir une liste partagée
- `GET /api/listes/:id/stats` - Statistiques de la liste
- `DELETE /api/listes/:id` - Supprimer une liste

## 🎨 Customisation

### Couleurs Tailwind
Les couleurs sont configurées dans `tailwind.config.js` sur la base de NORD:
- `primary` - Couleur principale (bleu)
- `success` - Succès (vert)
- `warning` - Avertissement (jaune)
- `danger` - Danger (rouge)

### Styles d'impression
Les styles d'impression sont définis dans `src/index.css` avec les classes:
- `.no-print` - Masquer à l'impression
- `.print-only` - Afficher uniquement à l'impression

## 🔒 Sécurité

- Limitation du taux de requêtes (100 req/15min)
- Headers de sécurité avec Helmet
- Validation des données entrantes
- Tokens de partage avec expiration (30 jours)
- Authentification JWT obligatoire pour toutes les routes protégées

## 📱 Responsive Design

L'application est optimisée pour:
- 📱 Mobile (320px+)
- 📲 Tablette (768px+)
- 💻 Desktop (1024px+)

## 🧪 Développement

### Scripts disponibles

**Frontend**

```bash
npm run dev # Serveur de développement
npm run build # Build de production
npm run preview # Aperçu du build
```

**Backend**

```bash
npm run dev # Serveur avec rechargement automatique
npm start # Serveur de production
```

## 📈 Améliorations futures

- [x] Authentification utilisateur
- [x] Listes multiples
- [ ] Catégories d'articles
- [ ] Synchronisation temps réel
- [ ] Mode hors ligne (PWA)
- [ ] Notifications push
- [ ] Intégration avec des services de livraison

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🆘 Support

En cas de problème, vérifiez:
1. Node.js version 18+
2. MongoDB en fonctionnement
3. Ports 3000 et 3001 disponibles
4. Variables d'environnement correctement configurées

Pour plus d'aide, créez une issue sur GitHub.

---

# 🎯 Instructions de Démarrage Rapide

```bash
# Cloner le repository
git clone <votre-repo>
cd liste-courses-v5

# Installer les dépendances backend
cd backend
npm install

# Installer les dépendances frontend
cd ../frontend
npm install

# Démarrer le backend (terminal 1)
cd ../backend
npm run dev

# Démarrer le frontend (terminal 2)
cd ../frontend
npm run dev
```
# Liste de Courses - Version 4

## Description
Cette application web permet de gérer une liste de courses de manière simple et intuitive. Elle inclut des fonctionnalités d'authentification, de gestion des utilisateurs, et de manipulation des listes de courses (ajout, suppression, marquage comme fait, etc.).

## Fonctionnalités principales
- **Authentification** : Inscription, connexion et déconnexion des utilisateurs.
- **Gestion des listes de courses** :
  - Ajouter des articles avec nom, quantité et catégorie.
  - Marquer les articles comme faits.
  - Supprimer des articles ou vider toute la liste.
- **Interface utilisateur moderne** : Design responsive et intuitif.

## Prérequis
- Python 3.10 ou supérieur
- Un environnement virtuel Python (recommandé)
- SQLite (inclus par défaut avec Python)

## Installation
1. Clonez ce dépôt :
   ```bash
   git clone <URL_DU_DEPOT>
   cd Liste-Courses/v4
   ```

2. Créez un environnement virtuel et activez-le :
   ```bash
   python -m venv env
   # Sous Windows
   .\env\Scripts\activate
   # Sous macOS/Linux
   source env/bin/activate
   ```

3. Installez les dépendances :
   ```bash
   pip install -r requirements.txt
   ```

4. Configurez les variables d'environnement :
   - Créez un fichier `.env` à la racine du projet.
   - Créez votre clé secrète :
    ```
    python -c "import secrets; print(secrets.token_hex(32))"
    ```
   - Ajoutez la clé secrète pour Flask :
     ```env
     SECRET_KEY=VotreCleSecreteIci
     ```

**PAS NECESSAIRE DE L'INITIALISER CAR EN L'ENCANT L'APP CELA LE FAIT AUTOMATIQUEMENT**
<!-- 5. Initialisez la base de données :
   ```bash
   python app.py
   ```
   Cela créera les tables nécessaires dans le fichier `shopping_list.db`. -->

## Lancement de l'application
1. Démarrez le serveur Flask :
   ```bash
   python app.py
   ```

2. Ouvrez votre navigateur et accédez à :
   ```
   http://127.0.0.1:5000
   ```

## Utilisation
1. **Inscription** : Créez un compte en cliquant sur "S'inscrire".
2. **Connexion** : Connectez-vous avec vos identifiants.
3. **Gestion des articles** :
   - Ajoutez des articles en remplissant le formulaire.
   - Marquez les articles comme faits en cochant les cases.
   - Supprimez des articles ou videz la liste.

## Structure du projet
- `app.py` : Fichier principal de l'application.
- `db_manager.py` : Gestion de la base de données.
- `static/` : Fichiers CSS, JavaScript et icônes.
- `templates/` : Fichiers HTML pour les pages de l'application.
- `shopping_list.db` : Base de données SQLite.
- `requirements.txt` : Liste des dépendances Python.

## Déploiement en production
Pour déployer en production, utilisez un serveur WSGI comme Gunicorn ou uWSGI avec un serveur web comme Nginx. Par exemple :

1. Installez Gunicorn :
   ```bash
   pip install gunicorn
   ```

2. Lancez l'application avec Gunicorn :
   ```bash
   gunicorn -w 4 -b 0.0.0.0:5000 app:app
   ```

3. Configurez Nginx pour servir l'application (voir la documentation officielle de Nginx).

## Contribution
Les contributions sont les bienvenues ! Veuillez soumettre une pull request ou ouvrir une issue pour signaler des bugs ou proposer des améliorations.

## Licence
Ce projet est sous licence MIT. Consultez le fichier `LICENSE` pour plus d'informations.

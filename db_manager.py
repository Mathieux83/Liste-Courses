#!/usr/bin/env python3
import sqlite3
import os

def get_db_connection():
    conn = sqlite3.connect('shopping_list.db')
    conn.row_factory = sqlite3.Row
    return conn

def check_database():
    """Vérifie l'état de la base de données"""
    print("=== DIAGNOSTIC DE LA BASE DE DONNÉES ===\n")
    
    # Vérifier si le fichier existe
    if not os.path.exists('shopping_list.db'):
        print("❌ Le fichier 'shopping_list.db' n'existe pas")
        print("💡 Lancez votre application Flask d'abord pour créer la DB")
        return False
    
    print("✅ Le fichier 'shopping_list.db' existe")
    
    try:
        conn = get_db_connection()
        
        # Lister toutes les tables
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        
        if not tables:
            print("❌ Aucune table trouvée dans la base de données")
            conn.close()
            return False
        
        print(f"📊 Tables trouvées: {len(tables)}")
        
        # Pour chaque table, afficher sa structure et son contenu
        for table in tables:
            table_name = table['name']
            print(f"\n{'='*50}")
            print(f"📋 TABLE: {table_name}")
            print('='*50)
            
            # Structure de la table
            cursor.execute(f"PRAGMA table_info({table_name})")
            columns = cursor.fetchall()
            print("🏗️ Structure:")
            for col in columns:
                print(f"  - {col[1]} ({col[2]}) {'PRIMARY KEY' if col[5] else ''}")
            
            # Contenu de la table
            cursor.execute(f"SELECT * FROM {table_name}")
            rows = cursor.fetchall()
            print(f"\n📊 Contenu ({len(rows)} enregistrements):")
            
            if len(rows) == 0:
                print("  (Aucun enregistrement)")
            else:
                # Afficher les en-têtes
                headers = [col[1] for col in columns]
                print("  " + " | ".join(headers))
                print("  " + "-" * (len(" | ".join(headers))))
                
                # Afficher les données (limité à 10 lignes)
                for i, row in enumerate(rows[:10]):
                    row_data = []
                    for col in headers:
                        value = row[col] if row[col] is not None else "NULL"
                        # Tronquer les longs textes
                        if isinstance(value, str) and len(value) > 20:
                            value = value[:17] + "..."
                        row_data.append(str(value))
                    print("  " + " | ".join(row_data))
                
                if len(rows) > 10:
                    print(f"  ... et {len(rows) - 10} autres enregistrements")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Erreur lors de l'accès à la base de données: {e}")
        return False

def create_database():
    """Crée ou recrée la base de données"""
    print("🔧 Création/Recréation de la base de données...")
    
    # Supprimer l'ancienne DB si elle existe
    if os.path.exists('shopping_list.db'):
        os.remove('shopping_list.db')
        print("🗑️ Ancienne base supprimée")
    
    try:
        conn = sqlite3.connect('shopping_list.db')
        conn.row_factory = sqlite3.Row
        
        # Table des utilisateurs
        conn.execute('''
            CREATE TABLE users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Table des listes de courses
        conn.execute('''
            CREATE TABLE courses (
                id TEXT PRIMARY KEY,
                user_id INTEGER NOT NULL,
                nom TEXT NOT NULL,
                quantite INTEGER NOT NULL,
                categorie TEXT NOT NULL,
                checked BOOLEAN DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        ''')
        
        conn.commit()
        conn.close()
        print("✅ Base de données créée avec succès!")
        return True
        
    except Exception as e:
        print(f"❌ Erreur lors de la création: {e}")
        return False

def add_test_data():
    """Ajoute des données de test"""
    try:
        from werkzeug.security import generate_password_hash
        import uuid
        
        conn = get_db_connection()
        
        # Ajouter un utilisateur de test
        password_hash = generate_password_hash('test123')
        conn.execute(
            'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
            ('testuser', 'test@example.com', password_hash)
        )
        
        # Récupérer l'ID de l'utilisateur
        user = conn.execute('SELECT id FROM users WHERE username = ?', ('testuser',)).fetchone()
        user_id = user['id']
        
        # Ajouter quelques courses de test
        test_courses = [
            {'nom': 'Pommes', 'quantite': 5, 'categorie': 'Fruits'},
            {'nom': 'Lait', 'quantite': 1, 'categorie': 'Produits laitiers'},
            {'nom': 'Pain', 'quantite': 2, 'categorie': 'Boulangerie'}
        ]
        
        for course in test_courses:
            conn.execute('''
                INSERT INTO courses (id, user_id, nom, quantite, categorie, checked)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (
                str(uuid.uuid4()),
                user_id,
                course['nom'],
                course['quantite'],
                course['categorie'],
                False
            ))
        
        conn.commit()
        conn.close()
        print("✅ Données de test ajoutées!")
        print("👤 Utilisateur test: testuser / test123")
        
    except Exception as e:
        print(f"❌ Erreur lors de l'ajout des données de test: {e}")

if __name__ == '__main__':
    print("🔍 INSPECTEUR DE BASE DE DONNÉES SQLITE")
    print("=====================================\n")
    
    while True:
        print("\nOptions disponibles:")
        print("1. 🔍 Examiner la base de données")
        print("2. 🔧 Créer/Recréer la base de données")
        print("3. 📝 Ajouter des données de test")
        print("4. 🚪 Quitter")
        
        choice = input("\nVotre choix (1-4): ").strip()
        
        if choice == '1':
            check_database()
        elif choice == '2':
            if create_database():
                print("\n💡 Vous pouvez maintenant ajouter des données de test (option 3)")
        elif choice == '3':
            if os.path.exists('shopping_list.db'):
                add_test_data()
            else:
                print("❌ Créez d'abord la base de données (option 2)")
        elif choice == '4':
            print("👋 Au revoir!")
            break
        else:
            print("❌ Choix invalide, essayez encore")
        
        input("\nAppuyez sur Entrée pour continuer...")
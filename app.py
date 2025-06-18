from flask import Flask, request, jsonify, render_template, redirect, url_for, flash, session
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
import sqlite3
import json
import os
from dotenv import load_dotenv
import secrets
from uuid import uuid4
from datetime import datetime

load_dotenv()

app = Flask(__name__)

app.secret_key = os.environ.get('SECRET_KEY') or secrets.token_hex(32)


# Configuration Flask-Login
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'
login_manager.login_message = 'Veuillez vous connecter pour accéder à cette page.'

# Modèle utilisateur
class User(UserMixin):
    def __init__(self, id, username, email):
        self.id = id
        self.username = username
        self.email = email

@login_manager.user_loader
def load_user(user_id):
    conn = get_db_connection()
    user = conn.execute('SELECT * FROM users WHERE id = ?', (user_id,)).fetchone()
    conn.close()
    if user:
        return User(user['id'], user['username'], user['email'])
    return None

def get_db_connection():
    conn = sqlite3.connect('shopping_list.db')
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    
    # Table des utilisateurs
    conn.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Table des listes de courses
    conn.execute('''
        CREATE TABLE IF NOT EXISTS courses (
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

def load_user_courses(user_id):
    conn = get_db_connection()
    courses = conn.execute(
        'SELECT * FROM courses WHERE user_id = ? ORDER BY created_at DESC', 
        (user_id,)
    ).fetchall()
    conn.close()
    
    return [dict(course) for course in courses]

def save_course(user_id, course_data):
    conn = get_db_connection()
    conn.execute('''
        INSERT INTO courses (id, user_id, nom, quantite, categorie, checked)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (
        course_data['id'],
        user_id,
        course_data['nom'],
        course_data['quantite'],
        course_data['categorie'],
        course_data['checked']
    ))
    conn.commit()
    conn.close()

init_db()


# Routes d'authentification
@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        email = request.form['email']
        password = request.form['password']
        
        if not username or not email or not password:
            flash('Tous les champs sont requis.')
            return render_template('register.html')
        
        conn = get_db_connection()
        
        # Vérifier si l'utilisateur existe déjà
        existing_user = conn.execute(
            'SELECT id FROM users WHERE username = ? OR email = ?', 
            (username, email)
        ).fetchone()
        
        if existing_user:
            flash('Un utilisateur avec ce nom ou cet email existe déjà.')
            conn.close()
            return render_template('register.html')
        
        # Créer le nouvel utilisateur
        password_hash = generate_password_hash(password)
        conn.execute(
            'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
            (username, email, password_hash)
        )
        conn.commit()
        conn.close()
        
        flash('Inscription réussie ! Vous pouvez maintenant vous connecter.')
        return redirect(url_for('login'))
    
    return render_template('register.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        
        conn = get_db_connection()
        user = conn.execute(
            'SELECT * FROM users WHERE username = ?', (username,)
        ).fetchone()
        conn.close()
        
        if user and check_password_hash(user['password_hash'], password):
            user_obj = User(user['id'], user['username'], user['email'])
            login_user(user_obj)
            return redirect(url_for('index'))
        else:
            flash('Nom d\'utilisateur ou mot de passe incorrect.')
    
    return render_template('login.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    flash('Vous avez été déconnecté.')
    return redirect(url_for('login'))

# Routes principales
@app.route('/')
@login_required
def index():
    courses = load_user_courses(current_user.id)
    return render_template('index.html', courses=courses, username=current_user.username)

# API REST pour interactions asynchrones
@app.route('/api/courses', methods=['GET'])
@login_required
def get_courses():
    return jsonify(load_user_courses(current_user.id))

@app.route('/api/courses', methods=['POST'])
@login_required
def add_course():
    data = request.get_json()
    if all(k in data for k in ('nom', 'quantite', 'categorie')):
        course_data = {
            'id': str(uuid4()),
            'nom': data['nom'],
            'quantite': data['quantite'],
            'categorie': data['categorie'],
            'checked': False
        }
        save_course(current_user.id, course_data)
        return jsonify({'success': True}), 201
    return jsonify({'error': 'Invalid data'}), 400

@app.route('/api/courses/<course_id>/check', methods=['POST'])
@login_required
def check_item(course_id):
    if not course_id or course_id == "undefined":
        return jsonify({'error': 'Invalid ID'}), 400
    
    conn = get_db_connection()
    course = conn.execute(
        'SELECT * FROM courses WHERE id = ? AND user_id = ?', 
        (course_id, current_user.id)
    ).fetchone()
    
    if course:
        new_checked = not course['checked']
        conn.execute(
            'UPDATE courses SET checked = ? WHERE id = ? AND user_id = ?',
            (new_checked, course_id, current_user.id)
        )
        conn.commit()
        conn.close()
        return jsonify({'success': True})
    
    conn.close()
    return jsonify({'error': 'Invalid ID'}), 400

@app.route('/api/courses/<course_id>', methods=['DELETE'])
@login_required
def delete_item(course_id):
    if not course_id or course_id == "undefined":
        return jsonify({'error': 'Invalid ID'}), 400
    
    conn = get_db_connection()
    result = conn.execute(
        'DELETE FROM courses WHERE id = ? AND user_id = ?', 
        (course_id, current_user.id)
    )
    conn.commit()
    
    if result.rowcount > 0:
        conn.close()
        return jsonify({'success': True})
    
    conn.close()
    return jsonify({'error': 'Invalid ID'}), 400

@app.route('/api/courses/clear', methods=['POST'])
@login_required
def clear_list():
    conn = get_db_connection()
    conn.execute('DELETE FROM courses WHERE user_id = ?', (current_user.id,))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

if __name__ == '__main__':
    app.run(debug=True)
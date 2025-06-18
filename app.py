from flask import Flask, request, jsonify, render_template
import json, os
from uuid import uuid4

app = Flask(__name__)

def load_courses():
    if os.path.exists("liste_courses.json"):
        with open("liste_courses.json", "r", encoding="utf-8") as f:
            try:
                return json.load(f)
            except json.JSONDecodeError:
                return []
    return []

def save_courses(courses):
    with open("liste_courses.json", "w", encoding="utf-8") as f:
        json.dump(courses, f, ensure_ascii=False, indent=2)

@app.route('/', methods=['GET'])
def index():
    courses = load_courses()
    return render_template('index.html', courses=courses)

# API REST pour interactions asynchrones

@app.route('/api/courses', methods=['GET'])
def get_courses():
    return jsonify(load_courses())

@app.route('/api/courses', methods=['POST'])
def add_course():
    data = request.get_json()
    courses = load_courses()
    if all(k in data for k in ('nom', 'quantite', 'categorie')):
        courses.append({
            'id': str(uuid4()),  # Ajout d'un id unique
            'nom': data['nom'],
            'quantite': data['quantite'],
            'categorie': data['categorie'],
            'checked': False
        })
        save_courses(courses)
        return jsonify({'success': True}), 201
    return jsonify({'error': 'Invalid data'}), 400


@app.route('/api/courses/<course_id>/check', methods=['POST'])
def check_item(course_id):
    if not course_id or course_id == "undefined":
        return jsonify({'error': 'Invalid ID'}), 400
    courses = load_courses()
    for i, course in enumerate(courses):
        if course['id'] == course_id:
            courses[i]['checked'] = not courses[i].get('checked', False)
            save_courses(courses)
            return jsonify({'success': True})
    return jsonify({'error': 'Invalid ID'}), 400

@app.route('/api/courses/<course_id>', methods=['DELETE'])
def delete_item(course_id):
    if not course_id or course_id == "undefined":
        return jsonify({'error': 'Invalid ID'}), 400
    courses = load_courses()
    for i, course in enumerate(courses):
        if course['id'] == course_id:
            del courses[i]
            save_courses(courses)
            return jsonify({'success': True})
    return jsonify({'error': 'Invalid ID'}), 400

@app.route('/api/courses/clear', methods=['POST'])
def clear_list():
    save_courses([])
    return jsonify({'success': True})

if __name__ == '__main__':
    app.run(debug=True)

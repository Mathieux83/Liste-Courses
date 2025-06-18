// Gestion de la liste asynchrone + animation ajout/suppression + animation conteneur

document.addEventListener('DOMContentLoaded', function() {

  async function fetchCourses(isNewItem = false, isRemoving = false) {
    const res = await fetch('/api/courses');
    const courses = await res.json();
    const list = document.getElementById('coursesList');
    const container = document.querySelector('.container-list');
    
    list.innerHTML = '';

    // Animation du conteneur selon le contexte
    if (isNewItem) {
      container.classList.add('adding');
      setTimeout(() => container.classList.remove('adding'), 600);
    } else if (isRemoving) {
      container.classList.add('removing-item');
      setTimeout(() => container.classList.remove('removing-item'), 600);
    }

    // Gestion du conteneur vide
    if (courses.length === 0) {
      container.classList.add('empty');
    } else {
      container.classList.remove('empty');
    }

    courses.forEach((item, index) => {
      const li = document.createElement('li');
      li.className = item.checked ? 'checked' : '';

      // Structure HTML avec checkbox personnalisée
      li.innerHTML = `
        <div class="custom-checkbox">
          <input type="checkbox" id="check-${item.id}" class="check-btn" ${item.checked ? 'checked' : ''}>
          <label for="check-${item.id}" class="checkbox-label">
            <img src="../static/ico/check-box-outline-blank.svg" class="checkbox-unchecked" width="24" height="24">
            <img src="../static/ico/check-box-outline-rounded.svg" class="checkbox-checked" width="24" height="24">
          </label>
        </div>
        <span class="item-text">${item.nom} (${item.quantite}) - ${item.categorie}</span>
        <button class="delete-btn"><img src="../static/ico/cross.svg" width="24" height="24"></button>
      `;

      // Gestion suppression avec animation SYNCHRONISÉE
      li.querySelector('.delete-btn').addEventListener('click', function(e) {
        e.preventDefault();
        
        // Déclencher SIMULTANÉMENT les deux animations
        const container = document.querySelector('.container-list');
        
        // Animation de l'élément
        li.classList.add('removing');
        
        // Animation du conteneur EN MÊME TEMPS
        container.classList.add('removing-item');
        
        setTimeout(() => {
          // Nettoyer les classes d'animation du conteneur
          container.classList.remove('removing-item');
          // Supprimer l'élément
          deleteItem(item.id);
        }, 500);
      });

      // Gestion check/décheck
      li.querySelector('.check-btn').addEventListener('change', function(e) {
        checkItem(item.id);
      });

      list.appendChild(li);

      // Animation d'ajout CORRECTE pour le dernier élément
      if (isNewItem && index === courses.length - 1) {
        // Animation d'entrée : commence invisible puis apparaît
        li.style.opacity = '0';
        li.style.transform = 'translateY(-20px)';
        
        setTimeout(() => {
          li.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
          li.style.opacity = '1';
          li.style.transform = 'translateY(0)';
        }, 50);
      }
    });
  }

  // Ajout d'un élément
  document.querySelector('.formulaire-course').onsubmit = async function(e) {
    e.preventDefault();
    const nom = document.getElementById('nom').value;
    const quantite = document.getElementById('quantite').value;
    const categorie = document.getElementById('categorie').value;
    
    await fetch('/api/courses', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ nom, quantite, categorie })
    });
    
    this.reset();
    fetchCourses(true, false); // Déclenche l'animation d'ajout
  };

  // Cocher/décocher
  async function checkItem(courseID) {
    await fetch(`/api/courses/${courseID}/check`, { method: 'POST' });
    fetchCourses(false, false); // Pas d'animation conteneur
  }

  // Suppression (animation gérée dans le click)
  async function deleteItem(courseID) {
    await fetch(`/api/courses/${courseID}`, { method: 'DELETE' });
    fetchCourses(false, false); // Pas d'animation supplémentaire
  }

  // Vider la liste
  document.getElementById('clearBtn').onclick = async function() {
    const container = document.querySelector('.container-list');
    const allItems = document.querySelectorAll('.liste-courses li');
    
    // Animation de tous les éléments
    allItems.forEach((item, index) => {
      setTimeout(() => {
        item.classList.add('removing');
      }, index * 50); // Effet en cascade
    });
    
    // Animation du conteneur
    container.classList.add('removing-item');
    
    setTimeout(async () => {
      await fetch('/api/courses/clear', { method: 'POST' });
      fetchCourses(false, false);
      container.classList.remove('removing-item');
    }, 400);
  };

  // Initialisation
  fetchCourses(false, false);
});
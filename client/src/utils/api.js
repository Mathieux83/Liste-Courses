import axios from 'axios'
import logger from '../services/logger.js';

const API_BASE_URL = import.meta.env.VITE_API_URL

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
  withCredentials: true // Toujours envoyer les cookies
})

// Intercepteur pour la gestion des erreurs et de l'authentification
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status !== 401) {
      console.error('Erreur API:', error)
    }
    throw error
  }
)

export const api = {

  // Obtenir toutes les listes de l'utilisateur
  obtenirListes: async () => {
    try {
      const response = await apiClient.get('/listes');
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return [];
      }
      throw error;
    }
  },

  // Obtenir une liste par son id
  obtenirListeParId: async (id) => {
    try {
      const response = await apiClient.get(`/listes/${id}`)
      return response.data
    } catch (error) {
      throw error
    }
  },

  creerListe: async (listeData) => {
    try {
      console.log('Envoi de la requête de création de liste à /api/listes/dashboard/newliste')
      const response = await apiClient.post('/listes', listeData)
      console.log('Réponse reçue:', response.data)
      return response.data
    } catch (error) {
      console.error('Erreur lors de la création de la liste:', error)
      throw error
    }
  },
  
  // Supprimer une liste
  supprimerListe: async (id) => {
    try {
      console.log(`[API] Tentative de suppression de la liste avec l'ID: ${id}`);
      const response = await apiClient.delete(`/listes/${id}`);
      
      return response.data;
    } catch (error) {
      console.error('[API] Erreur lors de la suppression de la liste:', error);
      throw error;
    }
  },

  // Ajouter un article à une liste
  ajouterArticleAListe: async (listeId, itemData) => {
    try {
      const response = await apiClient.post(`/listes/${listeId}/items`, itemData);
      return response.data || response;
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  // Mettre à jour un article dans une liste
  mettreAJourArticleDansListe: async (listeId, itemId, itemData) => {
    try {
      const response = await apiClient.patch(
        `/listes/${listeId}/items/${itemId}`, 
        itemData
      );
      return response.data || response;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'article:', error);
      throw error;
    }
  },

  // Supprimer un article d'une liste
  supprimerArticleDeListe: async (listeId, itemId) => {
    try {
      const response = await apiClient.delete(`/listes/${listeId}/items/${itemId}`);
      return response.data || response;
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'article:', error);
      throw error;
    }
  },

  // Effacer tous les articles d'une liste
  effacerArticlesDeListe: async (listeId) => {
    try {
      const response = await apiClient.delete(`/listes/${listeId}/items`);
      return response.data || response;
    } catch (error) {
      console.error('[API] Erreur lors de la suppression des articles:', error);
      throw error;
    }
  },

  // Sauvegarder la liste (PUT si id, POST sinon)
  sauvegarderListe: async (listeData) => {
    try {
      if (listeData.id) {
        const response = await apiClient.put(
          `/listes/${listeData.id}`, 
          listeData
        );
        return response.data;
      } else {
        const response = await apiClient.post('/listes', listeData);
        return response.data;
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la liste:', error);
      throw error;
    }
  },

  // Obtenir une liste partagée
  obtenirListePartagee: async (token) => {
    try {
      const response = await apiClient.get(`/listes/partage/${token}`)
      return response.data
    } catch (error) {
      throw error
    }
  },

  // Générer un token de partage
  genererTokenPartage: async (listeId) => {
    try {
      const response = await apiClient.post(`/listes/${listeId}/partage`)
      return response.data.token
    } catch (error) {
      throw error
    }
  },

  // Mettre à jour le statut d'un article dans une liste partagée
  mettreAJourArticlePartage: async (token, articleId, checked, username) => {
    try {
      const response = await apiClient.patch(
        `/listes/partage/${token}/articles/${articleId}`, 
        { checked, username }
      );
      return response.data || response;
    } catch (error) {
      throw error;
    }
  },
}

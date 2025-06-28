import axios from 'axios'

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

// Fonction utilitaire pour normaliser les réponses de l'API
const normaliseApiResponse = (data) => {
  if (!data) return data;
  
  // Fonction récursive pour normaliser un objet
  const normalizeObject = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    
    // Créer une copie de l'objet
    const normalized = { ...obj };
    
    // Normaliser l'ID
    if (normalized._id || normalized.id) {
      const id = normalized._id || normalized.id;
      normalized._id = id;
      normalized.id = id;
    }
    
    // Parcourir toutes les propriétés de l'objet
    Object.keys(normalized).forEach(key => {
      // Normaliser les tableaux imbriqués
      if (Array.isArray(normalized[key])) {
        normalized[key] = normalized[key].map(item => 
          typeof item === 'object' ? normalizeObject(item) : item
        );
      }
      // Normaliser les objets imbriqués
      else if (normalized[key] && typeof normalized[key] === 'object') {
        normalized[key] = normalizeObject(normalized[key]);
      }
    });
    
    return normalized;
  };
  
  // Gérer les tableaux
  if (Array.isArray(data)) {
    return data.map(item => 
      typeof item === 'object' ? normalizeObject(item) : item
    );
  }
  
  // Gérer les objets
  if (typeof data === 'object') {
    return normalizeObject(data);
  }
  
  return data;
}

export const api = {

  // Obtenir toutes les listes de l'utilisateur
  obtenirListes: async () => {
    try {
      const response = await apiClient.get('/listes');
      return normaliseApiResponse(response.data);
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
      return normaliseApiResponse(response.data)
    } catch (error) {
      throw error
    }
  },

  creerListe: async (listeData) => {
    try {
      console.log('Envoi de la requête de création de liste à /api/listes/dashboard/newliste')
      const response = await apiClient.post('/listes', listeData)
      console.log('Réponse reçue:', response.data)
      return normaliseApiResponse(response.data)
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
      console.log('[API] Réponse de la suppression de la liste:', response.data);
      return normaliseApiResponse(response.data);
    } catch (error) {
      console.error('[API] Erreur lors de la suppression de la liste:', error);
      throw error;
    }
  },

  // Ajouter un article à une liste
  ajouterArticleAListe: async (listeId, itemData) => {
    try {
      // Normaliser l'ID de la liste et de l'article
      const normalizedItemData = {
        ...itemData,
        _id: itemData._id || itemData.id // S'assurer que _id est défini
      };
      const response = await apiClient.post(`/listes/${listeId}/items`, normalizedItemData);
      return normaliseApiResponse(response.data || response);
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
      // Normaliser l'ID de l'article dans les données
      const normalizedItemData = {
        ...itemData,
        _id: itemData._id || itemData.id || itemId // S'assurer que _id est défini
      };
      const response = await apiClient.patch(
        `/listes/${listeId}/items/${itemId}`, 
        normalizedItemData
      );
      return normaliseApiResponse(response.data || response);
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'article:', error);
      throw error;
    }
  },

  // Supprimer un article d'une liste
  supprimerArticleDeListe: async (listeId, itemId) => {
    try {
      // Normaliser les IDs
      const normalizedListeId = listeId._id || listeId;
      const normalizedItemId = itemId._id || itemId;
      
      console.log(`[API] Tentative de suppression de l'article ${normalizedItemId} de la liste ${normalizedListeId}`);
      
      const response = await apiClient.delete(`/listes/${normalizedListeId}/items/${normalizedItemId}`);
      
      console.log('[API] Réponse de la suppression de l\'article:', response.data);
      
      return normaliseApiResponse(response.data || response);
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'article:', error);
      
      let errorMessage = 'Erreur lors de la suppression de l\'article';
      if (error.response?.status === 404) {
        errorMessage = 'Article ou liste non trouvé';
      } else if (error.response?.status === 403) {
        errorMessage = 'Non autorisé à supprimer cet article';
      }
      
      const errorWithMessage = new Error(errorMessage);
      errorWithMessage.originalError = error;
      throw errorWithMessage;
    }
  },

  // Effacer tous les articles d'une liste
  effacerArticlesDeListe: async (listeId) => {
    try {
      console.log(`[API] Tentative de suppression de tous les articles de la liste ${listeId}`);
      
      // Vérifier que l'ID de la liste est valide
      if (!listeId) {
        throw new Error('ID de liste manquant');
      }
      
      const response = await apiClient.delete(`/listes/${listeId}/items`);
      console.log('[API] Réponse de la suppression des articles:', response.data);
      
      // Normaliser la réponse
      const result = normaliseApiResponse(response.data || response);
      console.log('[API] Résultat normalisé de la suppression des articles:', result);
      
      return result;
    } catch (error) {
      console.error('[API] Erreur lors de la suppression des articles:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers
        }
      });
      
      // Renvoyer une erreur plus descriptive
      const errorMessage = error.response?.data?.error || 
                         error.message || 
                         'Erreur lors de la suppression des articles';
      
      const customError = new Error(errorMessage);
      customError.status = error.response?.status || 500;
      throw customError;
    }
  },

  // Sauvegarder la liste (PUT si id, POST sinon)
  sauvegarderListe: async (listeData) => {
    try {
      // Normaliser les données de la liste
      const normalizedListeData = {
        ...listeData,
        _id: listeData._id || listeData.id, // S'assurer que _id est défini
        // Si la liste contient des articles, normaliser leurs IDs
        articles: listeData.articles?.map(article => ({
          ...article,
          _id: article._id || article.id // S'assurer que chaque article a un _id
        }))
      };

      if (normalizedListeData._id) {
        const response = await apiClient.put(
          `/listes/${normalizedListeData._id}`, 
          normalizedListeData, 
          { nom: normalizedListeData.nom }
        );
        return normaliseApiResponse(response.data);
      } else {
        const response = await apiClient.post('/listes', normalizedListeData);
        return normaliseApiResponse(response.data);
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
      return normaliseApiResponse(response.data)
    } catch (error) {
      throw error
    }
  },

  // Générer un token de partage
  genererTokenPartage: async (listeId) => {
    try {
      const response = await apiClient.post(`/listes/${listeId}/partage`)
      return normaliseApiResponse(response.data.token)
    } catch (error) {
      throw error
    }
  },

  // Mettre à jour le statut d'un article dans une liste partagée
  mettreAJourArticlePartage: async (token, articleId, checked, username) => {
    try {
      console.log('API PATCH guest', token, articleId, checked, username);
      // Normaliser l'ID de l'article
      const normalizedArticleId = articleId._id || articleId;
      const response = await apiClient.patch(
        `/listes/partage/${token}/articles/${normalizedArticleId}`, 
        { checked, username }
      );
      return normaliseApiResponse(response.data || response);
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'article partagé:', error);
      throw error;
    }
  },
}

import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL

// Configuration axios avec authentification
// import authService from './authService'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
  withCredentials: true
})

// // Intercepteur pour ajouter le token aux requêtes
// apiClient.interceptors.request.use(
//   (config) => {
//     const token = authService.getToken()
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`
//     }
//     return config
//   },
//   (error) => {
//     return Promise.reject(error)
//   }
// )

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

    obtenirListes: async () => {
    try {
      const response = await apiClient.get('/listes')
      return response
    } catch (error) {
      throw error
    }
  },

  // Obtenir la liste principale
  obtenirListe: async () => {
    try {
      const response = await apiClient.get('/listes/principale')
      return response.data
    } catch (error) {
      if (error.response?.status === 404) {
        return null
      }
      throw error
    }
  },

    creerListe: async (listeData) => {
    try {
      const response = await apiClient.post('/listes', listeData)
      return response.data
    } catch (error) {
      throw error
    }
  },

  // Sauvegarder la liste
  sauvegarderListe: async (listeData) => {
    try {
      const response = await apiClient.post('/listes', listeData)
      return response.data
    } catch (error) {
      throw error
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
  mettreAJourArticlePartage: async (token, articleId, checked) => {
    try {
      const response = await apiClient.patch(`/listes/partage/${token}/articles/${articleId}`, {
        checked
      })
      return response.data
    } catch (error) {
      throw error
    }
  },

    supprimerListe: async (id) => {
    try {
      const response = await apiClient.delete(`/listes/${id}`)
      return response.data
    } catch (error) {
      throw error
    }
  },


}

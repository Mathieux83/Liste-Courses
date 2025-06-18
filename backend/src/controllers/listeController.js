import { Liste } from '../models/Liste.js'
import { getIO } from '../socket.js'

export const listeController = {
  // Obtenir toutes les listes d'un utilisateur
  async getListes(req, res) {
    try {
      const listes = await Liste.getListesUtilisateur(req.user.id)
      res.json(listes)
    } catch (error) {
      console.error('Erreur lors de la récupération des listes:', error)
      res.status(500).json({ error: 'Erreur interne du serveur' })
    }
  },

  // Obtenir la liste principale
  async obtenirPrincipale(req, res) {
    try {
      const liste = await Liste.obtenirPrincipale(req.user.id)
      if (liste) {
        res.json(liste)
      } else {
        res.status(404).json({ error: 'Aucune liste principale trouvée' })
      }
    } catch (error) {
      console.error('Erreur lors de la récupération de la liste principale:', error)
      res.status(500).json({ error: 'Erreur interne du serveur' })
    }
  },

  // Obtenir une liste spécifique
  async getListe(req, res) {
    try {
      const liste = await Liste.obtenirParId(req.params.id, req.user.id)
      if (!liste) {
        return res.status(404).json({ error: 'Liste non trouvée' })
      }
      res.json(liste)
    } catch (error) {
      console.error('Erreur lors de la récupération de la liste:', error)
      res.status(500).json({ error: 'Erreur interne du serveur' })
    }
  },
  // Sauvegarder une liste principale
  async sauvegarder(req, res) {
    try {
      const { nom, articles } = req.body
      
      // Validation des données
      if (!nom || !Array.isArray(articles)) {
        return res.status(400).json({ 
          error: 'Données invalides',
          details: 'Le nom et les articles sont requis'
        })
      }

      const liste = await Liste.sauvegarderPrincipale(nom, articles, req.user.id)
      res.json(liste)
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
      res.status(500).json({ error: 'Erreur lors de la sauvegarde' })
    }
  },

  // Créer une nouvelle liste
  async creerListe(req, res) {
    try {
      const { nom, articles } = req.body
      
      // Validation des données
      if (!nom || !Array.isArray(articles)) {
        return res.status(400).json({ 
          error: 'Données invalides',
          details: 'Le nom et les articles sont requis'
        })
      }      const liste = await Liste.creerListe(nom, articles, req.user.id)
      // Émettre un événement pour informer les clients connectés
      getIO().to(`user-${req.user.id}`).emit('liste:created', liste)
      res.status(201).json(liste)
    } catch (error) {
      console.error('Erreur lors de la création de la liste:', error)
      res.status(500).json({ error: 'Erreur lors de la création' })
    }
  },

  // Mettre à jour une liste
  async mettreAJourListe(req, res) {
    try {
      const { nom, articles } = req.body
      
      // Validation des données
      if (!nom || !Array.isArray(articles)) {
        return res.status(400).json({ 
          error: 'Données invalides',
          details: 'Le nom et les articles sont requis'
        })
      }      const liste = await Liste.mettreAJourListe(req.params.id, nom, articles, req.user.id)
      // Émettre un événement pour informer les clients connectés
      getIO().to(`liste-${req.params.id}`).emit('liste:updated', liste)
      res.json(liste)
    } catch (error) {
      if (error.message === 'Liste non trouvée ou non autorisée') {
        res.status(404).json({ error: error.message })
      } else {
        console.error('Erreur lors de la mise à jour:', error)
        res.status(500).json({ error: 'Erreur lors de la mise à jour' })
      }
    }
  },

  // Supprimer une liste
  async supprimerListe(req, res) {
    try {      await Liste.supprimerListe(req.params.id, req.user.id)
      // Émettre un événement pour informer les clients connectés
      getIO().to(`user-${req.user.id}`).emit('liste:deleted', { id: req.params.id })
      res.status(204).end()
    } catch (error) {
      if (error.message === 'Liste non trouvée, non autorisée ou liste principale') {
        res.status(404).json({ error: error.message })
      } else {
        console.error('Erreur lors de la suppression:', error)
        res.status(500).json({ error: 'Erreur lors de la suppression' })
      }
    }
  },

  // Générer un token de partage
  async genererTokenPartage(req, res) {
    try {
      const { id } = req.params
      
      const liste = await Liste.obtenirParId(parseInt(id))
      if (!liste) {
        return res.status(404).json({ error: 'Liste non trouvée' })
      }

      const token = await Liste.creerTokenPartage(parseInt(id))
      res.json({ token })
    } catch (error) {
      console.error('Erreur lors de la génération du token:', error)
      res.status(500).json({ error: 'Erreur lors de la génération du token' })
    }
  },

  // Obtenir une liste partagée
  async obtenirPartagee(req, res) {
    try {
      const { token } = req.params
      
      const liste = await Liste.obtenirParToken(token)
      if (liste) {
        res.json(liste)
      } else {
        res.status(404).json({ 
          error: 'Liste non trouvée ou token expiré'
        })
      }
    } catch (error) {
      console.error('Erreur lors de la récupération de la liste partagée:', error)
      res.status(500).json({ error: 'Erreur interne du serveur' })
    }
  }
}

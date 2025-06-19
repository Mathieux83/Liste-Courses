import { Liste } from '../models/Liste.js'
import { getIO } from '../socket.js'
import mongoose from 'mongoose';

export const listeController = {
  // Obtenir toutes les listes d'un utilisateur
  async getListes(req, res) {
    try {
      // Ajoute ce log pour voir l'ID utilisateur et son type
      // console.log('req.user.id:', req.user.id, typeof req.user.id);

        // Correction : s'assurer que l'ID est bien un ObjectId
      let utilisateurId = req.user.id;
      if (typeof utilisateurId === 'string' && utilisateurId.length === 24) {
        try {
          utilisateurId = new mongoose.Types.ObjectId(utilisateurId);
        } catch (e) {}
      }
      const listes = await Liste.getListesUtilisateur(utilisateurId);
    res.json(listes);
  } catch (error) {
    console.error('Erreur lors de la récupération des listes:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
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
      const { nom, articles } = req.body;
      const liste = await Liste.sauvegarderPrincipale(nom, articles, req.user.id);
      res.json(liste);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      res.status(500).json({ error: 'Erreur lors de la sauvegarde' });
    }
  },

  // Créer une nouvelle liste
  async creerListe(req, res) {
    try {
      let utilisateurId = req.user.id;
      if (typeof utilisateurId === 'string' && utilisateurId.length === 24) {
        try {
          utilisateurId = new (require('mongoose')).Types.ObjectId(utilisateurId);
        } catch (e) {}
      }
      const { nom, articles } = req.body;
      const liste = await Liste.creerListe(nom, articles, utilisateurId); // <-- ici, passe utilisateurId
      // Émettre un événement pour informer les clients connectés
      getIO().to(`user-${req.user.id}`).emit('liste:created', liste);
      res.status(201).json(liste);
    } catch (error) {
      console.error('Erreur lors de la création de la liste:', error);
      res.status(500).json({ error: 'Erreur lors de la création' });
    }
  },

  // Mettre à jour une liste
  async mettreAJourListe(req, res) {
    try {
      const { nom, articles } = req.body;
      // Validation des données
      const liste = await Liste.mettreAJourListe(req.params.id, nom, articles, req.user.id);
      // Émettre un événement pour informer les clients connectés
      getIO().to(`liste-${req.params.id}`).emit('liste:updated', liste);
      res.json(liste);
    } catch (error) {
      if (error.message === 'Liste non trouvée ou non autorisée') {
        res.status(404).json({ error: error.message });
      } else {
        console.error('Erreur lors de la mise à jour:', error);
        res.status(500).json({ error: 'Erreur lors de la mise à jour' });
      }
    }
  },

  // Supprimer une liste
  async supprimerListe(req, res) {
    try {      
      await Liste.supprimerListe(req.params.id, req.user.id)
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

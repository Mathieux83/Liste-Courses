import { Liste, ListeModel } from '../models/Liste.js'
import { getIO } from '../socket.js'
import mongoose from 'mongoose';

export const listeController = {
  // Obtenir toutes les listes d'un utilisateur
  async getListes(req, res) {
    try {
      // if (!req.user || !req.user.id) {
      //   return res.status(401).json({ error: 'Utilisateur non authentifié' });
      // }
      let utilisateurId = req.user.id;
      if (typeof utilisateurId === 'string' && utilisateurId.length === 24) {
        try {
          utilisateurId = utilisateurId;
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
      console.log('=== Début getListe ===');
      console.log('ID de la liste reçu:', req.params.id);
      console.log('Utilisateur authentifié:', req.user ? 'Oui' : 'Non');
      
      if (!req.user || !req.user.id) {
        console.error('Erreur: Aucun utilisateur authentifié ou ID manquant');
        return res.status(401).json({ error: 'Non autorisé' });
      }
      
      console.log('ID utilisateur:', req.user.id);
      console.log('Type de l\'ID utilisateur:', typeof req.user.id);
      
      const liste = await Liste.obtenirParId(req.params.id, req.user.id);
      
      if (!liste) {
        console.error('Erreur: Liste non trouvée pour ces paramètres');
        return res.status(404).json({ error: 'Liste non trouvée' });
      }
      
      console.log('Liste trouvée:', {
        id: liste._id,
        nom: liste.nom,
        nbArticles: liste.articles ? liste.articles.length : 0,
        utilisateurId: liste.utilisateurId
      });
      
      res.json(liste);
      console.log('=== Fin getListe avec succès ===');
    } catch (error) {
      console.error('Erreur lors de la récupération de la liste:', error);
      res.status(500).json({ error: 'Erreur interne du serveur', details: error.message });
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
      console.log('[DEBUG] Requête de création de liste reçue:', JSON.stringify(req.body, null, 2));
      
      // Validation des données d'entrée
      if (!req.body.nom || typeof req.body.nom !== 'string') {
        return res.status(400).json({ error: 'Le nom de la liste est requis et doit être une chaîne de caractères' });
      }
      
      // S'assurer que les articles sont bien un tableau
      const articles = Array.isArray(req.body.articles) ? req.body.articles : [];
      
      // Valider chaque article
      const validatedArticles = [];
      for (const article of articles) {
        if (!article.nom || typeof article.nom !== 'string') {
          console.warn('[WARN] Article invalide ignoré (nom manquant ou invalide):', article);
          continue;
        }
        
        validatedArticles.push({
          nom: article.nom,
          quantite: typeof article.quantite === 'number' ? article.quantite : 1,
          categorie: article.categorie || 'Autre',
          unite: article.unite,
          checked: Boolean(article.checked),
          montant: typeof article.montant === 'number' ? article.montant : 0
        });
      }
      
      // Récupérer l'ID utilisateur
      const utilisateurId = req.user?.id;
      if (!utilisateurId) {
        console.error('[ERROR] Aucun ID utilisateur trouvé dans la requête');
        return res.status(401).json({ error: 'Utilisateur non authentifié' });
      }
      
      console.log(`[DEBUG] Création d'une nouvelle liste pour l'utilisateur ${utilisateurId}`);
      
      // Créer la liste
      const liste = await Liste.creerListe(
        req.body.nom, 
        validatedArticles, 
        utilisateurId
      );
      
      console.log('[DEBUG] Liste créée avec succès:', JSON.stringify(liste, null, 2));
      
      // Émettre un événement pour informer les clients connectés
      try {
        const io = getIO();
        if (io) {
          io.to(`user-${utilisateurId}`).emit('liste:created', liste);
          console.log(`[DEBUG] Événement 'liste:created' émis pour l'utilisateur ${utilisateurId}`);
        }
      } catch (socketError) {
        console.error('[ERROR] Erreur lors de l\'émission de l\'événement Socket.IO:', socketError);
        // On continue malgré l'erreur Socket.IO
      }
      
      // Répondre avec succès
      res.status(201).json({
        success: true,
        ...liste
      });
      
    } catch (error) {
      console.error('[ERROR] Erreur lors de la création de la liste:', error);
      res.status(500).json({ 
        error: 'Erreur lors de la création de la liste',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Mettre à jour une liste
  async mettreAJourListe(req, res) {
    try {
      const { nom } = req.body;
      if (!nom) return res.status(400).json({ error: 'Le nom est requis' });
      // Mettre à jour uniquement le titre (nom)
      const liste = await ListeModel.findOneAndUpdate(
        { _id: req.params.id, utilisateurId: req.user.id },
        { nom },
        { new: true }
      );
      if (!liste) return res.status(404).json({ error: 'Liste non trouvée ou non autorisée' });
      // Émettre un événement pour informer les clients connectés du changement de titre
      const username = req.user?.name || 'Utilisateur inconnu';
      const updatedListe = { ...liste.toObject?.() || liste, lastModifiedBy: username, dateModification: liste.dateModification || new Date() };
      getIO().to(`liste-${req.params.id}`).emit('liste:updated', updatedListe);
      res.json(liste);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du titre de la liste:', error);
      console.error('Body reçu:', req.body);
      if (error.message === 'Liste non trouvée ou non autorisée') {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Erreur lors de la mise à jour', details: error.message });
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
      
      const liste = await Liste.obtenirParId(id, req.user.id)
      if (!liste) {
        return res.status(404).json({ error: 'Liste non trouvée' })
      }

      const token = await Liste.creerTokenPartage(id)
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

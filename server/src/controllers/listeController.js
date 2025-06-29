import { listeService } from '../services/listeService.js';
import { getIO } from '../socket.js';
import mongoose from 'mongoose';
import logger from '../services/logger.js';
import { ListeModel } from '../models/Liste.js';

export const listeController = {
  // Obtenir toutes les listes d'un utilisateur
  async getListes(req, res) {
    try {
      const listes = await listeService.getListesUtilisateur(req.user.id);
      res.json(listes);
    } catch (error) {
      console.error('Erreur lors de la récupération des listes:', error);
      res.status(500).json({ error: 'Erreur interne du serveur' });
    }
  },

  // Obtenir la liste principale
  async obtenirPrincipale(req, res) {
    try {
      const liste = await listeService.obtenirPrincipale(req.user.id);
      if (liste) {
        res.json(liste);
      } else {
        res.status(404).json({ error: 'Aucune liste principale trouvée' });
      }
    } catch (error) {
      console.error('Erreur lors de la récupération de la liste principale:', error);
      res.status(500).json({ error: 'Erreur interne du serveur' });
    }
  },

  // Obtenir une liste spécifique
  async getListe(req, res) {
    try {
      const liste = await listeService.obtenirParId(req.params.id, req.user.id);
      if (!liste) {
        return res.status(404).json({ error: 'Liste non trouvée' });
      }
      res.json(liste);
    } catch (error) {
      console.error('Erreur lors de la récupération de la liste:', error);
      res.status(500).json({ error: 'Erreur interne du serveur', details: error.message });
    }
  },

  // Créer une nouvelle liste
  async creerListe(req, res) {
    try {
      const { nom, articles } = req.body;
      const utilisateurId = req.user?.id;
      if (!utilisateurId) {
        return res.status(401).json({ error: 'Utilisateur non authentifié' });
      }
      const liste = await listeService.creerListe(nom, articles, utilisateurId);
      getIO().to(`user-${utilisateurId}`).emit('liste:created', liste);
      res.status(201).json(liste);
    } catch (error) {
      console.error('Erreur lors de la création de la liste:', error);
      res.status(500).json({ error: 'Erreur lors de la création de la liste' });
    }
  },

  // Mettre à jour une liste
  async mettreAJourListe(req, res) {
    try {
      const { nom } = req.body;
      if (!nom) return res.status(400).json({ error: 'Le nom est requis' });
      const liste = await listeService.mettreAJourListe(req.params.id, nom, undefined, req.user.id);
      getIO().to(`liste-${req.params.id}`).emit('liste:updated', liste);
      res.json(liste);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du titre de la liste:', error);
      res.status(500).json({ error: 'Erreur lors de la mise à jour', details: error.message });
    }
  },

  // Supprimer une liste
  async supprimerListe(req, res) {
    try {
      await listeService.supprimerListe(req.params.id, req.user.id);
      getIO().to(`user-${req.user.id}`).emit('liste:deleted', { id: req.params.id });
      res.status(204).end();
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  },

  // Générer un token de partage
  async genererTokenPartage(req, res) {
    try {
      const { id } = req.params;
      const liste = await listeService.obtenirParId(id, req.user.id);
      if (!liste) {
        return res.status(404).json({ error: 'Liste non trouvée' });
      }
      const token = await listeService.creerTokenPartage(id);
      res.json({ token });
    } catch (error) {
      console.error('Erreur lors de la génération du token:', error);
      res.status(500).json({ error: 'Erreur lors de la génération du token' });
    }
  },

  // Obtenir une liste partagée
  async obtenirPartagee(req, res) {
    try {
      const { token } = req.params;
      const liste = await listeService.obtenirParToken(token);
      if (liste) {
        res.json(liste);
      } else {
        res.status(404).json({ error: 'Liste non trouvée ou token expiré' });
      }
    } catch (error) {
      errorLogger.error('Erreur lors de la récupération de la liste partagée:', error);
      res.status(500).json({ error: 'Erreur interne du serveur' });
    }
  },

  async ajouterArticle(req, res) {
    try {
      const { id } = req.params;
      const { nom, categorie, montant, checked } = req.body;
      const liste = await ListeModel.findById(id);
      if (!liste) return res.status(404).json({ error: 'Liste non trouvée' });

      const nouvelArticle = { nom, categorie, montant, quantite: 1, checked: !!checked };
      liste.articles.push(nouvelArticle);
      await liste.save();

      const listeMiseAJour = await ListeModel.findById(id).lean();
      getIO().to(`liste-${id}`).emit('liste-updated', listeMiseAJour);
      res.json(listeMiseAJour);
    } catch (error) {
      res.status(500).json({ error: "Erreur lors de l'ajout d'article" });
    }
  },

  async mettreAJourArticle(req, res) {
    try {
      const { listeId, itemId } = req.params;
      const updates = req.body;
      const liste = await ListeModel.findById(listeId);
      if (!liste) return res.status(404).json({ error: 'Liste non trouvée' });

      const article = liste.articles.id(itemId);
      if (!article) return res.status(404).json({ error: 'Article non trouvé' });

      Object.assign(article, updates);
      await liste.save();

      const listeMiseAJour = await ListeModel.findById(listeId).lean();
      getIO().to(`liste-${listeId}`).emit('liste-updated', listeMiseAJour);
      res.json(listeMiseAJour);
    } catch (error) {
      res.status(500).json({ error: "Erreur lors de la mise à jour de l'article" });
    }
  },

  async supprimerArticle(req, res) {
    try {
      const { listeId, itemId } = req.params;
      const liste = await ListeModel.findById(listeId);
      if (!liste) return res.status(404).json({ error: 'Liste non trouvée' });

      if (liste.utilisateurId.toString() !== req.user.id) {
        return res.status(403).json({ error: 'Non autorisé' });
      }

      liste.articles.pull({ _id: itemId });
      await liste.save();

      const listeMiseAJour = await ListeModel.findById(listeId).lean();
      getIO().to(`liste-${listeId}`).emit('liste-updated', listeMiseAJour);
      res.json(listeMiseAJour);
    } catch (error) {
      res.status(500).json({ error: "Erreur lors de la suppression de l'article" });
    }
  },

  async supprimerTousLesArticles(req, res) {
    try {
      const { listeId } = req.params;
      const liste = await ListeModel.findById(listeId);
      if (!liste) return res.status(404).json({ error: 'Liste non trouvée' });

      if (liste.utilisateurId.toString() !== req.user.id) {
        return res.status(403).json({ error: 'Non autorisé' });
      }

      liste.articles = [];
      await liste.save();

      const listeMiseAJour = await ListeModel.findById(listeId).lean();
      getIO().to(`liste-${listeId}`).emit('liste-updated', listeMiseAJour);
      res.json(listeMiseAJour);
    } catch (error) {
      res.status(500).json({ error: "Erreur lors de la suppression des articles" });
    }
  },

  async mettreAJourArticlePartage(req, res) {
    try {
        const { articleId } = req.params;
        const { checked, username } = req.body;
        const liste = req.listePartagee;
        if (!liste) {
            return res.status(404).json({ error: 'Liste non trouvée' });
        }
        const article = liste.articles.id(articleId);
        if (!article) {
            return res.status(404).json({ error: 'Article non trouvé' });
        }
        article.checked = !!checked;
        await liste.save();

        const listeMiseAJour = await ListeModel.findById(liste._id).lean();
        getIO().to(`liste-${liste._id}`).emit('liste-updated', listeMiseAJour);
        res.json({ success: true, checked: article.checked });
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la mise à jour' });
    }
  }
};


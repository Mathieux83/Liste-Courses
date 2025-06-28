import express from 'express'
import { listeController } from '../controllers/listeController.js'
import auth from '../middleware/auth.js'
import { createOrUpdateListeValidation, idParamValidation } from '../middleware/listeValidation.js'
import { validationResult } from 'express-validator'
import { Liste, ListeModel } from '../models/Liste.js'
import verifTokenPartage from '../middleware/verifTokenPartage.js'

const router = express.Router()

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }
  next();
}

// Route publique : obtenir une liste partagée avec vérification du token de partage
router.get('/partage/:token', verifTokenPartage, (req, res) => {
  // On renvoie la liste partagée trouvée par le middleware
  const liste = req.listePartagee;
  if (!liste) {
    return res.status(404).json({ error: 'Liste non trouvée' });
  }
  res.json({
    id: liste.id,
    nom: liste.nom,
    articles: liste.articles,
    categotie: liste.categotie,
    dateCreation: liste.dateCreation,
    dateModification: liste.dateModification,
    readonly: true
  });
});

// Route publique : mettre à jour un article dans une liste partagée avec vérification du token de partage
router.patch('/partage/:token/articles/:articleId', verifTokenPartage, async (req, res) => {
  try {
    const { articleId } = req.params;
    const { checked, username } = req.body;
    const liste = req.listePartagee;
    if (!liste) {
      return res.status(404).json({ error: 'Liste non trouvée' });
    }
    // Mettre à jour l'article
    let modifiedArticle = null;
    const articles = liste.articles.map(article => {
      if (article.id === parseInt(articleId)) {
        modifiedArticle = { ...article, checked: Boolean(checked) };
        return modifiedArticle;
      }
      return article;
    });
    // Persistance réelle
    console.log('[PATCH partage] Sauvegarde en base...');
    await Liste.mettreAJourArticlesParId(liste.id, articles);
    console.log('[PATCH partage] Sauvegarde terminée.');

    // LOG DEBUG
    console.log(`[PATCH partage] Liste ${liste.id}, Article ${articleId}, checked=${checked}, guest=${username}`);

    // Émission Socket.IO pour synchro temps réel à la room de la liste
    const { getIO } = await import('../socket.js');
    getIO().to(`liste-${liste.id}`).emit('liste-updated', {
      ...liste,
      articles
    });

    // Notification au propriétaire (optionnel)
    const ownerId = liste.utilisateurId ? liste.utilisateurId.toString() : null;
    if (ownerId) {
      getIO().to(`user-${ownerId}`).emit('liste:item-toggled', {
        guestName: username || 'Invité',
        action: Boolean(checked) ? 'coché' : 'décoché',
        articleName: modifiedArticle ? modifiedArticle.nom : 'un article',
        listeId: liste.id,
        date: new Date().toISOString(),
      });
    }
    res.json({ success: true, checked: Boolean(checked) });
  } catch (error) {
    console.error('[PATCH partage] Erreur lors de la mise à jour:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour' });
  }
});

// Routes protégées par authentification (Middleware)
router.use(auth)

// Obtenir toutes les listes de l'utilisateur
// router.get('/dashboard', listeController.getListes)
router.get('/', listeController.getListes)

// Obtenir la liste principale (doit être AVANT la route dynamique)
router.get('/principale', listeController.obtenirPrincipale)

// Créer une nouvelle liste
router.post('/', createOrUpdateListeValidation, handleValidation, listeController.creerListe)

// Obtenir une liste spécifique
router.get('/:id', listeController.getListe)

// Mettre à jour une liste
router.put('/:id', listeController.mettreAJourListe)

// Ajouter un article à une liste existante
router.post('/:id/items', async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, categorie, montant, checked } = req.body;
    const liste = await ListeModel.findById(id);
    if (!liste) return res.status(404).json({ error: 'Liste non trouvée' });

    // Créer un nouvel article avec les données fournies
    const nouvelArticle = { 
      nom, 
      categorie, 
      montant,
      quantite: 1, // Valeur par défaut
      checked: !!checked 
    };

    // Ajouter l'article à la liste
    liste.articles.push(nouvelArticle);
    await liste.save();

    // Récupérer la liste mise à jour avec les IDs frais
    const listeMiseAJour = await ListeModel.findById(id).lean();
    
    // Normaliser les articles
    const articlesNorm = listeMiseAJour.articles.map(article => ({
      ...article,
      _id: article._id.toString(),
      id: article._id.toString()
    }));

    // Préparer les données pour l'émission
    const listePourEmission = {
      ...listeMiseAJour,
      _id: listeMiseAJour._id.toString(),
      id: listeMiseAJour._id.toString(),
      articles: articlesNorm
    };

    // Émettre la mise à jour via Socket.IO
    const { getIO } = await import('../socket.js');
    getIO().to(`liste-${id}`).emit('liste-updated', listePourEmission);

    // Répondre avec les données normalisées
    res.json({
      _id: listeMiseAJour._id.toString(),
      id: listeMiseAJour._id.toString(),
      nom: listeMiseAJour.nom,
      articles: articlesNorm,
      utilisateurId: listeMiseAJour.utilisateurId,
      dateModification: listeMiseAJour.dateModification
    });
  } catch (error) {
    console.error("Erreur lors de l'ajout d'article:", error);
    res.status(500).json({ 
      error: "Erreur lors de l'ajout d'article",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Mettre à jour un article dans une liste
router.patch('/:listeId/items/:itemId', async (req, res) => {
  try {
    const { listeId, itemId } = req.params;
    const updates = req.body;
    
    // Trouver la liste
    const liste = await ListeModel.findById(listeId);
    if (!liste) {
      return res.status(404).json({ error: 'Liste non trouvée' });
    }

    // Trouver l'index de l'article
    const articleIndex = liste.articles.findIndex(
      article => article._id.toString() === itemId
    );

    if (articleIndex === -1) {
      return res.status(404).json({ error: 'Article non trouvé dans la liste' });
    }

    // Mettre à jour l'article
    liste.articles[articleIndex] = {
      ...liste.articles[articleIndex].toObject(),
      ...updates,
      _id: liste.articles[articleIndex]._id // Garder le même _id
    };

    // Sauvegarder les modifications
    await liste.save();

    // Récupérer la liste mise à jour avec les IDs frais
    const listeMiseAJour = await ListeModel.findById(listeId).lean();
    
    // Normaliser les articles
    const articlesNorm = listeMiseAJour.articles.map(article => ({
      ...article,
      _id: article._id.toString(),
      id: article._id.toString()
    }));

    // Préparer les données pour l'émission
    const listePourEmission = {
      ...listeMiseAJour,
      _id: listeMiseAJour._id.toString(),
      id: listeMiseAJour._id.toString(),
      articles: articlesNorm
    };

    // Émettre la mise à jour via Socket.IO
    const { getIO } = await import('../socket.js');
    getIO().to(`liste-${listeId}`).emit('liste-updated', listePourEmission);

    // Répondre avec les données normalisées
    res.json({
      _id: listeMiseAJour._id.toString(),
      id: listeMiseAJour._id.toString(),
      nom: listeMiseAJour.nom,
      articles: articlesNorm,
      utilisateurId: listeMiseAJour.utilisateurId,
      dateModification: listeMiseAJour.dateModification
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'article:", error);
    res.status(500).json({ 
      error: "Erreur lors de la mise à jour de l'article",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Supprimer un article d'une liste
router.delete('/:listeId/items/:itemId', auth, async (req, res) => {
  try {
    const { listeId, itemId } = req.params;
    
    // Trouver la liste
    const liste = await ListeModel.findById(listeId);
    if (!liste) {
      return res.status(404).json({ error: 'Liste non trouvée' });
    }

    // Vérifier que l'utilisateur est propriétaire de la liste
    if (liste.utilisateurId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Non autorisé' });
    }

    // Trouver l'index de l'article
    const articleIndex = liste.articles.findIndex(
      article => article._id.toString() === itemId
    );

    if (articleIndex === -1) {
      return res.status(404).json({ error: 'Article non trouvé dans la liste' });
    }

    // Supprimer l'article
    liste.articles.splice(articleIndex, 1);
    
    // Mettre à jour la date de modification
    liste.dateModification = new Date();
    
    // Sauvegarder les modifications
    await liste.save();

    // Récupérer la liste mise à jour avec les IDs frais
    const listeMiseAJour = await ListeModel.findById(listeId).lean();
    
    // Normaliser les articles
    const articlesNorm = listeMiseAJour.articles.map(article => ({
      ...article,
      _id: article._id.toString(),
      id: article._id.toString()
    }));

    // Préparer les données pour l'émission
    const listePourEmission = {
      ...listeMiseAJour,
      _id: listeMiseAJour._id.toString(),
      id: listeMiseAJour._id.toString(),
      articles: articlesNorm
    };

    // Émettre la mise à jour via Socket.IO
    const { getIO } = await import('../socket.js');
    getIO().to(`liste-${listeId}`).emit('liste-updated', listePourEmission);

    // Répondre avec les données normalisées
    res.json({
      _id: listeMiseAJour._id.toString(),
      id: listeMiseAJour._id.toString(),
      nom: listeMiseAJour.nom,
      articles: articlesNorm,
      utilisateurId: listeMiseAJour.utilisateurId,
      dateModification: listeMiseAJour.dateModification,
      message: 'Article supprimé avec succès'
    });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'article:", error);
    res.status(500).json({ 
      error: "Erreur lors de la suppression de l'article",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Supprimer tous les articles d'une liste
router.delete('/:listeId/items', auth, async (req, res) => {
  console.log(`[API] Requête de suppression de tous les articles de la liste ${req.params.listeId}`);
  
  try {
    const { listeId } = req.params;
    
    console.log(`[API] Recherche de la liste ${listeId}`);
    // Trouver la liste
    const liste = await ListeModel.findById(listeId);
    if (!liste) {
      console.error(`[API] Liste non trouvée: ${listeId}`);
      return res.status(404).json({ 
        error: 'Liste non trouvée',
        details: `Aucune liste trouvée avec l'ID: ${listeId}`
      });
    }

    // Vérifier que l'utilisateur est propriétaire de la liste
    if (liste.utilisateurId.toString() !== req.user.id) {
      console.error(`[API] Tentative non autorisée d'accès à la liste ${listeId} par l'utilisateur ${req.user.id}`);
      return res.status(403).json({ 
        error: 'Non autorisé',
        details: 'Vous devez être le propriétaire de la liste pour effectuer cette action'
      });
    }

    console.log(`[API] Suppression de ${liste.articles.length} articles de la liste ${listeId}`);
    
    // Vérifier s'il y a des articles à supprimer
    const nbArticles = liste.articles.length;
    
    // Vider le tableau d'articles
    liste.articles = [];
    
    // Mettre à jour la date de modification
    liste.dateModification = new Date();
    
    // Sauvegarder les modifications
    console.log(`[API] Sauvegarde de la liste mise à jour`);
    await liste.save();

    // Récupérer la liste mise à jour avec les IDs frais
    const listeMiseAJour = await ListeModel.findById(listeId).lean();
    
    // Normaliser les articles (sera un tableau vide)
    const articlesNorm = [];

    // Préparer les données pour l'émission
    const listePourEmission = {
      ...listeMiseAJour,
      _id: listeMiseAJour._id.toString(),
      id: listeMiseAJour._id.toString(),
      articles: articlesNorm,
      message: `${nbArticles} article(s) supprimé(s) avec succès`
    };

    // Émettre la mise à jour via Socket.IO
    console.log(`[API] Émission de l'événement liste-updated pour la liste ${listeId}`);
    const { getIO } = await import('../socket.js');
    getIO().to(`liste-${listeId}`).emit('liste-updated', listePourEmission);

    // Répondre avec les données normalisées
    console.log(`[API] Réponse de la suppression des articles: ${nbArticles} article(s) supprimé(s)`);
    res.json({
      _id: listeMiseAJour._id.toString(),
      id: listeMiseAJour._id.toString(),
      nom: listeMiseAJour.nom,
      articles: articlesNorm,
      utilisateurId: listeMiseAJour.utilisateurId,
      dateModification: listeMiseAJour.dateModification,
      message: `${nbArticles} article(s) supprimé(s) avec succès`
    });
  } catch (error) {
    console.error("[API] Erreur lors de la suppression de tous les articles:", {
      message: error.message,
      stack: error.stack,
      params: req.params,
      user: req.user ? { id: req.user.id } : 'Non authentifié'
    });
    
    res.status(500).json({ 
      error: "Erreur lors de la suppression des articles",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Supprimer une liste
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Trouver la liste
    const liste = await ListeModel.findById(id);
    if (!liste) {
      return res.status(404).json({ error: 'Liste non trouvée' });
    }

    // Vérifier que l'utilisateur est propriétaire de la liste
    if (liste.utilisateurId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Non autorisé' });
    }

    // Préparer les données pour l'émission avant la suppression
    const listePourEmission = {
      _id: liste._id.toString(),
      id: liste._id.toString(),
      nom: liste.nom,
      utilisateurId: liste.utilisateurId,
      articles: []
    };

    // Supprimer la liste
    await ListeModel.findByIdAndDelete(id);

    // Émettre l'événement de suppression via Socket.IO
    const { getIO } = await import('../socket.js');
    getIO().to(`liste-${id}`).emit('liste-deleted', { 
      _id: id,
      id: id
    });

    // Répondre avec succès
    res.json({
      success: true,
      message: 'Liste supprimée avec succès',
      _id: id,
      id: id
    });
  } catch (error) {
    console.error("Erreur lors de la suppression de la liste:", error);
    res.status(500).json({ 
      error: "Erreur lors de la suppression de la liste",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Générer un token de partage (publique si besoin)
router.post('/:id/partage', listeController.genererTokenPartage)

router.post('/',
  createOrUpdateListeValidation,
  handleValidation,
  listeController.creerListe
);

router.get('/:id',
  idParamValidation,
  handleValidation,
  listeController.getListe
);

// Route publique : mettre à jour un article dans une liste partagée avec vérification du token de partage
router.patch('/partage/:token/articles/:articleId', verifTokenPartage, async (req, res) => {
  try {
    const { articleId } = req.params;
    const { checked, username } = req.body;
    const liste = req.listePartagee;
    
    if (!liste) {
      return res.status(404).json({ error: 'Liste non trouvée' });
    }

    // Mettre à jour l'article
    let modifiedArticle = null;
    const articles = liste.articles.map(article => {
      if (article._id.toString() === articleId || article.id === articleId) {
        modifiedArticle = { 
          ...article.toObject ? article.toObject() : article, 
          checked: Boolean(checked) 
        };
        return modifiedArticle;
      }
      return article;
    });

    // Sauvegarder les modifications
    liste.articles = articles;
    liste.dateModification = new Date();
    await liste.save();

    // Récupérer la liste mise à jour avec les IDs frais
    const listeMiseAJour = await ListeModel.findById(liste._id).lean();
    
    // Normaliser les articles
    const articlesNorm = listeMiseAJour.articles.map(article => ({
      ...article,
      _id: article._id.toString(),
      id: article._id.toString()
    }));

    // Préparer les données pour l'émission
    const listePourEmission = {
      ...listeMiseAJour,
      _id: listeMiseAJour._id.toString(),
      id: listeMiseAJour._id.toString(),
      articles: articlesNorm
    };

    // Émettre la mise à jour via Socket.IO
    const { getIO } = await import('../socket.js');
    getIO().to(`liste-${liste._id}`).emit('liste-updated', listePourEmission);

    // Notification au propriétaire (optionnel)
    const ownerId = liste.utilisateurId ? liste.utilisateurId.toString() : null;
    if (ownerId) {
      getIO().to(`user-${ownerId}`).emit('liste:item-toggled', {
        guestName: username || 'Invité',
        action: Boolean(checked) ? 'coché' : 'décoché',
        articleName: modifiedArticle ? modifiedArticle.nom : 'un article',
        listeId: liste._id.toString(),
        date: new Date().toISOString(),
      });
    }

    // Répondre avec succès
    res.json({ 
      success: true, 
      checked: Boolean(checked),
      _id: listeMiseAJour._id.toString(),
      id: listeMiseAJour._id.toString()
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'article partagé:', error);
    res.status(500).json({ 
      error: "Erreur lors de la mise à jour de l'article partagé",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});



// Obtenir les statistiques d'une liste
router.get('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params
    const liste = await Liste.obtenirParId(parseInt(id))
    
    if (!liste) {
      return res.status(404).json({ error: 'Liste non trouvée' })
    }

    const stats = {
      totalArticles: liste.articles.length,
      articlesCoches: liste.articles.filter(a => a.checked).length,
      montantTotal: liste.articles.reduce((sum, a) => sum + a.montant, 0),
      montantCoche: liste.articles.filter(a => a.checked).reduce((sum, a) => sum + a.montant, 0),
      dateCreation: liste.dateCreation,
      dateModification: liste.dateModification
    }

    res.json(stats)
  } catch (error) {
    console.error('Erreur lors du calcul des statistiques:', error)
    res.status(500).json({ error: 'Erreur lors du calcul des statistiques' })
  }
})

export default router

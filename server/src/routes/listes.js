import express from 'express';
import { listeController } from '../controllers/listeController.js';
import auth from '../middleware/auth.js';
import { createOrUpdateListeValidation, idParamValidation } from '../middleware/listeValidation.js';
import { validationResult } from 'express-validator';
import verifTokenPartage from '../middleware/verifTokenPartage.js';

const router = express.Router();

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// --- Routes Publiques ---
router.get('/partage/:token', verifTokenPartage, listeController.obtenirPartagee);
router.patch('/partage/:token/articles/:articleId', verifTokenPartage, listeController.mettreAJourArticlePartage);

// --- Routes Protégées ---
router.use(auth);

// Listes
router.get('/', listeController.getListes);
router.post('/', createOrUpdateListeValidation, handleValidation, listeController.creerListe);
router.get('/principale', listeController.obtenirPrincipale);
router.get('/:id', idParamValidation, handleValidation, listeController.getListe);
router.put('/:id', idParamValidation, handleValidation, listeController.mettreAJourListe);
router.delete('/:id', idParamValidation, handleValidation, listeController.supprimerListe);

// Articles
router.post('/:id/items', idParamValidation, handleValidation, listeController.ajouterArticle);
router.patch('/:listeId/items/:itemId', listeController.mettreAJourArticle);
router.delete('/:listeId/items/:itemId', listeController.supprimerArticle);
router.delete('/:listeId/items', listeController.supprimerTousLesArticles);

// Partage
router.post('/:id/partage', idParamValidation, handleValidation, listeController.genererTokenPartage);

export default router;

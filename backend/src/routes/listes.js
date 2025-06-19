import express from 'express'
import { listeController } from '../controllers/listeController.js'
import auth from '../middleware/auth.js'
import { createOrUpdateListeValidation, idParamValidation } from '../middleware/listeValidation.js'
import { validationResult } from 'express-validator'

const router = express.Router()

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json[{ errors: errors.array() }]
  }
  next();
}

// Routes protégées par authentification
router.use(auth)

// Obtenir toutes les listes de l'utilisateur
router.get('/', listeController.getListes)

// Obtenir la liste principale
router.get('/principale', listeController.obtenirPrincipale)

// Créer une nouvelle liste
router.post('/', listeController.creerListe)

// Obtenir une liste spécifique
router.get('/:id', listeController.getListe)

// Mettre à jour une liste
router.put('/:id', listeController.mettreAJourListe)

// Supprimer une liste
router.delete('/:id', listeController.supprimerListe)

// Générer un token de partage
router.post('/:id/partage', listeController.genererTokenPartage)

// Obtenir une liste partagée (pas besoin d'authentification)
router.get('/partage/:token', listeController.obtenirPartagee)

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

// Mettre à jour un article dans une liste partagée
router.patch('/partage/:token/articles/:articleId', async (req, res) => {
  try {
    const { token, articleId } = req.params
    const { checked } = req.body
    
    // Obtenir la liste
    const liste = await Liste.obtenirParToken(token)
    if (!liste) {
      return res.status(404).json({ error: 'Liste non trouvée' })
    }

    // Mettre à jour l'article
    const articles = liste.articles.map(article => 
      article.id === parseInt(articleId) 
        ? { ...article, checked: Boolean(checked) }
        : article
    )

    // Sauvegarder les modifications
    await Liste.sauvegarderPrincipale(liste.nom, articles)
    
    res.json({ success: true, checked: Boolean(checked) })
  } catch (error) {
    console.error('Erreur lors de la mise à jour:', error)
    res.status(500).json({ error: 'Erreur lors de la mise à jour' })
  }
})

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

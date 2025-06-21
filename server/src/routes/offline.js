// import express from 'express'
// import { listeController } from '../controllers/listeController.js'
// import auth from '../middleware/auth.js'
// import { createOrUpdateListeValidation, idParamValidation } from '../middleware/listeValidation.js'
// import { validationResult } from 'express-validator'

// const router = express.Router()

// const handleValidation = (req, res, next) => {
//   const errors = validationResult(req);
//   if (!errors.isEmpty()) {
//     return res.status(400).json[{ errors: errors.array() }]
//   }
//   next();
// }

// // Routes protégées par authentification
// router.use(auth)

// // Obtenir toutes les listes de l'utilisateur
// router.get('/', listeController.getListes)

// // Obtenir la liste principale
// router.get('/principale', listeController.obtenirPrincipale)

// // Créer une nouvelle liste
// router.post('/', listeController.creerListe)

// // Obtenir une liste spécifique
// router.get('/:id', listeController.getListe)

// export default router
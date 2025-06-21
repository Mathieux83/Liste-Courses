import express from 'express';
import { notificationsController } from '../controllers/notificationsController.js';
import auth from '../middleware/auth.js';
import { subscribeValidation, notifyValidation } from '../middleware/notificationsValidation.js';
import { validationResult } from 'express-validator';

const router = express.Router();

// Middleware pour gérer les erreurs de validation
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Routes protégées par authentification
router.use(auth);

// Enregistrer un abonnement aux notifications
router.post('/subscribe', subscribeValidation, handleValidation, notificationsController.subscribe);

// Envoyer une notification
router.post('/notify', notifyValidation, handleValidation, notificationsController.notify);

export default router;
import express from 'express';
import { notificationsController } from '../controllers/notificationsController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Routes protégées par authentification
router.use(auth);

// Enregistrer un abonnement aux notifications
router.post('/subscribe', notificationsController.subscribe);

// Envoyer une notification (route protégée par authentification admin)
router.post('/notify', notificationsController.notify);

export default router;

import express from 'express';
import { deliveryController } from '../controllers/deliveryController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Routes protégées par authentification
router.use(auth);

// Obtenir les services de livraison disponibles
router.get('/services', deliveryController.getAvailableServices);

// Créer une commande de livraison
router.post('/orders', deliveryController.createOrder);

// Obtenir le statut d'une commande
router.get('/orders/:orderId', deliveryController.getOrderStatus);

// Annuler une commande
router.delete('/orders/:orderId', deliveryController.cancelOrder);

export default router;

import express from 'express';
import { deliveryController } from '../controllers/deliveryController.js';
import auth from '../middleware/auth.js';
import { createOrderValidation, orderIdParamValidation, postalCodeQueryValidation} from '../middleware/deliveryValidation.js'

// Middleware pour gérer les erreurs de validation
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const router = express.Router();

// Routes protégées par authentification
router.use(auth);

// Obtenir les services de livraison disponibles
router.get(
  '/services',
  postalCodeQueryValidation,
  handleValidation,
  deliveryController.getAvailableServices
);

// Créer une commande de livraison
router.post(
  '/order',
  createOrderValidation,
  handleValidation,
  deliveryController.createOrder
);

// Obtenir le statut d'une commande
router.get(
  '/order/:orderId',
  orderIdParamValidation,
  handleValidation,
  deliveryController.getOrderStatus
);

// Annuler une commande
router.post(
  '/order/:orderId/cancel',
  orderIdParamValidation,
  handleValidation,
  deliveryController.cancelOrder
);

export default router;

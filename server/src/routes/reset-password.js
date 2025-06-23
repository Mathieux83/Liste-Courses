import express from 'express';
import validateForgotPassword from '../middleware/forgotPasswordValidation.js';
import * as forgotPasswordController from '../controllers/forgotPasswordController.js';

const router = express.Router();
// Route pour demander la réinitialisation du mot de passe
router.post('/forgot-password', validateForgotPassword, forgotPasswordController.forgotPassword);
// Route pour réinitialiser le mot de passe
router.post('/reset-password', forgotPasswordController.resetPassword);

export default router;

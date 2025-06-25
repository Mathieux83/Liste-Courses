import express from 'express';
import { body } from 'express-validator';
import { register, login, getMe, verifyResetToken, resetPassword, forgotPassword } from '../controllers/authController.js';
import auth from '../middleware/auth.js';
import { logout } from '../controllers/authController.js';

const router = express.Router();

// Validation middleware
const registerValidation = [
  body('email').isEmail().withMessage('Email invalide'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Le mot de passe doit contenir au moins 6 caractères'),
  body('name').not().isEmpty().withMessage('Le nom est requis')
];

const loginValidation = [
  body('email').isEmail().withMessage('Email invalide'),
  body('password').not().isEmpty().withMessage('Mot de passe requis')
];

// Routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.get('/me', auth, getMe);
router.get('/logout', logout);
router.post('/logout', logout);

// Routes de réinitialisation de mot de passe
router.post('/forgot-password', forgotPassword);
router.get('/verify-reset-token/:token', verifyResetToken);
router.post('/reset-password', resetPassword);

export default router;

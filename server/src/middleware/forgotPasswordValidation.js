import { body, validationResult } from 'express-validator';

// Middleware de validation pour la route forgot-password
const validateForgotPassword = [
  body('email')
    .isEmail()
    .withMessage('Un email valide est requis.'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

export default validateForgotPassword;

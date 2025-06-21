import { body } from 'express-validator';

export const subscribeValidation = [
  body('subscription').notEmpty().withMessage('Abonnement requis')
];

export const notifyValidation = [
  body('userId').notEmpty().withMessage('userId requis'),
  body('notification').isObject().withMessage('Notification requise')
];


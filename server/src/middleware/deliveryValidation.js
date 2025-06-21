import { body, param, query } from 'express-validator';

const createOrderValidation = [
  body('listeId').notEmpty().withMessage('listeId requis'),
  body('serviceId').notEmpty().withMessage('serviceId requis'),
  body('store').notEmpty().withMessage('store requis')
];

const orderIdParamValidation = [
  param('orderId').isString().withMessage('orderId requis')
];

const postalCodeQueryValidation = [
  query('postalCode').notEmpty().withMessage('Code postal requis')
];

export {
  createOrderValidation,
  orderIdParamValidation,
  postalCodeQueryValidation
};
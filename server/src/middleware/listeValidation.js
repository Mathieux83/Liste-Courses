import { body, param } from "express-validator";

export const createOrUpdateListeValidation = [
    body('nom').notEmpty().withMessage('Le nom est requis'),
    body('articles').optional({ checkFalsy: true }).isArray().withMessage('Les articles doivent être un tableau')
];

export const idParamValidation = [
    param('id').isMongoId().withMessage('ID de la liste invalide')
];

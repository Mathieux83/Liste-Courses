import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { authLogger } from '../services/logger.js';

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;

export default (req, res, next) => {
  if (!JWT_SECRET) {
    authLogger.error('JWT_SECRET manquant dans la configuration', {
      message: 'JWT_SECRET manquant dans la configuration'});
    return res.status(500).json({ message: 'Erreur de configuration du serveur : JWT_SECRET manquant.' });
  }
  try {
    // 1. Cherche le token dans le cookie
    // console.log('Cookies reçus:', req.cookies); // DEBUG
    // authLogger.debug('Vérification du token dans le cookie');
    const token = req.cookies?.token;
    // authLogger.debug('Token reçu dans le cookie:', token); // DEBUG
    // console.log('Token reçu dans le cookie:', token); // AJOUT DEBUG
    if (!token) {
      return res.status(401).json({ message: 'Token manquant' });
    } 
    
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      // authLogger.error('Erreur lors du décodage du token', { error: error.message });
      // console.error('Erreur lors du décodage du token:', error); // DEBUG
      if (error.name === 'TokenExpiredError') {
        authLogger.warn('Token expiré');
        return res.status(401).json({ message: 'Token expiré' });
      }
      authLogger.error('Token invalide', { error: error.message });
      return res.status(401).json({ message: 'Token invalide' });
    }

    req.user = { id: decodedToken.userId };

    next();
  } catch (error) {
    authLogger.error('Erreur de vérification du token', { error: error.message });
    // console.error('Erreur de vérification du token:', error);
    res.status(401).json({ message: 'Token invalide' });
  }
};
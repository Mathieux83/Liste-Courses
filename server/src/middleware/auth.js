import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;

export default (req, res, next) => {
  if (!JWT_SECRET) {
    return res.status(500).json({ message: 'Erreur de configuration du serveur : JWT_SECRET manquant.' });
  }
  try {
    // 1. Cherche le token dans le cookie
    // console.log('Cookies reçus:', req.cookies); // DEBUG
    const token = req.cookies?.token;
    // console.log('Token reçu dans le cookie:', token); // AJOUT DEBUG
    if (!token) {
      return res.status(401).json({ message: 'Token manquant' });
    }

    let decodedToken;
    try {
      decodedToken = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      // console.error('Erreur lors du décodage du token:', error); // AJOUT DEBUG
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expiré' });
      }
      return res.status(401).json({ message: 'Token invalide' });
    }

    req.user = { id: decodedToken.userId };

    next();
  } catch (error) {
    // // console.error('Erreur de vérification du token:', error);
    res.status(401).json({ message: 'Token invalide' });
  }
};
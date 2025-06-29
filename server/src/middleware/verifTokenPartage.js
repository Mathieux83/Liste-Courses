import tokenPartageSchema from '../models/TokenPartage.js';
import logger from '../services/logger.js';

// Middleware pour vérifier le token de partage dans l'URL
export default async function verifTokenPartage(req, res, next) {
  const { token } = req.params;
  console.log('Token reçu dans l\'URL :', token);
  if (!token) {
    return res.status(401).json({ message: 'Token de partage manquant' });
  }
  try {
    // Recherche du token de partage valide (non expiré)
    const tokenPartage = await tokenPartageSchema.findOne({
      token,
      dateExpiration: { $gt: new Date() }
    }).populate('listeId');
    

    if (!tokenPartage || !tokenPartage.listeId) {
      
      return res.status(401).json({ message: 'Token de partage invalide ou expiré' });
    }

    // On place la liste partagée dans req pour les handlers suivants
    req.listePartagee = tokenPartage.listeId;
    req.tokenPartage = tokenPartage;
    next();
  } catch (error) {
    console.error('Erreur vérification token partage:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la vérification du token de partage' });
  }
}

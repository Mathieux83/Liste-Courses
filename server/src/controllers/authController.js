import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import User from '../models/User.js';
import { validationResult } from 'express-validator';
import { TokenResetPassword } from '../models/User.js';
import { sendPasswordResetEmail } from '../services/emailService.js';

const JWT_SECRET = process.env.JWT_SECRET;

export const register= async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, name } = req.body;

    // Vérifier si l'utilisateur existe déjà
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'Cet utilisateur existe déjà' });
    }

    // Créer un nouvel utilisateur
    user = new User({
      email,
      password,
      name
    });

    await user.save();
    console.log('Utilisateur enregistrer : ',user)

    // Créer le token JWT
    const token = jwt.sign(
      { userId: user._id },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Vérifier si l'utilisateur existe
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    console.log('Tentative de connexion pour:', email);
    console.log('Utilisateur trouvé:', user ? user.email : null);

    // Vérifier le mot de passe
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    console.log('Coonection réussie pour :',user ? user.email : null)

    // Créer le token JWT
    const token = jwt.sign(
      { userId: user._id },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000
    });
    res.json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }

  
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};



export const logout = async (req, res) => {
  try {
    // Récupérer le token du cookie pour identifier l'utilisateur
    const token = req.cookies.token;
    
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.userId).select('email name');
        
        if (user) {
          console.log('Déconnexion de l\'utilisateur:', user.email);
        } else {
          console.log('Déconnexion - utilisateur non trouvé dans la base');
        }
      } catch (jwtError) {
        console.log('Déconnexion avec token invalide ou expiré');
      }
    } else {
      console.log('Tentative de déconnexion sans token');
    }
    
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    
    console.log('Cookie de session supprimé avec succès');
    res.json({ message: 'Déconnexion réussie' });
    
  } catch (error) {
    console.log('Erreur lors de la déconnexion:', error.message);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}

/**
 * Envoie un email de réinitialisation de mot de passe
 * @route POST /api/auth/forgot-password
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Vérifier si l'email est fourni
    if (!email) {
      return res.status(400).json({ message: 'L\'email est requis' });
    }

    // Vérifier si l'utilisateur existe
    const user = await User.findOne({ email });
    if (!user) {
      // Pour des raisons de sécurité, on ne révèle pas si l'email existe ou non
      return res.json({ message: 'Si votre email est enregistré, vous recevrez un lien de réinitialisation' });
    }

    // Supprimer les anciens tokens de réinitialisation pour cet email
    await TokenResetPassword.deleteMany({ email });

    // Créer un nouveau token
    const token = crypto.randomBytes(32).toString('hex');
    const tokenExpiration = new Date(Date.now() + 3600000); // 1 heure

    // Sauvegarder le token dans la base de données
    const tokenDoc = new TokenResetPassword({
      token,
      email,
      dateExpiration: tokenExpiration
    });

    await tokenDoc.save();

    // Envoyer l'email de réinitialisation
    await sendPasswordResetEmail(user.email, token, user.name);

    res.json({ message: 'Si votre email est enregistré, vous recevrez un lien de réinitialisation' });
  } catch (error) {
    console.error('Erreur lors de la demande de réinitialisation:', error);
    res.status(500).json({ message: 'Erreur lors du traitement de votre demande' });
  }
};

/**
 * Vérifie la validité d'un token de réinitialisation
 * @route GET /api/auth/verify-reset-token/:token
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
export const verifyResetToken = async (req, res) => {
  try {
    const { token } = req.params;
    
    // Vérifier le token dans la collection TokenResetPassword
    const tokenDoc = await TokenResetPassword.findOne({
      token,
      dateExpiration: { $gt: new Date() }
    });

    if (!tokenDoc) {
      return res.status(400).json({ valid: false, message: 'Token invalide ou expiré' });
    }

    res.json({ valid: true, email: tokenDoc.email });
  } catch (error) {
    console.error('Erreur vérification token:', error);
    res.status(500).json({ valid: false, message: 'Erreur serveur' });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    // Vérifier que le mot de passe est fourni
    if (!password) {
      return res.status(400).json({ message: 'Le mot de passe est requis' });
    }

    // Vérifier le token
    const tokenDoc = await TokenResetPassword.findOne({
      token,
      dateExpiration: { $gt: new Date() }
    });

    if (!tokenDoc) {
      return res.status(400).json({ message: 'Token invalide ou expiré' });
    }

    // Trouver l'utilisateur
    const user = await User.findOne({ email: tokenDoc.email });
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Modifier directement le mot de passe (sans le hacher)
    user.password = password;
    // Marquer explicitement le champ password comme modifié
    user.markModified('password');
    // Sauvegarder l'utilisateur (ce qui va déclencher le hook pre('save'))
    await user.save();

    // Supprimer le token utilisé
    await TokenResetPassword.deleteOne({ token });

    // Répondre avec succès
    res.json({ message: 'Mot de passe réinitialisé avec succès' });
  } catch (error) {
    console.error('Erreur réinitialisation mot de passe:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la réinitialisation du mot de passe' });
  }
};

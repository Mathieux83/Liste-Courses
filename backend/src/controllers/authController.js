import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { validationResult } from 'express-validator';

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

// export const logout = (res) => {
//   res.clearCookie('token', {
//     httpOnly: true,
//     secure: process.env.NODE_ENV === 'production',
//     sameSite: 'strict'
//   });
//   res.json({ message: 'Déconnexion réussie' });
// };


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

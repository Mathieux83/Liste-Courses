import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Créer un token pour le mot de passe oublié pour lien de reinitialisation par email
import crypto from 'crypto';
import { time, timeStamp } from 'console';
const tokenResetPassword = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  dateExpiration: {
    type: Date,
    default: () => new Date(Date.now() + 3600000) // 1 heure par défaut
  }
});

export const TokenResetPassword = mongoose.model('TokenResetPassword', tokenResetPassword);



async function createTokenReset(email) {
  try {
    const token = Buffer.from(JSON.stringify({
      email,
      timeStamp: Date.now(),
      random: Math.random()
    })).toString('base64url');

    const tokenReset = new tokenResetPasswordModel({
      token,
      email: email
    });

    await tokenReset.save();
    return token;
  } catch (error) {
    console.error('Erreur lors de la création du token de réinitialisation:', error);
    throw error;
  }
}

// Acces a la page de réinitialisation du mot de passe
async function ResetPasswordParToken(token) {
  try {
    const tokenReset = await tokenResetPasswordModel.findOne({
      token,
      dateExpiration: { $gt: new Date() } // Vérifie que le token n'est pas expiré
    });

    if (!tokenReset || !tokenReset.email) {
      throw new Error('Token de réinitialisation invalide ou expiré');
    }
  } catch (error) {
    console.error('Erreur lors de l\'accès au token de réinitialisation:', error);
    throw error;
  }
}

// Hash le mot de passe avant de sauvegarder
userSchema.pre('save', async function(next) {
  // console.log('Début du hook pre-save');
  // console.log('Mot de passe modifié ?', this.isModified('password'));
  
  if (!this.isModified('password')) {
    // console.log('Le mot de passe n\'a pas été modifié, on passe au suivant');
    return next();
  }
  
  try {
    // console.log('Avant hachage - Mot de passe:', this.password);
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    // console.log('Après hachage - Mot de passe:', this.password);
    next();
  } catch (error) {
    // console.error('Erreur lors du hachage du mot de passe:', error);
    next(error);
  }
});

// Méthode pour comparer les mots de passe
userSchema.methods.comparePassword = async function(candidatePassword) {
  // console.log('Mot de passe reçu:', candidatePassword);
  // console.log('Hash stocké:', this.password);
  const result = await bcrypt.compare(candidatePassword, this.password);
  // console.log('Résultat comparaison:', result);
  return result;
};

const User = mongoose.model('User', userSchema);

export default User;

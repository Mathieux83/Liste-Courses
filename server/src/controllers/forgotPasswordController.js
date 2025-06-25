import crypto from 'crypto';
import nodemailer from 'nodemailer';
import User, { TokenResetPassword } from '../models/User.js';

const { FRONTEND_URL } = process.env;

// Fonction d'envoi d'email générique
async function sendResetEmail(email, token) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  const resetUrl = `${FRONTEND_URL}/reset-password?token=${token}`;
  await transporter.sendMail({
    from: `"Liste Courses" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Réinitialisation de votre mot de passe',
    html: `<p>Pour réinitialiser votre mot de passe, cliquez ici : <a href="${resetUrl}">${resetUrl}</a></p>`
  });
}

// Handler principal
export async function forgotPassword(req, res) {
  const { email } = req.body;
  const user = await User.findOne({ email });
  
  // Répondre de la même manière même si l'email n'existe pas pour des raisons de sécurité
  if (!user) {
    return res.status(200).json({ message: 'Si cet email existe, un lien a été envoyé.' });
  }

  try {
    // Supprimer les anciens tokens de réinitialisation pour cet email
    await TokenResetPassword.deleteMany({ email });
    
    // Créer un nouveau token
    const token = crypto.randomBytes(32).toString('hex');
    
    // Sauvegarder le token dans la base de données
    await TokenResetPassword.create({
      token,
      email,
      dateExpiration: new Date(Date.now() + 3600000) // 1h d'expiration
    });
    
    // Envoyer l'email
    await sendResetEmail(email, token);
    
    res.status(200).json({ message: 'Si cet email existe, un lien a été envoyé.' });
  } catch (error) {
    console.error('Erreur lors de la demande de réinitialisation:', error);
    res.status(500).json({ message: 'Une erreur est survenue lors de la demande de réinitialisation.' });
  }
}

// Handler pour réinitialiser le mot de passe
export async function resetPassword(req, res) {
  const { token, password } = req.body;
  
  try {
    // Trouver le token valide
    const tokenDoc = await TokenResetPassword.findOne({
      token,
      dateExpiration: { $gt: new Date() }
    });
    
    if (!tokenDoc) {
      return res.status(400).json({ message: 'Lien invalide ou expiré.' });
    }
    
    // Trouver l'utilisateur
    const user = await User.findOne({ email: tokenDoc.email });
    if (!user) {
      return res.status(400).json({ message: 'Utilisateur non trouvé.' });
    }
    
    // Mettre à jour le mot de passe
    user.password = password; // Le hash est géré par le middleware pre-save de Mongoose
    await user.save();
    
    // Supprimer le token utilisé
    await TokenResetPassword.deleteOne({ _id: tokenDoc._id });
    
    res.status(200).json({ message: 'Mot de passe réinitialisé avec succès.' });
  } catch (error) {
    console.error('Erreur lors de la réinitialisation du mot de passe:', error);
    res.status(500).json({ message: 'Une erreur est survenue lors de la réinitialisation du mot de passe.' });
  }
}

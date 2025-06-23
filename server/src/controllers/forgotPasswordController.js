import crypto from 'crypto';
import nodemailer from 'nodemailer';
import User from '../models/User.js';

const { FRONTEND_URL } = process.env;

// Générer un token sécurisé
function generateResetToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Fonction d'envoi d'email générique
async function sendResetEmail(email, token) {
  // À configurer selon votre SMTP (ici exemple générique)
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
  if (!user) return res.status(200).json({ message: 'Si cet email existe, un lien a été envoyé.' });

  const token = generateResetToken();
  user.resetPasswordToken = token;
  user.resetPasswordExpires = Date.now() + 3600000; // 1h
  await user.save();
  await sendResetEmail(email, token);
  res.status(200).json({ message: 'Si cet email existe, un lien a été envoyé.' });
}

// Handler pour réinitialiser le mot de passe
export async function resetPassword(req, res) {
  const { token, password } = req.body;
  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() }
  });
  if (!user) return res.status(400).json({ message: 'Lien invalide ou expiré.' });
  user.password = password; // Assurez-vous que le hash est fait dans le modèle User
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();
  res.status(200).json({ message: 'Mot de passe réinitialisé.' });
}

import nodemailer from 'nodemailer';
import { apiLogger } from './logger.js';

// Configuration du transporteur SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  debug: true
});

// Vérification de la configuration au démarrage
// console.log('Configuration SMTP chargée :', {
//     host: process.env.SMTP_HOST,
//     port: parseInt(process.env.SMTP_PORT || '587', 10),
//     secure: process.env.SMTP_SECURE,
//     user: process.env.SMTP_USER ? 'défini' : 'non défini',
//     hasPassword: !!process.env.SMTP_PASS
//   });
/**
 * Envoie un email de réinitialisation de mot de passe
 * @param {string} to - Adresse email du destinataire
 * @param {string} token - Token de réinitialisation
 * @param {string} name - Nom de l'utilisateur
 * @returns {Promise<Object>} - Résultat de l'envoi de l'email
 */
export const sendPasswordResetEmail = async (to, token, name = 'Utilisateur') => {
  try {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    
    const mailOptions = {
      from: `"Liste de Courses" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
      to,
      subject: 'Réinitialisation de votre mot de passe',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Réinitialisation de votre mot de passe</h2>
          <p>Bonjour ${name},</p>
          <p>Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous pour procéder :</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
              Réinitialiser mon mot de passe
            </a>
          </p>
          <p>Si le bouton ne fonctionne pas, copiez et collez le lien suivant dans votre navigateur :</p>
          <p><a href="${resetUrl}">${resetUrl}</a></p>
          <p>Ce lien expirera dans 1 heure.</p>
          <p>Si vous n'avez pas demandé de réinitialisation, vous pouvez ignorer cet email en toute sécurité.</p>
          <p>Cordialement,<br>L'équipe Liste de Courses</p>
        </div>
      `,
      text: `Bonjour ${name},\n\nVous avez demandé à réinitialiser votre mot de passe. Utilisez le lien suivant pour procéder :\n\n${resetUrl}\n\nCe lien expirera dans 1 heure.\n\nSi vous n'avez pas demandé de réinitialisation, vous pouvez ignorer cet email.\n\nCordialement,\nL'équipe Liste de Courses`
    };

    const info = await transporter.sendMail(mailOptions);
    
    return { success: true, messageId: info.messageId };
    apiLogger.info('Email de réinitialisation envoyé', {
      to,
      messageId: info.messageId
    });
  } catch (error) {
    apiLogger.error('Erreur lors de l\'envoi de l\'email de réinitialisation', {
      to,
      error: error.message
    });
    throw new Error('Erreur lors de l\'envoi de l\'email de réinitialisation');
  }
};

export default {
  sendPasswordResetEmail
};

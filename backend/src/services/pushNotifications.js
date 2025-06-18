import webpush from 'web-push';
import dotenv from 'dotenv';

dotenv.config();

// Génération des clés VAPID
const vapidKeys = webpush.generateVAPIDKeys();

// Configuration de web-push
webpush.setVapidDetails(
  'mailto:votre@email.com',
  process.env.VAPID_PUBLIC_KEY || vapidKeys.publicKey,
  process.env.VAPID_PRIVATE_KEY || vapidKeys.privateKey
);

// Envoyer une notification push
export const sendPushNotification = async (subscription, data) => {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(data));
  } catch (error) {
    console.error('Erreur lors de l\'envoi de la notification:', error);
    throw error;
  }
};

// Enregistrer un abonnement aux notifications
export const saveSubscription = async (userId, subscription) => {
  try {
    // Ici, vous devrez implémenter la logique de sauvegarde en base de données
    // Pour l'exemple, nous utilisons une Map en mémoire
    subscriptions.set(userId, subscription);
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement de l\'abonnement:', error);
    throw error;
  }
};

// Map pour stocker temporairement les abonnements (à remplacer par une base de données)
export const subscriptions = new Map();

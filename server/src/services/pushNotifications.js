import webpush from 'web-push';
import dotenv from 'dotenv';
import Subscription from '../models/Subscription.js';

dotenv.config();

// Configuration de web-push
webpush.setVapidDetails(
  'mailto:votre@email.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
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
    await Subscription.findOneAndUpdate(
      { userId },
      { subscription },
      { upsert: true, new: true }
    );
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement de l\'abonnement:', error);
    throw error;
  }
};

// Activer un abbonement au notifications
export const getSubscription = async (userId) => {
  const sub = await Subscription.findOne({ userId });
  return sub ? sub.subscription : null;
};


import { saveSubscription, sendPushNotification } from '../services/pushNotifications.js';

export const notificationsController = {
  // Enregistrer un nouvel abonnement aux notifications
  async subscribe(req, res) {
    try {
      const { subscription } = req.body;
      const userId = req.user.id;

      await saveSubscription(userId, subscription);
      res.status(201).json({ message: 'Abonnement enregistré' });
    } catch (error) {
      console.error('Erreur lors de l\'abonnement:', error);
      res.status(500).json({ error: 'Erreur lors de l\'abonnement' });
    }
  },

  // Envoyer une notification à un utilisateur
  async notify(req, res) {
    try {
      const { userId, notification } = req.body;
      const subscription = await getSubscription(userId);

      if (!subscription) {
        return res.status(404).json({ error: 'Abonnement non trouvé' });
      }

      await sendPushNotification(subscription, {
        title: notification.title || 'Nouvelle notification',
        body: notification.body,
        icon: notification.icon,
        url: notification.url
      });

      res.json({ message: 'Notification envoyée' });
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la notification:', error);
      res.status(500).json({ error: 'Erreur lors de l\'envoi de la notification' });
    }
  }
};

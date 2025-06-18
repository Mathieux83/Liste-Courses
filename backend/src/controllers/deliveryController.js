import deliveryService from '../services/deliveryService.js';
import { Liste } from '../models/Liste.js';

export const deliveryController = {
  // Obtenir les services de livraison disponibles
  async getAvailableServices(req, res) {
    try {
      const { postalCode } = req.query;
      if (!postalCode) {
        return res.status(400).json({ error: 'Code postal requis' });
      }

      const services = await deliveryService.getAvailableServices(postalCode);
      res.json(services);
    } catch (error) {
      console.error('Erreur lors de la récupération des services:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération des services' });
    }
  },

  // Créer une commande de livraison
  async createOrder(req, res) {
    try {
      const { listeId, serviceId, store } = req.body;
      
      // Vérifier que la liste existe et appartient à l'utilisateur
      const liste = await Liste.obtenirParId(listeId, req.user.id);
      if (!liste) {
        return res.status(404).json({ error: 'Liste non trouvée' });
      }

      // Formater les articles pour le service de livraison
      const formattedItems = deliveryService.formatItems(liste.articles, serviceId);

      // Créer la commande
      const order = await deliveryService.createOrder(serviceId, formattedItems, store);

      // Enregistrer la commande dans la base de données
      const savedOrder = await Liste.sauvegarderCommande(listeId, {
        serviceId,
        orderId: order.orderId,
        store,
        status: 'created',
        estimatedDelivery: order.estimatedDelivery
      });

      res.status(201).json(savedOrder);
    } catch (error) {
      console.error('Erreur lors de la création de la commande:', error);
      res.status(500).json({ error: 'Erreur lors de la création de la commande' });
    }
  },

  // Obtenir le statut d'une commande
  async getOrderStatus(req, res) {
    try {
      const { orderId } = req.params;
      const order = await Liste.obtenirCommande(orderId, req.user.id);
      
      if (!order) {
        return res.status(404).json({ error: 'Commande non trouvée' });
      }

      res.json(order);
    } catch (error) {
      console.error('Erreur lors de la récupération du statut:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération du statut' });
    }
  },

  // Annuler une commande
  async cancelOrder(req, res) {
    try {
      const { orderId } = req.params;
      const order = await Liste.obtenirCommande(orderId, req.user.id);
      
      if (!order) {
        return res.status(404).json({ error: 'Commande non trouvée' });
      }

      if (order.status === 'delivered') {
        return res.status(400).json({ error: 'Impossible d\'annuler une commande déjà livrée' });
      }

      // Mettre à jour le statut de la commande
      await Liste.mettreAJourCommande(orderId, { status: 'cancelled' });

      res.json({ message: 'Commande annulée avec succès' });
    } catch (error) {
      console.error('Erreur lors de l\'annulation de la commande:', error);
      res.status(500).json({ error: 'Erreur lors de l\'annulation de la commande' });
    }
  }
};

// Interfaces pour les différents services de livraison
const DeliveryServices = {
  // Carrefour Drive
  CARREFOUR: {
    name: 'Carrefour Drive',
    async checkAvailability(postalCode) {
      try {
        const response = await fetch(`https://api.carrefour.fr/drive/magasins?codePostal=${postalCode}`);
        const data = await response.json();
        return data.stores.length > 0;
      } catch (error) {
        console.error('Erreur Carrefour API:', error);
        return false;
      }
    },
    async createOrder(items, store) {
      // Simulation de création de commande
      return {
        orderId: `CRF-${Date.now()}`,
        store,
        items,
        estimatedDelivery: new Date(Date.now() + 24 * 60 * 60 * 1000)
      };
    }
  },

  // Leclerc Drive
  LECLERC: {
    name: 'E.Leclerc Drive',
    async checkAvailability(postalCode) {
      try {
        const response = await fetch(`https://api.leclercdrive.fr/stores?zipCode=${postalCode}`);
        const data = await response.json();
        return data.available;
      } catch (error) {
        console.error('Erreur Leclerc API:', error);
        return false;
      }
    },
    async createOrder(items, store) {
      // Simulation de création de commande
      return {
        orderId: `LEC-${Date.now()}`,
        store,
        items,
        estimatedDelivery: new Date(Date.now() + 48 * 60 * 60 * 1000)
      };
    }
  },

  // Auchan Drive
  AUCHAN: {
    name: 'Auchan Drive',
    async checkAvailability(postalCode) {
      try {
        const response = await fetch(`https://api.auchan.fr/drive/v1/stores?postalCode=${postalCode}`);
        const data = await response.json();
        return data.stores.length > 0;
      } catch (error) {
        console.error('Erreur Auchan API:', error);
        return false;
      }
    },
    async createOrder(items, store) {
      // Simulation de création de commande
      return {
        orderId: `AUC-${Date.now()}`,
        store,
        items,
        estimatedDelivery: new Date(Date.now() + 36 * 60 * 60 * 1000)
      };
    }
  }
};

class DeliveryService {
  constructor() {
    this.services = DeliveryServices;
  }

  // Récupérer les services disponibles pour un code postal
  async getAvailableServices(postalCode) {
    const availableServices = [];

    for (const [key, service] of Object.entries(this.services)) {
      try {
        const isAvailable = await service.checkAvailability(postalCode);
        if (isAvailable) {
          availableServices.push({
            id: key,
            name: service.name
          });
        }
      } catch (error) {
        console.error(`Erreur lors de la vérification du service ${service.name}:`, error);
      }
    }

    return availableServices;
  }

  // Créer une commande avec un service spécifique
  async createOrder(serviceId, items, store) {
    const service = this.services[serviceId];
    if (!service) {
      throw new Error('Service de livraison non trouvé');
    }

    try {
      return await service.createOrder(items, store);
    } catch (error) {
      console.error('Erreur lors de la création de la commande:', error);
      throw error;
    }
  }

  // Transformer une liste de courses en format compatible avec le service
  formatItems(items, serviceId) {
    // Adaptez le format des articles selon le service
    switch (serviceId) {
      case 'CARREFOUR':
        return items.map(item => ({
          name: item.nom,
          quantity: item.quantite,
          unit: item.unite || 'piece'
        }));

      case 'LECLERC':
        return items.map(item => ({
          productName: item.nom,
          qty: item.quantite,
          unitType: item.unite || 'UNIT'
        }));

      case 'AUCHAN':
        return items.map(item => ({
          label: item.nom,
          quantity: item.quantite,
          unit: item.unite || 'unit'
        }));

      default:
        return items;
    }
  }
}

export default new DeliveryService();

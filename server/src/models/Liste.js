import mongoose from 'mongoose'

// Schéma pour les articles
const articleSchema = new mongoose.Schema({
  id: Number,
  nom: { type: String, required: true },
  quantite: { type: Number, default: 1, required: true },
  categorie: { type: String, required: true },
  unite: String,
  checked: { type: Boolean, default: false },
  montant: { type: Number, default: 0 }
}, { _id: false });

// Schéma pour les listes
const listeSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true
  },
  articles: [articleSchema],
  utilisateurId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  estPrincipale: {
    type: Boolean,
    default: false
  },
  dateCreation: {
    type: Date,
    default: Date.now
  },
  dateModification: {
    type: Date,
    default: Date.now
  }
});

// Middleware pour mettre à jour la date de modification
listeSchema.pre('save', function(next) {
  this.dateModification = new Date();
  next();
});

listeSchema.pre('findOneAndUpdate', function(next) {
  this.set({ dateModification: new Date() });
  next();
});

const ListeModel = mongoose.model('Liste', listeSchema);

// Schéma pour les tokens de partage
const tokenPartageSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true
  },
  listeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Liste',
    required: true
  },
  dateCreation: {
    type: Date,
    default: Date.now
  },
  dateExpiration: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 jours
  }
});

const TokenPartageModel = mongoose.model('TokenPartage', tokenPartageSchema);

// Schéma pour les commandes de livraison
const commandeSchema = new mongoose.Schema({
  listeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Liste',
    required: true
  },
  utilisateurId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  serviceId: {
    type: String,
    required: true
  },
  orderId: {
    type: String,
    required: true
  },
  store: String,
  status: {
    type: String,
    enum: ['created', 'processing', 'ready', 'delivered', 'cancelled'],
    default: 'created'
  },
  estimatedDelivery: Date,
  dateCreation: {
    type: Date,
    default: Date.now
  }
});

const CommandeModel = mongoose.model('Commande', commandeSchema);

// Modèle Liste avec les méthodes adaptées à MongoDB
export const Liste = {
  // Créer ou mettre à jour la liste principale
  async sauvegarderPrincipale(nom, articles, utilisateurId) {
    try {
      // Vérifier si une liste principale existe pour cet utilisateur
      let liste = await ListeModel.findOne({ 
        estPrincipale: true, 
        utilisateurId: utilisateurId 
      });
      
      if (liste) {
        // Mettre à jour la liste existante
        liste.nom = nom;
        liste.articles = articles;
        await liste.save();
        
        return {
          id: liste._id,
          nom: liste.nom,
          articles: liste.articles,
          dateModification: liste.dateModification
        };
      } else {
        // Créer une nouvelle liste principale
        liste = new ListeModel({
          nom,
          articles,
          utilisateurId: utilisateurId,
          estPrincipale: true
        });
        
        await liste.save();
        
        return {
          id: liste._id,
          nom: liste.nom,
          articles: liste.articles,
          dateCreation: liste.dateCreation,
          dateModification: liste.dateModification
        };
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde principale:', error);
      throw error;
    }
  },

  // Obtenir la liste principale
  async obtenirPrincipale(utilisateurId) {
    try {
      const liste = await ListeModel.findOne({ 
        estPrincipale: true,
        utilisateurId: utilisateurId
      });
      
      if (!liste) {
        return null;
      }
      
      return {
        id: liste._id,
        nom: liste.nom,
        articles: liste.articles,
        utilisateurId: liste.utilisateurId,
        dateCreation: liste.dateCreation,
        dateModification: liste.dateModification,
        estPrincipale: liste.estPrincipale
      };
    } catch (error) {
      console.error('Erreur lors de la récupération de la liste principale:', error);
      throw error;
    }
  },

  // Obtenir une liste par ID
  async obtenirParId(id, utilisateurId) {
    try {
      const liste = await ListeModel.findOne({ 
        _id: id,
        utilisateurId: utilisateurId
      });
      
      if (!liste) {
        return null;
      }
      
      return {
        id: liste._id,
        nom: liste.nom,
        articles: liste.articles,
        utilisateurId: liste.utilisateurId,
        dateCreation: liste.dateCreation,
        dateModification: liste.dateModification,
        estPrincipale: liste.estPrincipale
      };
    } catch (error) {
      console.error('Erreur lors de la récupération de la liste:', error);
      throw error;
    }
  },

  // Récupérer toutes les listes d'un utilisateur
  async getListesUtilisateur(utilisateurId) {
    try {
      const listes = await ListeModel.find({ 
        utilisateurId: utilisateurId 
      }).sort({ dateModification: -1 });
      
      return listes.map(liste => ({
        id: liste._id,
        nom: liste.nom,
        articles: liste.articles,
        utilisateurId: liste.utilisateurId,
        dateCreation: liste.dateCreation,
        dateModification: liste.dateModification,
        estPrincipale: liste.estPrincipale
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération des listes:', error);
      throw error;
    }
  },

  // Créer une nouvelle liste
  async creerListe(nom, articles, utilisateurId) {
    try {
      const liste = new ListeModel({
        nom,
        articles,
        utilisateurId: utilisateurId,
        estPrincipale: false
      });
      
      await liste.save();
      
      return {
        id: liste._id,
        nom: liste.nom,
        articles: liste.articles,
        utilisateurId: liste.utilisateurId,
        estPrincipale: liste.estPrincipale,
        dateCreation: liste.dateCreation,
        dateModification: liste.dateModification
      };
    } catch (error) {
      console.error('Erreur lors de la création de la liste:', error);
      throw error;
    }
  },

  // Mettre à jour une liste
  async mettreAJourListe(id, nom, articles, utilisateurId) {
    try {
      const liste = await ListeModel.findOneAndUpdate(
        { 
          _id: id,
          utilisateurId: utilisateurId
        },
        { 
          nom, 
          articles,
          dateModification: new Date()
        },
        { 
          new: true, // Retourner le document mis à jour
          runValidators: true 
        }
      );
      
      if (!liste) {
        throw new Error('Liste non trouvée ou non autorisée');
      }
      
      return {
        id: liste._id,
        nom: liste.nom,
        articles: liste.articles,
        categorie: liste.categorie,
        utilisateurId: liste.utilisateurId,
        dateModification: liste.dateModification
      };
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      throw error;
    }
  },

  // Supprimer une liste
  async supprimerListe(id, utilisateurId) {
    try {
      const result = await ListeModel.deleteOne({ 
        _id: id,
        utilisateurId: utilisateurId,
        estPrincipale: false // Empêcher la suppression de la liste principale
      });
      
      if (result.deletedCount === 0) {
        throw new Error('Liste non trouvée, non autorisée ou liste principale');
      }
      
      // Supprimer aussi les tokens de partage associés
      await TokenPartageModel.deleteMany({ 
        listeId: id 
      });
      
      return { id };
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      throw error;
    }
  },

  // Créer un token de partage
  async creerTokenPartage(listeId) {
    try {
      // Générer un token unique
      const token = Buffer.from(JSON.stringify({
        listeId,
        timestamp: Date.now(),
        random: Math.random()
      })).toString('base64url');
      
      const tokenPartage = new TokenPartageModel({
        token,
        listeId: listeId
      });
      
      await tokenPartage.save();
      
      return token;
    } catch (error) {
      console.error('Erreur lors de la création du token:', error);
      throw error;
    }
  },

  // Obtenir une liste via un token de partage
  async obtenirParToken(token) {
    try {
      const tokenPartage = await TokenPartageModel.findOne({
        token,
        dateExpiration: { $gt: new Date() } // Token non expiré
      }).populate('listeId');
      
      if (!tokenPartage || !tokenPartage.listeId) {
        return null;
      }
      
      const liste = tokenPartage.listeId;
      
      return {
        id: liste._id,
        nom: liste.nom,
        articles: liste.articles,
        categorie: liste.categorie,
        dateCreation: liste.dateCreation,
        dateModification: liste.dateModification,
        utilisateurId: liste.utilisateurId, // Ajouté pour la sauvegarde
        readonly: true
      };
    } catch (error) {
      console.error('Erreur lors de la récupération par token:', error);
      throw error;
    }
  },

  // Sauvegarder une commande de livraison
  async sauvegarderCommande(listeId, commandeData) {
    try {
      const commande = new CommandeModel({
        listeId: listeId,
        utilisateurId: commandeData.utilisateurId,
        serviceId: commandeData.serviceId,
        orderId: commandeData.orderId,
        store: commandeData.store,
        status: commandeData.status,
        estimatedDelivery: commandeData.estimatedDelivery
      });
      
      await commande.save();
      
      return {
        id: commande._id,
        listeId: commande.listeId,
        serviceId: commande.serviceId,
        orderId: commande.orderId,
        store: commande.store,
        status: commande.status,
        estimatedDelivery: commande.estimatedDelivery,
        dateCreation: commande.dateCreation
      };
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la commande:', error);
      throw error;
    }
  },

  // Obtenir une commande
  async obtenirCommande(orderId, utilisateurId) {
    try {
      const commande = await CommandeModel.findOne({
        orderId,
        utilisateurId: utilisateurId
      }).populate('listeId');
      
      if (!commande) {
        return null;
      }
      
      return {
        id: commande._id,
        listeId: commande.listeId,
        serviceId: commande.serviceId,
        orderId: commande.orderId,
        store: commande.store,
        status: commande.status,
        estimatedDelivery: commande.estimatedDelivery,
        dateCreation: commande.dateCreation
      };
    } catch (error) {
      console.error('Erreur lors de la récupération de la commande:', error);
      throw error;
    }
  },

  // Mettre à jour une commande
  async mettreAJourCommande(orderId, updateData) {
    try {
      const commande = await CommandeModel.findOneAndUpdate(
        { orderId },
        updateData,
        { new: true }
      );
      
      if (!commande) {
        throw new Error('Commande non trouvée');
      }
      
      return {
        id: commande._id,
        listeId: commande.listeId,
        serviceId: commande.serviceId,
        orderId: commande.orderId,
        store: commande.store,
        status: commande.status,
        estimatedDelivery: commande.estimatedDelivery,
        dateCreation: commande.dateCreation
      };
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la commande:', error);
      throw error;
    }
  },

  // Mettre à jour les articles d'une liste par son ID (sans changer l'utilisateur ni dupliquer)
  async mettreAJourArticlesParId(listeId, articles) {
    try {
      const liste = await ListeModel.findById(listeId);
      if (!liste) {
        throw new Error('Liste non trouvée');
      }
      liste.articles = articles;
      liste.dateModification = new Date();
      await liste.save();
      return {
        id: liste._id,
        nom: liste.nom,
        articles: liste.articles,
        categorie: liste.categorie,
        dateModification: liste.dateModification
      };
    } catch (error) {
      console.error('Erreur lors de la mise à jour des articles par ID:', error);
      throw error;
    }
  }
};

// Fonction d'initialisation (optionnelle, pour créer des index si nécessaire)
export const initializeDatabase = async () => {
  try {
    // Créer des index pour optimiser les performances
    await ListeModel.createIndexes();
    await TokenPartageModel.createIndexes();
    await CommandeModel.createIndexes();
    
    console.log('✅ Base de données MongoDB initialisée');
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation de la base de données:', error);
    throw error;
  }
};

export { ListeModel, TokenPartageModel };
export default Liste;

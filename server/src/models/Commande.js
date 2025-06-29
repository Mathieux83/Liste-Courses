import mongoose from 'mongoose';

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

export const CommandeModel = mongoose.model('Commande', commandeSchema);
export default commandeSchema;

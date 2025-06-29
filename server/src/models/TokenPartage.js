import mongoose from 'mongoose';

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
    default: () => new Date(Date.now() + 3600000) // 1 heure par défaut
  }
});

export const TokenPartageModel = mongoose.model('TokenPartage', tokenPartageSchema);
export default tokenPartageSchema;

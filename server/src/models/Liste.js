import mongoose from 'mongoose';
import articleSchema from './Article.js';

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

listeSchema.pre('save', function(next) {
  this.dateModification = new Date();
  next();
});

listeSchema.pre('findOneAndUpdate', function(next) {
  this.set({ dateModification: new Date() });
  next();
});

export const ListeModel = mongoose.model('Liste', listeSchema);
export default ListeModel;
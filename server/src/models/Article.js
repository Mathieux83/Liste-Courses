import mongoose from 'mongoose';

const articleSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  quantite: { type: Number, default: 1, required: true },
  categorie: { type: String, required: true },
  unite: String,
  checked: { type: Boolean, default: false },
  montant: { type: Number, default: 0 }
});

export const ArticleModel = mongoose.model('Article', articleSchema);
export default articleSchema;

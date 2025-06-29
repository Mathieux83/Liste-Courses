import mongoose from 'mongoose';
import { ListeModel } from '../models/Liste.js';
import { TokenPartageModel } from '../models/TokenPartage.js';
import { CommandeModel } from '../models/Commande.js';

export const listeService = {
  async sauvegarderPrincipale(nom, articles, utilisateurId) {
    let liste = await ListeModel.findOne({ estPrincipale: true, utilisateurId });
    if (liste) {
      liste.nom = nom;
      liste.articles = articles;
    } else {
      liste = new ListeModel({ nom, articles, utilisateurId, estPrincipale: true });
    }
    await liste.save();
    return liste;
  },

  async obtenirPrincipale(utilisateurId) {
    return ListeModel.findOne({ estPrincipale: true, utilisateurId });
  },

  async obtenirParId(id, utilisateurId) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return ListeModel.findOne({ _id: id, utilisateurId });
  },

  async getListesUtilisateur(utilisateurId) {
    return ListeModel.find({ utilisateurId }).sort({ dateModification: -1 });
  },

  async creerListe(nom, articles = [], utilisateurId) {
    const liste = new ListeModel({ nom, articles, utilisateurId, estPrincipale: false });
    await liste.save();
    return liste;
  },

  async mettreAJourListe(id, nom, articles, utilisateurId) {
    const liste = await ListeModel.findOneAndUpdate(
      { _id: id, utilisateurId },
      { nom, articles },
      { new: true, runValidators: true }
    );
    if (!liste) throw new Error('Liste non trouvée ou non autorisée');
    return liste;
  },

  async supprimerListe(id, utilisateurId) {
    const result = await ListeModel.deleteOne({ _id: id, utilisateurId, estPrincipale: false });
    if (result.deletedCount === 0) {
      throw new Error('Liste non trouvée, non autorisée ou liste principale');
    }
    await TokenPartageModel.deleteMany({ listeId: id });
    return { id };
  },

  async creerTokenPartage(listeId) {
    const token = Buffer.from(JSON.stringify({
      listeId,
      timestamp: Date.now(),
      random: Math.random()
    })).toString('base64url');
    const tokenPartage = new TokenPartageModel({ token, listeId });
    await tokenPartage.save();
    return token;
  },

  async obtenirParToken(token) {
    const tokenPartage = await TokenPartageModel.findOne({
      token,
      dateExpiration: { $gt: new Date() }
    }).populate('listeId');
    return tokenPartage ? tokenPartage.listeId : null;
  },

  async sauvegarderCommande(listeId, commandeData) {
    const commande = new CommandeModel({ listeId, ...commandeData });
    await commande.save();
    return commande;
  },

  async obtenirCommande(orderId, utilisateurId) {
    return CommandeModel.findOne({ orderId, utilisateurId }).populate('listeId');
  },

  async mettreAJourCommande(orderId, updateData) {
    const commande = await CommandeModel.findOneAndUpdate({ orderId }, updateData, { new: true });
    if (!commande) throw new Error('Commande non trouvée');
    return commande;
  },

  async mettreAJourArticlesParId(listeId, articles) {
    const liste = await ListeModel.findById(listeId);
    if (!liste) throw new Error('Liste non trouvée');
    liste.articles = articles;
    await liste.save();
    return liste;
  }
};

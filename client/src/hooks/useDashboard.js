import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { api } from '../utils/api';

export const useDashboard = () => {
  const navigate = useNavigate();
  
  // États locaux
  const [listes, setListes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtreActif, setFiltreActif] = useState('toutes');
  const [recherche, setRecherche] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [nouvelleListe, setNouvelleListe] = useState({
    nom: '',
    description: ''
  });
  const [creationLoading, setCreationLoading] = useState(false);

  // Charger les listes
  const chargerListes = useCallback(async () => {
    try {
      setLoading(true);
      const listes = await api.obtenirListes();
      setListes(listes);
    } catch (err) {
      console.error('Erreur lors du chargement des listes:', err);
      setError('Erreur lors du chargement des listes');
      toast.error('Erreur lors du chargement des listes');
    } finally {
      setLoading(false);
    }
  }, []);

  // Effet pour charger les listes au montage
  useEffect(() => {
    chargerListes();
  }, [chargerListes]);

  // Créer une nouvelle liste
  const creerListe = async (e) => {
    e?.preventDefault();
    if (!nouvelleListe.nom.trim()) return;

    try {
      setCreationLoading(true);
      const response = await api.creerListe({
        nom: nouvelleListe.nom.trim(),
        description: nouvelleListe.description.trim(),
        articles: []
      });
      
      toast.success('Liste créée avec succès');
      setShowModal(false);
      setNouvelleListe({ nom: '', description: '' });
      
      // Recharger les listes
      await chargerListes();
      
      // Rediriger vers la nouvelle liste en utilisant _id
      const listeId = response._id || response.id;
      if (!listeId) {
        throw new Error('ID de liste non reçu dans la réponse');
      }
      navigate(`/liste/${listeId}`);
    } catch (err) {
      console.error('Erreur lors de la création de la liste:', err);
      toast.error(err.message || 'Erreur lors de la création de la liste');
    } finally {
      setCreationLoading(false);
    }
  };

  // Supprimer une liste
  const supprimerListe = async (id) => {
    try {
      await api.supprimerListe(id);
      // Mettre à jour l'état local en retirant la liste supprimée
      setListes(prevListes => prevListes.filter(liste => liste._id !== id));
      toast.success('Liste supprimée avec succès');
    } catch (err) {
      console.error('Erreur lors de la suppression de la liste:', err);
      toast.error('Erreur lors de la suppression de la liste');
    }
  };

  // Dupliquer une liste
  const dupliquerListe = async (id, e) => {
    e?.stopPropagation();
    
    try {
      const listeACopier = listes.find(liste => liste.id === id);
      if (!listeACopier) return;

      const response = await api.creerListe({
        nom: `${listeACopier.nom} (copie)`,
        description: listeACopier.description,
        articles: listeACopier.articles
      });
      
      toast.success('Liste dupliquée avec succès');
      await chargerListes();
      navigate(`/liste/${response.data.id}`);
    } catch (err) {
      logger.error('Erreur lors de la duplication de la liste:', err);
      toast.error('Erreur lors de la duplication de la liste');
    }
  };

  // Filtrer les listes
  const listesFiltrees = listes.filter(liste => {
    // Filtre par statut
    const correspondFiltre = filtreActif === 'toutes' || 
                          (filtreActif === 'actives' && !liste.terminee) ||
                          (filtreActif === 'terminees' && liste.terminee);
    
    // Filtre par recherche
    const correspondRecherche = !recherche || 
                              liste.nom.toLowerCase().includes(recherche.toLowerCase());
    
    return correspondFiltre && correspondRecherche;
  });

  return {
    // États
    listes,
    loading,
    error,
    filtreActif,
    recherche,
    showModal,
    nouvelleListe,
    creationLoading,
    listesFiltrees,
      
    // Setters
    setFiltreActif,
    setRecherche,
    setShowModal,
    setNouvelleListe,
    
    // Méthodes
    chargerListes,
    creerListe,
    supprimerListe,
    dupliquerListe
  };
};

export default useDashboard;

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { api } from '../utils/api';
import { getGuestUsername, needGuestUsernamePrompt, clearGuestUsername, setGuestUsername } from '../utils/guestUsernameStorage';
import { useSocket } from '../contexts/SocketContext';
import { useDispatch } from 'react-redux';
import { setGuest } from '../store/slices/authSlice';

export const useListePartage = () => {
  const { token } = useParams();
  const { isConnected } = useSocket();
  const dispatch = useDispatch();

  // États locaux
  const [liste, setListe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [guestUsernameState, setGuestUsernameState] = useState(getGuestUsername());
  const [showGuestUsernamePrompt, setShowGuestUsernamePrompt] = useState(needGuestUsernamePrompt());
  const [guestUsernameInput, setGuestUsernameInput] = useState('');

  // Fonction utilitaire pour normaliser les IDs
  const normalizeId = useCallback((id) => {
    if (!id) return null;
    return id.toString().trim();
  }, []);

  // Charger la liste partagée
  const chargerListePartagee = useCallback(async () => {
    if (!token) {
      console.error('[chargerListePartagee] Aucun token fourni');
      setError('Erreur: Aucun identifiant de liste fourni');
      return null;
    }
    
    try {
      console.log('[chargerListePartagee] Chargement de la liste partagée...');
      setLoading(true);
      setError(null);
      
      const data = await api.obtenirListePartagee(token);
      
      if (!data || (!data._id && !data.id)) {
        throw new Error('Réponse du serveur invalide');
      }
      
      // Normaliser les IDs
      const normalizedData = {
        ...data,
        _id: normalizeId(data._id || data.id),
        lastUpdate: Date.now()
      };
      
      // Normaliser les IDs des articles
      if (normalizedData.articles) {
        normalizedData.articles = normalizedData.articles.map(article => ({
          ...article,
          _id: normalizeId(article._id || article.id)
        }));
      }
      
      console.log('[chargerListePartagee] Données reçues:', {
        _id: normalizedData._id,
        nbArticles: normalizedData.articles?.length || 0,
        dateModification: normalizedData.dateModification
      });
      
      setListe(normalizedData);
      return normalizedData;
      
    } catch (error) {
      console.error('[chargerListePartagee] Erreur lors du chargement:', error);
      
      let errorMessage = 'Impossible de charger la liste partagée';
      
      if (error.response) {
        if (error.response.status === 404) {
          errorMessage = 'Cette liste partagée n\'existe pas ou a été supprimée';
        } else if (error.response.status === 403) {
          errorMessage = 'Vous n\'avez pas accès à cette liste';
        } else if (error.response.status >= 500) {
          errorMessage = 'Erreur serveur, veuillez réessayer plus tard';
        }
      } else if (error.request) {
        errorMessage = 'Impossible de se connecter au serveur. Vérifiez votre connexion internet.';
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
      
    } finally {
      setLoading(false);
    }
  }, [token, normalizeId]);

  // Gestion du nom d'utilisateur invité
  const handleUsernameSubmit = useCallback((e) => {
    e.preventDefault();
    if (guestUsernameInput.trim()) {
      const username = guestUsernameInput.trim();
      setGuestUsername(username);
      setGuestUsernameState(username);
      setShowGuestUsernamePrompt(false);
      toast.success('Nom d\'utilisateur enregistré !');
      
      dispatch(setGuest({
        guestUsername: username,
        guestToken: token,
        partageToken: token
      }));
    }
  }, [dispatch, guestUsernameInput, token]);

  const handleUsernameReset = useCallback(() => {
    clearGuestUsername();
    setGuestUsernameState(null);
    setShowGuestUsernamePrompt(true);
  }, []);

  // Basculer l'état d'un article (coché/décoché)
  const toggleArticle = useCallback(async (articleId) => {
    if (!guestUsernameState) {
      setShowGuestUsernamePrompt(true);
      toast.error('Veuillez renseigner un nom d\'utilisateur');
      return;
    }
    
    if (updateLoading || !token || !liste) return;
    
    const previousState = JSON.parse(JSON.stringify(liste));
    
    try {
      setUpdateLoading(true);
      
      const article = liste.articles.find(a => a._id === articleId);
      if (!article) {
        console.error(`Article avec l'ID ${articleId} non trouvé`);
        return;
      }
      
      const newChecked = !article.checked;
      
      // Mise à jour optimiste
      const updatedArticles = liste.articles.map(a => 
        a._id === articleId ? { ...a, checked: newChecked } : a
      );
      
      const updatedListe = {
        ...liste,
        articles: updatedArticles,
        dateModification: new Date().toISOString(),
        lastUpdate: Date.now()
      };
      
      setListe(updatedListe);
      
      // Appel API
      await api.mettreAJourArticlePartage(token, articleId, newChecked, guestUsernameState);
      
      toast.success('Article mis à jour !');
      
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'article:', error);
      setListe(previousState);
      
      let errorMessage = 'Erreur lors de la mise à jour';
      if (error.response?.status === 401 || error.response?.status === 403) {
        errorMessage = 'Session expirée, veuillez vous reconnecter';
      } else if (error.response?.status === 404) {
        errorMessage = 'Liste ou article non trouvé';
      } else if (error.response?.status >= 500) {
        errorMessage = 'Erreur serveur, veuillez réessayer';
      }
      
      toast.error(errorMessage);
    } finally {
      setUpdateLoading(false);
    }
  }, [guestUsernameState, liste, token, updateLoading]);

  // Effet pour charger la liste au montage
  useEffect(() => {
    if (token) {
      chargerListePartagee();
    }
  }, [token, chargerListePartagee]);

  // Gestion de l'affichage de la boîte de dialogue du nom d'utilisateur
  useEffect(() => {
    if (needGuestUsernamePrompt()) {
      setShowGuestUsernamePrompt(true);
    } else {
      setGuestUsernameState(getGuestUsername());
      setShowGuestUsernamePrompt(false);
    }
  }, []);

  return {
    // États
    liste,
    loading,
    error,
    updateLoading,
    guestUsernameState,
    showGuestUsernamePrompt,
    guestUsernameInput,
    isConnected,
    
    // Setters
    setGuestUsernameInput,
    setListe,
    
    // Méthodes
    handleUsernameSubmit,
    handleUsernameReset,
    toggleArticle,
    chargerListePartagee
  };
};

export default useListePartage;

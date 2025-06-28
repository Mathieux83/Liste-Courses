import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useSocket } from '../contexts/SocketContext';
import { api } from '../utils/api';

export const useListeCourses = () => {
  const socketService = useSocket();
  const { id } = useParams();
  
  const [currentListe, setCurrentListe] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fonction utilitaire pour normaliser les IDs
  const normalizeId = useCallback((id) => {
    if (!id) return null;
    return id.toString().trim();
  }, []);

  // Fonction utilitaire pour normaliser les réponses API
  const normalizeApiResponse = useCallback((response) => {
    if (!response) return null;
    
    const normalizedListe = {
      ...response,
      _id: normalizeId(response._id || response.id)
    };
    
    if (normalizedListe.articles) {
      normalizedListe.articles = normalizedListe.articles.map(article => ({
        ...article,
        _id: normalizeId(article._id || article.id)
      }));
    }
    
    return normalizedListe;
  }, [normalizeId]);

  // Charger la liste initiale
  useEffect(() => {
    let isMounted = true;
    
    const loadListe = async () => {
      try {
        console.log('[useListeCourses] Début du chargement de la liste avec l\'ID:', id);
        setIsLoading(true);
        
        const response = await api.obtenirListeParId(id);
        console.log('[useListeCourses] Réponse de api.obtenirListeParId:', response);
        
        if (!isMounted) return;
        
        if (response && response._id) {
          const normalizedListe = normalizeApiResponse(response);
          setCurrentListe(normalizedListe);
          console.log('[useListeCourses] Liste chargée avec succès:', {
            _id: normalizedListe._id,
            nom: normalizedListe.nom,
            nbArticles: normalizedListe.articles?.length || 0
          });
        } else {
          console.error('[useListeCourses] Réponse invalide du serveur:', response);
          setError('Impossible de charger la liste');
        }
      } catch (err) {
        console.error('[useListeCourses] Erreur lors du chargement de la liste:', err);
        if (isMounted) {
          setError('Erreur lors du chargement de la liste');
        }
      } finally {
        if (isMounted) {
          console.log('[useListeCourses] Fin du chargement, mise à jour de l\'état de chargement');
          setIsLoading(false);
        }
      }
    };

    if (id) {
      loadListe();
    }

    return () => {
      isMounted = false;
    };
  }, [id]);

  // Configurer les écouteurs d'événements Socket.IO
  useEffect(() => {
    if (!id) return;
    
    console.log('[useListeCourses] Configuration de l\'écoute des mises à jour pour la liste:', id, 'SocketService:', !!socketService);
    const normalizedCurrentId = normalizeId(id);
    let isMounted = true;

    const handleListeUpdate = (updatedListe) => {
      if (!isMounted || !updatedListe) return;
      
      console.log('[useListeUpdate] ===== DÉBUT MISE À JOUR LISTE =====');
      
      // Normaliser l'ID de la liste mise à jour
      const normalizedUpdatedId = normalizeId(updatedListe._id || updatedListe.id);
      
      // Normaliser les articles
      const normalizedArticles = (updatedListe.articles || []).map(article => ({
        ...article,
        _id: article._id || article.id,
        id: article._id || article.id
      }));
      
      if (normalizedUpdatedId === normalizedCurrentId) {
        console.log('[useListeUpdate] Mise à jour de la liste courante');
        
        setCurrentListe(prev => ({
          ...updatedListe,
          _id: normalizedUpdatedId,
          articles: normalizedArticles
        }));
      } else {
        console.log('[useListeUpdate] Mise à jour ignorée - ID ne correspond pas');
      }
    };

    // Gestion de la connexion à la room
    const joinRoom = async () => {
      if (!isMounted || !socketService) return;
      
      try {
        console.log('[useListeCourses] Vérification de la connexion à la room:', normalizedCurrentId);
        
        // Vérifier si on est déjà dans la bonne salle
        const currentRoom = socketService.currentRoom || (socketService.getCurrentRoom && socketService.getCurrentRoom());
        if (currentRoom === normalizedCurrentId) {
          console.log(`[useListeCourses] Déjà dans la bonne room ${normalizedCurrentId}, pas besoin de rejoindre`);
          return;
        }
        
        console.log('[useListeCourses] Tentative de rejoindre la room:', normalizedCurrentId);
        await socketService.joinListeRoom(normalizedCurrentId);
        console.log('[useListeCourses] Rejoint avec succès la room:', normalizedCurrentId);
      } catch (error) {
        console.error('[useListeCourses] Erreur en rejoignant la room:', error);
      }
    };

    // S'abonner aux mises à jour via le service
    const unsubscribe = socketService.on('liste-updated', handleListeUpdate);
    
    // Rejoindre la room
    joinRoom();

    // Nettoyage
    return () => {
      isMounted = false;
      console.log('[useListeCourses] Nettoyage de l\'écoute des mises à jour pour la liste:', normalizedCurrentId);
      unsubscribe();
    };
  }, [id, socketService]);

  // Actions
  const addArticle = useCallback(async (articleData) => {
    if (!socketService || !id) return null;

    try {
      console.log('[useListeCourses] Ajout d\'un article:', articleData);
      const response = await api.ajouterArticleAListe(id, articleData);
      console.log('[useListeCourses] Réponse de l\'ajout d\'article:', response);
      return response;
    } catch (err) {
      console.error('[useListeCourses] Erreur lors de l\'ajout d\'article:', err);
      setError(err.message);
      throw err;
    }
  }, [id, socketService]);

  const toggleArticle = useCallback(async (articleId, checked) => {
    if (!socketService || !id) return null;

    try {
      await api.mettreAJourArticleDansListe(id, articleId, { checked });
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [id, socketService]);

  const deleteArticle = useCallback(async (articleId) => {
    if (!socketService || !id) return false;

    try {
      await api.supprimerArticleDeListe(id, articleId);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [id, socketService]);

  return {
    currentListe,
    isLoading,
    error,
    addArticle,
    toggleArticle,
    deleteArticle,
    refetch: () => loadListe(),
    setCurrentListe
  };
};

export default useListeCourses;

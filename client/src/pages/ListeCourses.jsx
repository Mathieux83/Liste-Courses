import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import ModalPartage from '../components/ModalPartage'
import { exporterPDF, imprimerListe } from '../utils/exportUtils'
import { PlusIcon, TrashIcon, ShareIcon, PrinterIcon, DocumentArrowDownIcon, ChevronDownIcon, ArrowPathIcon } from '@heroicons/react/24/solid'
import '../styles/style-liste-courses.css'
import LogoutButton from '../components/LogoutButton'
import { BouttonAccueil } from '../components/BouttonAccueil'
import NProgress from 'nprogress'
import useListeCourses from '../hooks/useListeCourses'
import { useSocket } from '../contexts/SocketContext'
import { api } from '../utils/api'
import '../styles/index.css'

const ListeCourses = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { socket, isConnected } = useSocket();
  const [modalPartage, setModalPartage] = useState(false);
  const [nomListe, setNomListe] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [nouvelArticle, setNouvelArticle] = useState({ nom: '', categorie: '', montant: '' });
  const [triCritere, setTriCritere] = useState('nom');
  const [triOrdre, setTriOrdre] = useState('asc');
  
  // Utilisation du hook personnalisé pour la gestion de la liste
  const {
    currentListe,
    loading: loadingListe,
    error,
    addArticle,
    toggleArticle,
    deleteArticle,
    refetch,
    setCurrentListe
  } = useListeCourses();

  // Mettre à jour le nom de la liste quand elle est chargée
  useEffect(() => {
    console.log('[ListeCourses] currentListe mise à jour:', currentListe);
    if (currentListe?.nom) {
      setNomListe(currentListe.nom);
      document.title = `Liste: ${currentListe.nom}`;
    }
  }, [currentListe]);

  // Gestion du chargement avec NProgress
  useEffect(() => {
    if (loadingListe || syncing) {
      NProgress.start();
    } else {
      NProgress.done();
    }
    return () => NProgress.done();
  }, [loadingListe, syncing]);

  // Gestion des erreurs
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  // Fonction utilitaire pour trier les articles
  const trierArticles = (articles, critere, ordre) => {
    console.log(`[ListeCourses] Tri des articles - critère: ${critere}, ordre: ${ordre}`);
    const sorted = [...articles].sort((a, b) => {
      if (critere === 'prix') {
        return ordre === 'asc' ? a.montant - b.montant : b.montant - a.montant;
      } else {
        const valA = (a[critere] || '').toString().toLowerCase();
        const valB = (b[critere] || '').toString().toLowerCase();
        if (valA < valB) return ordre === 'asc' ? -1 : 1;
        if (valA > valB) return ordre === 'asc' ? 1 : -1;
        return 0;
      }
    });
    console.log('[ListeCourses] Articles triés:', sorted);
    return sorted;
  };

  // Mémoization des articles triés
  const articles = useMemo(() => {
    console.log('[ListeCourses] Mise à jour des articles:', currentListe?.articles);
    return currentListe?.articles || [];
  }, [currentListe?.articles]);
  
  const articlesCoches = useMemo(() => {
    const coches = articles.filter(article => article.checked);
    console.log('[ListeCourses] Articles cochés:', coches);
    return coches;
  }, [articles]);
  
  const articlesNonCoches = useMemo(() => {
    const nonCoches = articles.filter(article => !article.checked);
    const tries = trierArticles(nonCoches, triCritere, triOrdre);
    console.log('[ListeCourses] Articles non cochés triés:', tries);
    return tries;
  }, [articles, triCritere, triOrdre]);

  // Gestionnaire d'ajout d'article
  const handleAjouterArticle = async (e) => {
    e.preventDefault();
    if (!nouvelArticle.nom.trim()) return;
    
    const article = {
      nom: nouvelArticle.nom.trim(),
      categorie: nouvelArticle.categorie.trim() || 'Divers',
      montant: parseFloat(nouvelArticle.montant) || 0,
      checked: false,
    };
    
    try {
      setSyncing(true);
      await addArticle(article);
      setNouvelArticle({ nom: '', categorie: '', montant: '' });
      toast.success('Article ajouté !');
    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'article:', error);
      toast.error('Erreur lors de l\'ajout de l\'article');
    } finally {
      setSyncing(false);
    }
  };

  // Gestionnaire de suppression d'article
  const handleSupprimerArticle = async (articleId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) return;
    
    try {
      setSyncing(true);
      await deleteArticle(articleId);
      toast.success('Article supprimé !');
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast.error('Erreur lors de la suppression');
    } finally {
      setSyncing(false);
    }
  };

  // Gestionnaire de basculement d'état d'article
  const handleToggleArticle = async (articleId, currentChecked) => {
    try {
      setSyncing(true);
      await toggleArticle(articleId, !currentChecked);
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      toast.error('Erreur lors de la mise à jour');
      await refetch(); // Recharger la liste en cas d'erreur
    } finally {
      setSyncing(false);
    }
  };

  // Gestionnaire de sauvegarde du titre
  const handleSauvegarderTitre = async () => {
    if (!currentListe?._id || !nomListe.trim()) return;
    
    try {
      setSyncing(true);
      await api.mettreAJourListe(currentListe._id, { nom: nomListe.trim() });
      toast.success('Titre mis à jour !');
    } catch (error) {
      console.error('Erreur lors de la mise à jour du titre:', error);
      toast.error('Erreur lors de la mise à jour du titre');
    } finally {
      setSyncing(false);
    }
  };

  // Gestionnaire de vidage de la liste
  const handleViderListe = async () => {
    if (!currentListe?._id) {
      console.error('Impossible de vider la liste: ID de liste manquant');
      toast.error('Erreur: Liste introuvable');
      return;
    }
    
    if (!window.confirm('Êtes-vous sûr de vouloir vider la liste ? Tous les articles seront supprimés.')) {
      return;
    }
    
    try {
      console.log(`[ListeCourses] Début du vidage de la liste ${currentListe._id}`);
      setSyncing(true);
      
      // Appeler l'API pour vider la liste
      const result = await api.effacerArticlesDeListe(currentListe._id);
      console.log('[ListeCourses] Réponse du vidage de la liste:', result);
      
      // Mettre à jour l'état local
      if (result && result._id) {
        setCurrentListe(prev => ({
          ...prev,
          articles: []
        }));
        toast.success(result.message || 'Tous les articles ont été supprimés avec succès');
      } else {
        throw new Error(result?.message || 'Erreur lors de la suppression des articles');
      }
    } catch (error) {
      console.error('[ListeCourses] Erreur lors du vidage de la liste:', error);
      toast.error(error.message || 'Une erreur est survenue lors de la suppression des articles');
    } finally {
      setSyncing(false);
    }
  };

  // Calcul du total des articles
  const calculerTotal = useCallback(() => {
    return articles.reduce((sum, article) => sum + (parseFloat(article.montant) || 0), 0);
  }, [articles]);

  // Gestionnaire de touche Entrée
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleAjouterArticle(e);
    }
  };

  // Affichage du chargement
  if (loadingListe) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-color"></div>
      </div>
    );
  }
  
  // Affichage si la liste n'est pas trouvée
  if (!currentListe) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-semibold mb-4">Liste introuvable</h2>
        <button 
          onClick={() => navigate('/dashboard')} 
          className="btn-primary"
        >
          Retour au tableau de bord
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Indicateur de synchronisation */}
      {syncing && (
        <div className="fixed bottom-4 right-4 bg-white p-3 rounded-lg shadow-lg flex items-center gap-2 text-sm z-50">
          <ArrowPathIcon className="w-5 h-5 animate-spin" />
          <span>Synchronisation...</span>
        </div>
      )}

      {/* En-tête avec boutons de navigation */}
      <div className="flex justify-center gap-4 mb-6">
        <BouttonAccueil />
        <LogoutButton />
      </div>

      <div className="liste-container">
        {/* En-tête de la liste */}
        <div className="liste-header">
          <input
            type="text"
            value={nomListe}
            onChange={(e) => setNomListe(e.target.value)}
            onBlur={handleSauvegarderTitre}
            onKeyDown={(e) => e.key === 'Enter' && handleSauvegarderTitre()}
            className="liste-title liste-input"
            style={{ 
              fontSize: '2rem', 
              fontWeight: '700', 
              background: 'transparent',
              border: 'none',
              color: 'var(--secondary-color)'
            }}
          />
          
          {/* Boutons d'actions */}
          <div className="flex justify-center gap-3 mt-4 flex-wrap">
            <button
              onClick={() => setModalPartage(true)}
              className="btn-primary"
              disabled={!currentListe?._id}
            >
              <ShareIcon className="w-5 h-5 inline mr-2 mb-1 mt-0.5" />
              Partager
            </button>
            
            <button
              onClick={() => exporterPDF(articles, nomListe)}
              className="btn-secondary"
              disabled={!articles.length}
            >
              <DocumentArrowDownIcon className="w-5 h-5 inline mr-2 mb-1 mt-0.5" />
              Exporter PDF
            </button>
            
            <button
              onClick={() => imprimerListe(articles, nomListe)}
              className="btn-secondary"
              disabled={!articles.length}
            >
              <PrinterIcon className="w-5 h-5 inline mr-2 mb-1 mt-0.5" />
              Imprimer
            </button>
          </div>
        </div>

        {/* Formulaire d'ajout d'article */}
        <div className="add-item-form">
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--secondary-color)' }}>
            Ajouter un article
          </h3>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <input
                type="text"
                placeholder="Nom de l'article"
                value={nouvelArticle.nom}
                onChange={(e) => setNouvelArticle({
                  ...nouvelArticle,
                  nom: e.target.value
                })}
                onKeyPress={handleKeyPress}
                className="liste-input"
              />
            </div>
            
            <div style={{ position: "relative" }}>
              <select
                className="cat-form"
                value={nouvelArticle.categorie}
                onChange={e => setNouvelArticle({ ...nouvelArticle, categorie: e.target.value })}
                style={{ appearance: "none", WebkitAppearance: "none", MozAppearance: "none" }}
              >
                <option value="" disabled hidden>Choisir une catégorie</option>
                <option value="Alcool">Alcool</option>
                <option value="Apéro">Apéro</option>
                <option value="Boissons">Boissons</option>
                <option value="Épicerie">Épicerie</option>
                <option value="Fruits">Fruits</option>
                <option value="Laitier">Laitier</option>
                <option value="Légumes">Légumes</option>
                <option value="Soins/Hygiène">Soins/Hygiène</option>
                <option value="Surgelé">Surgelé</option>
                <option value="Viande">Viande</option>
                <option value="Autre">Autre</option>
              </select>
              <ChevronDownIcon
                style={{
                  position: "absolute",
                  right: "1.2rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  pointerEvents: "none",
                  width: "1.2rem",
                  height: "1.2rem",
                  color: "var(--secondary-color)"
                }}
              />
            </div>
            
            <div>
              <input
                type="number"
                placeholder="Prix (€)"
                step="0.01"
                min="0"
                value={nouvelArticle.montant}
                onChange={(e) => setNouvelArticle({
                  ...nouvelArticle,
                  montant: e.target.value
                })}
                onKeyPress={handleKeyPress}
                className="liste-input"
              />
            </div>
          </div>
          
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleAjouterArticle}
              className="btn-primary flex-1"
              disabled={!nouvelArticle.nom.trim()}
            >
              <PlusIcon className="w-5 h-5 inline mr-2" />
              Ajouter
            </button>
            
            {articles.length > 0 && (
              <button
                onClick={handleViderListe}
                className="btn-danger"
                disabled={syncing}
              >
                <TrashIcon className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Liste des articles */}
        {articles.length === 0 ? (
          <div className="card text-center py-12">
            <div className="text-6xl mb-4">🛒</div>
            <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--secondary-color)' }}>
              Votre liste est vide
            </h3>
            <p style={{ color: 'rgba(236, 239, 244, 0.7)' }}>
              Ajoutez des articles pour commencer
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Articles non cochés */}
            {articlesNonCoches.length > 0 && (
              <div className="card">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold" style={{ color: 'var(--secondary-color)' }}>
                    À acheter ({articlesNonCoches.length})
                  </h3>
                  
                  {/* Boutons de tri */}
                  <div className="flex gap-2 flex-wrap items-center">
                    <span className="font-medium mr-2">Trier par :</span>
                    <button
                      className={`btn-secondary btn-xs ${triCritere === 'categorie' ? 'active' : ''}`}
                      onClick={() => {
                        if (triCritere === 'categorie') {
                          setTriOrdre(triOrdre === 'asc' ? 'desc' : 'asc');
                        } else {
                          setTriCritere('categorie');
                          setTriOrdre('asc');
                        }
                      }}
                    >
                      Catégorie {triCritere === 'categorie' && (triOrdre === 'asc' ? ' ⬆️' : ' ⬇️')}
                    </button>
                    <button
                      className={`btn-secondary btn-xs ${triCritere === 'nom' ? 'active' : ''}`}
                      onClick={() => {
                        if (triCritere === 'nom') {
                          setTriOrdre(triOrdre === 'asc' ? 'desc' : 'asc');
                        } else {
                          setTriCritere('nom');
                          setTriOrdre('asc');
                        }
                      }}
                    >
                      Nom {triCritere === 'nom' && (triOrdre === 'asc' ? ' ⬆️' : ' ⬇️')}
                    </button>
                    <button
                      className={`btn-secondary btn-xs ${triCritere === 'prix' ? 'active' : ''}`}
                      onClick={() => {
                        if (triCritere === 'prix') {
                          setTriOrdre(triOrdre === 'asc' ? 'desc' : 'asc');
                        } else {
                          setTriCritere('prix');
                          setTriOrdre('asc');
                        }
                      }}
                    >
                      Prix {triCritere === 'prix' && (triOrdre === 'asc' ? ' ⬆️' : ' ⬇️')}
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {articlesNonCoches.map((article, index) => {
                    // Utiliser _id si disponible, sinon utiliser l'index comme clé de secours
                    const articleKey = article._id || `temp-${index}-${article.nom}`;
                    return (
                      <div key={articleKey} className="liste-item">
                        <div className="flex items-center w-full">
                          <div style={{ width: '40px', display: 'flex', justifyContent: 'start' }}>
                            <input
                              type="checkbox"
                              checked={article.checked || false}
                              onChange={() => handleToggleArticle(article._id, article.checked)}
                              className="w-5 h-5 rounded border-2 border-secondary-color focus:ring-2 focus:ring-accent-color"
                              disabled={syncing}
                            />
                          </div>
                          <span className="" style={{ color: 'var(--secondary-color)', width: '120px', textAlign: 'left' }}>
                            {article.categorie || 'Sans catégorie'}
                          </span>
                          <span className="font-medium text-center flex-1" style={{ minWidth: 0 }}>
                            {article.nom || 'Nom manquant'}
                          </span>
                          <span className="" style={{ color: 'var(--accent-color)', width: '120px', textAlign: 'right', marginRight: '1rem'}}>
                            {(article.montant || 0).toFixed(2)}€
                          </span>
                          <div style={{ width: '40px', display: 'flex', justifyContent: 'center' }}>
                            <button
                              onClick={() => handleSupprimerArticle(article._id)}
                              className="delete-btn"
                              title="Supprimer"
                              disabled={syncing}
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Articles cochés */}
            {articlesCoches.length > 0 && (
              <div className="card">
                <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--success-color)' }}>
                  Acheté ({articlesCoches.length})
                </h3>
                <div className="space-y-2">
                  {articlesCoches.map((article, index) => {
                    // Utiliser _id si disponible, sinon utiliser l'index comme clé de secours
                    const articleKey = article._id || `temp-${index}-${article.nom}`;
                    return (
                      <div key={articleKey} className="liste-item liste-item-checked">
                        <div className="flex items-center w-full">
                          <div style={{ width: '40px', display: 'flex', justifyContent: 'start' }}>
                            <input
                              type="checkbox"
                              checked={article.checked || false}
                              onChange={() => handleToggleArticle(article._id, article.checked)}
                              className="w-5 h-5 rounded border-2 border-secondary-color focus:ring-2 focus:ring-accent-color"
                              disabled={syncing}
                            />
                          </div>
                          <span className="" style={{ color: 'var(--secondary-color)', width: '120px', textAlign: 'left' }}>
                            {article.categorie || 'Sans catégorie'}
                          </span>
                          <span className="font-medium text-center flex-1" style={{ minWidth: 0, textDecoration: 'line-through', opacity: 0.7 }}>
                            {article.nom || 'Nom manquant'}
                          </span>
                          <span className="" style={{ color: 'var(--accent-color)', width: '120px', textAlign: 'right', marginRight: '1rem', textDecoration: 'line-through', opacity: 0.7 }}>
                            {(article.montant || 0).toFixed(2)} €
                          </span>
                          <div style={{ width: '40px', display: 'flex', justifyContent: 'center' }}>
                            <button
                              onClick={() => handleSupprimerArticle(article._id)}
                              className="delete-btn"
                              title="Supprimer"
                              disabled={syncing}
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Résumé */}
            <div className="card">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-lg font-semibold" style={{ color: 'var(--secondary-color)' }}>
                    Total: {calculerTotal().toFixed(2)} €
                  </span>
                  <div className="text-sm mt-1" style={{ color: 'rgba(236, 239, 244, 0.7)'}}>
                    {articles.length} article{articles.length > 1 ? 's' : ''} 
                    {articlesCoches.length > 0 && ` • ${articlesCoches.length} acheté${articlesCoches.length > 1 ? 's' : ''}`}
                  </div>
                </div>
                
                {articlesCoches.length > 0 && (
                  <div className="badge-success">
                    {Math.round((articlesCoches.length / articles.length) * 100)}% terminé
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Modal de partage */}
      {modalPartage && currentListe && (
        <ModalPartage
          listeId={currentListe._id}
          nomListe={nomListe}
          onClose={() => setModalPartage(false)}
        />
      )}
    </>
  );
};

export default ListeCourses;

import React, { useEffect } from 'react';
import { toast } from 'react-hot-toast';
import '../styles/style-liste-partage.css';
import { 
  EyeIcon,
  ShareIcon,
  CheckCircleIcon,
  XCircleIcon,
  CalendarIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  UserIcon
} from '@heroicons/react/24/solid';
import NProgress from 'nprogress';
import { BouttonAccueil } from '../components/BouttonAccueil';
import useListePartage from '../hooks/useListePartage';
import { useSocket } from '../contexts/SocketContext';

export default function ListePartage() {
  // Utilisation du hook personnalisé pour gérer la logique de la liste partagée
  const {
    liste,
    loading,
    error,
    updateLoading,
    guestUsernameState,
    showGuestUsernamePrompt,
    guestUsernameInput,
    isConnected,
    setGuestUsernameInput,
    handleUsernameSubmit,
    handleUsernameReset,
    toggleArticle,
    chargerListePartagee,
    setListe // Ajout de setListe depuis le hook
  } = useListePartage();

  // Récupérer l'instance de socket depuis le contexte
  const socket = useSocket();

  // Gestion des mises à jour en temps réel via Socket.IO
  useEffect(() => {
    if (!socket || !socket.socket) return;

    const handleListeUpdate = (updatedListe) => {
      console.log('[ListePartage] Mise à jour de la liste reçue:', updatedListe);
      
      // Normaliser les données reçues
      if (updatedListe && updatedListe.articles) {
        updatedListe.articles = updatedListe.articles.map(article => ({
          ...article,
          _id: article._id || article.id, // Assurer que _id est défini
          id: article._id || article.id   // Pour la rétrocompatibilité
        }));
      }
      
      setListe(prevListe => {
        // Si la liste mise à jour a un ID différent, ne pas mettre à jour
        if (prevListe && prevListe._id !== updatedListe._id) {
          return prevListe;
        }
        return updatedListe;
      });
    };

    // S'abonner aux mises à jour de la liste
    socket.socket.on('liste-updated', handleListeUpdate);

    // Nettoyer l'écouteur lors du démontage du composant
    return () => {
      if (socket.socket) {
        socket.socket.off('liste-updated', handleListeUpdate);
      }
    };
  }, [socket, setListe]);

  // Gestion du chargement avec NProgress
  useEffect(() => {
    if (loading) {
      NProgress.start();
    } else {
      NProgress.done();
    }
    return () => {
      NProgress.done();
    };
  }, [loading]);

  // Chargement initial de la liste
  useEffect(() => {
    if (liste === null && !loading && !error) {
      chargerListePartagee();
    }
  }, [liste, loading, error, chargerListePartagee]);

  // Fonctions utilitaires pour l'affichage
  const calculerTotal = () => {
    if (!liste?.articles) return 0;
    return liste.articles.reduce((total, article) => total + (article.montant || 0), 0);
  };

  // Calcul des articles cochés et non cochés
  const articlesCoches = liste?.articles?.filter(article => article.checked) || [];
  const articlesNonCoches = liste?.articles?.filter(article => !article.checked) || [];
  
  const calculerProgression = () => {
    if (!liste?.articles?.length) return 0;
    return Math.round((articlesCoches.length / liste.articles.length) * 100);
  }

  const formaterDate = (dateString) => {
    if (!dateString) return 'Date inconnue'
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // État de chargement
  if (loading || !liste) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  // Modal nom utilisateur
  if (showGuestUsernamePrompt) {
    return (
      <div className='min-h-screen flex items-center justify-center p-4 -mt-8' style={{ backgroundColor: 'var(--primary-color)' }}>
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center pastille-hover" 
                 style={{ backgroundColor: 'var(--secondary-color)' }}>
              <UserIcon className="w-8 h-8" style={{ color: 'var(--primary-color)' }} />
            </div>
            <h1 className="text-3xl font-bold mb-2 border-text" style={{ color: 'var(--secondary-color)' }}>
              Connexion
            </h1>
            <p style={{ color: 'rgba(236, 239, 244, 0.7)' }}>
              Accédez à la liste partagée
            </p>
          </div>
          <div className='text-center auth-container'>
            <form onSubmit={handleUsernameSubmit} className='space-y-6'>
              <label className='block font-medium mb-2 box-shadow' style={{ color: 'var(--secondary-color)', fontSize: '1.5rem' }}>Entrez un nom d'utilisateur</label>
              <div className="relative">
                <input
                  type="text"
                  value={guestUsernameInput}
                  onChange={e => setGuestUsernameInput(e.target.value)}
                  autoFocus
                  required
                  placeholder="Votre nom d'utilisateur"
                  className='auth-input pl-10'                         
                />
                <UserIcon className="w-5 h-5 absolute left-4 top-4" style={{ color: 'var(--secondary-color)' }} />
              </div>
              <button type="submit" className='btn-primary w-full'>Valider</button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  // État d'erreur
  if (error) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center p-4" 
            style={{ backgroundColor: 'var(--primary-color)' }}>
          <div className="card text-center max-w-lg">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" 
                style={{ backgroundColor: 'rgba(191, 97, 106, 0.1)' }}>
              <XCircleIcon className="w-8 h-8" style={{ color: 'var(--accent-color)' }} />
            </div>
            
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--accent-color)' }}>
              Erreur de chargement
            </h2>
            
            <p className="mb-6" style={{ color: 'rgba(236, 239, 244, 0.8)' }}>
              {error}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={chargerListePartagee}
                className="btn-primary"
              >
                Réessayer
              </button>
            </div>
          </div>
          <div>
            <BouttonAccueil/>
          </div>
        </div>
      </>
    )
  }

  // Jamais de mutation directe sur liste.articles !


  const progression = calculerProgression()

  return (
    <>
      <div className="min-h-screen p-4" style={{ backgroundColor: 'var(--primary-color)' }}>
        <div className="max-w-4xl mx-auto">
          
          {/* Bouton retour */}
          <div className="mb-6">
            <BouttonAccueil/>
          </div>

          {/* Header de la liste partagée */}
          <div className="card mb-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <ShareIcon className="w-6 h-6 mr-3 mt-1.5" style={{ color: 'var(--secondary-color)' }} />
                  <h1 className="text-3xl font-bold" style={{ color: 'var(--secondary-color)' }}>
                    {liste.nom}
                  </h1>
                </div>
                
                {liste.description && (
                  <p className="text-lg mb-4" style={{ color: 'rgba(236, 239, 244, 0.8)' }}>
                    {liste.description}
                  </p>
                )}
              </div>
              
              <div className="badge-primary" style={{ borderRadius: '1.5rem', padding: '0.5rem'}}>
                <EyeIcon className="w-5 h-5 inline mr-1 mb-0.5" />
                Vue partagée
              </div>
            </div>

            {/* Informations de partage */}
            <div className="p-4 rounded-lg mb-4" style={{ 
              backgroundColor: 'rgba(136, 192, 208, 0.1)',
              border: '1px solid var(--secondary-color)'
            }}>
              <div className="flex items-start space-x-3">
                <ExclamationTriangleIcon className="w-7 h-7 mt-0.5" style={{ color: 'var(--warning-color)' }} />
                <div>
                  <h3 className="font-semibold mb-1" style={{ color: 'var(--secondary-color)' }}>
                    Mode lecture partagée
                  </h3>
                  <p className="text-sm" style={{ color: 'rgba(236, 239, 244, 0.7)' }}>
                    Vous pouvez cocher les éléments de cette liste, mais vous ne pouvez pas la modifier.
                    Vos actions sont synchronisées avec les autres utilisateurs.
                  </p>
                </div>
              </div>
            </div>

            {/* Métadonnées */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center">
                <DocumentTextIcon className="w-5 h-5 mr-2" style={{ color: 'var(--secondary-color)' }} />
                <span style={{ color: 'rgba(236, 239, 244, 0.7)' }}>
                  {liste?.articles?.length || 0} article{liste?.articles?.length > 1 ? 's' : ''}
                </span>
              </div>
              
              <div className="flex items-center">
                <CalendarIcon className="w-5 h-5 mr-2" style={{ color: 'var(--secondary-color)' }} />
                <span style={{ color: 'rgba(236, 239, 244, 0.7)' }}>
                  Modifiée le {liste?.dateModification ? formaterDate(liste.dateModification) : 'date inconnue'}
                </span>
              </div>
              
              <div className="flex items-center">
                <ClockIcon className="w-5 h-5 mr-2" style={{ color: 'var(--secondary-color)' }} />
                <span style={{ color: 'rgba(236, 239, 244, 0.7)' }}>
                  Dernière sync: {formaterDate(new Date().toISOString())}
                </span>
              </div>
            </div>

            {/* Barre de progression */}
            {liste?.articles?.length > 0 && (
              <div className="mt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium" style={{ color: 'var(--secondary-color)' }}>
                    Progression de la liste
                  </span>
                  <span className="text-sm font-semibold" style={{ color: 'var(--secondary-color)' }}>
                    {articlesCoches?.length || 0}/{liste?.articles?.length || 0} ({progression}%)
                  </span>
                </div>
                <div className="w-full rounded-full h-3" style={{ backgroundColor: 'var(--primary-color)' }}>
                  <div
                    className="h-3 rounded-full transition-all duration-500"
                    style={{
                      width: `${progression}%`,
                      backgroundColor: progression === 100 ? 'var(--success-color)' : 'var(--secondary-color)'
                    }}
                  ></div>
                </div>
                
                {progression === 100 && (
                  <div className="flex items-center mt-2 text-sm" style={{ color: 'var(--success-color)' }}>
                    <CheckCircleIcon className="w-5 h-5 mr-2" />
                    Liste terminée ! Félicitations ! 🎉
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Contenu de la liste */}
          {(!liste.articles || liste.articles.length === 0) ? (
            <div className="card text-center py-16">
              <div className="text-6xl mb-6">📋</div>
              <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--secondary-color)' }}>
                Liste vide
              </h3>
              <p style={{ color: 'rgba(236, 239, 244, 0.7)' }}>
                Cette liste partagée ne contient aucun article pour le moment.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Articles à acheter */}
              {articlesNonCoches.length > 0 && (
                <div className="card">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold" style={{ color: 'var(--secondary-color)' }}>
                      À acheter ({articlesNonCoches.length})
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {articlesNonCoches.map((article, idx) => (
                      <div key={article._id || idx} className="liste-item">
                        <div className="flex items-center w-full">
                          <div style={{ width: '40px', display: 'flex', justifyContent: 'start' }}>
                            <input
                              type="checkbox"
                              checked={article.checked}
                              onChange={() => toggleArticle(article._id)}
                              disabled={updateLoading}
                              className="w-5 h-5 rounded border-2 border-secondary-color focus:ring-2 focus:ring-accent-color transition-colors"
                            />
                          </div>
                          <span className="" style={{ color: 'var(--secondary-color)', width: '120px', textAlign: 'left' }}>
                            {article.categorie}
                          </span>
                          <span className="font-medium text-center flex-1" style={{ minWidth: 0 }}>
                            {article.nom}
                          </span>
                          <span className="" style={{ color: 'var(--accent-color)', width: '120px', textAlign: 'right', marginRight: '1rem'}}>
                            {article.montant > 0 ? `${article.montant.toFixed(2)} €` : ''}
                          </span>
                        </div>
                        {updateLoading && (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 ml-3" 
                               style={{ borderColor: 'var(--secondary-color)' }}></div>
                        )}
                      </div>
                    ))}
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
                    {articlesCoches.map((article, idx) => (
                      <div key={article._id || idx} className="liste-item liste-item-checked">
                        <div className="flex items-center w-full">
                          <div style={{ width: '40px', display: 'flex', justifyContent: 'start' }}>
                            <input
                              type="checkbox"
                              checked={article.checked}
                              onChange={() => toggleArticle(article._id)}
                              disabled={updateLoading}
                              className="w-5 h-5 rounded border-2 border-secondary-color focus:ring-2 focus:ring-accent-color"
                            />
                          </div>
                          <span className="text-sm" style={{ color: 'var(--secondary-color)', width: '120px', textAlign: 'left' }}>
                            {article.categorie}
                          </span>
                          <span className="font-medium text-center flex-1" style={{ minWidth: 0 }}>
                            {article.nom}
                          </span>
                          <span className="text-sm" style={{ color: 'var(--accent-color)', width: '120px', textAlign: 'right', marginRight: '1rem'}}>
                            {article.montant > 0 ? `${article.montant.toFixed(2)} €` : ''}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Résumé */}
              <div className="card">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-lg font-semibold" style={{ color: 'var(--secondary-color)' }}>
                      Total estimé: {calculerTotal().toFixed(2)} €
                    </span>
                    <div className="text-sm mt-1" style={{ color: 'rgba(236, 239, 244, 0.7)' }}>
                      {liste.articles.length} article{liste.articles.length > 1 ? 's' : ''}
                      {articlesCoches.length > 0 && ` • ${articlesCoches.length} acheté${articlesCoches.length > 1 ? 's' : ''}`}
                    </div>
                  </div>
                  
                  {progression > 0 && (
                    <div className={progression === 100 ? 'badge-success' : 'badge-primary'} style={{ padding: '0.5rem', borderRadius: '0.5rem'}}>
                      {progression}% terminé
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Footer informatif */}
          <div className="mt-8 text-center">
            <p className="text-sm" style={{ color: 'rgba(236, 239, 244, 0.5)' }}>
              Cette liste est mise à jour en temps réel. 
              Vos modifications sont automatiquement synchronisées.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

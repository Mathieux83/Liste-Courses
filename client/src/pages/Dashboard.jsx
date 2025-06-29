import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import '../styles/style-liste-accueil.css';
import LogoutButton from '../components/LogoutButton';
import NProgress from 'nprogress';
import { DonateButton } from '../components/DonateButton';
import { useSelector } from 'react-redux';
import { api } from '../utils/api';
import useDashboard from '../hooks/useDashboard';

import { 
  PlusIcon, 
  TrashIcon,
  EyeIcon,
  ShareIcon,
  CalendarIcon,
  ShoppingCartIcon,
  DocumentTextIcon,
  XMarkIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/solid';

export default function Dashboard({ isAuthenticated, onLogout, premierChargement, setPremierChargement }) {
  const {
    listes,
    loading,
    error,
    filtreActif,
    recherche,
    showModal,
    nouvelleListe,
    creationLoading,
    setFiltreActif,
    setRecherche,
    setShowModal,
    setNouvelleListe,
    chargerListes,
    creerListe,
    supprimerListe,
    dupliquerListe
  } = useDashboard();
  
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && premierChargement) {
      setPremierChargement?.(false);
    }
  }, [loading, premierChargement, setPremierChargement]);

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

  const formaterDate = (dateString) => {
    if (!dateString) return 'Date inconnue'
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const calculerProgression = (articles) => {
    if (!articles || articles.length === 0) return 0
    const articlesCoches = articles.filter(article => article.checked).length
    return Math.round((articlesCoches / articles.length) * 100)
  }

  if (loading) {
    return null;
  }

  const currentError = error;

  return (
    <div className="p-4" style={{ backgroundColor: 'var(--primary-color)' }}>
      <div className="max-w-6xl mx-auto">
        {/* Logo/Header ListMe */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div className='-mt-10 mb-7' style={{ display: 'flex', justifyContent: 'center', fontSize: '4.5rem', fontWeight: 600, color: 'var(--secondary-color)' }}>
            <h4>List</h4>
          </div>
          <div className='-mt-10 mb-7' style={{ display: 'flex', justifyContent: 'center', fontSize: '4.5rem', fontWeight: 600, color: 'var(--text-light)' }}>
            <h4>M</h4>
          </div>
          <div className='-mt-10 mb-7' style={{ display: 'flex', justifyContent: 'center', fontSize: '4.5rem', fontWeight: 600, color: 'var(--accent-color)' }}>
            <h4>e</h4>
          </div>
        </div>

        <div className="btn-logout-dashboard">
          <LogoutButton />
        </div>

        {/* Header, recherche, filtres, bouton nouvelle liste, messages d'erreur */}
        <div className="mb-8">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold mb-4" style={{ color: 'var(--secondary-color)' }}>
              <ShoppingCartIcon className="w-10 h-10 inline mr-3 mb-3" />
              Mes Listes de Courses
            </h1>
            <p style={{ color: 'rgba(236, 239, 244, 0.7)' }}>
              Organisez et gérez toutes vos listes de courses en un seul endroit
            </p>
          </div>

          <div className="card mb-6">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              {/* Recherche */}
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Rechercher une liste..."
                  value={recherche}
                  onChange={(e) => setRecherche(e.target.value)}
                  className="recherche-input"
                />
              </div>

              {/* Filtres */}
              <div className="flex gap-2">
                <button
                  onClick={() => setFiltreActif('toutes')}
                  className={filtreActif === 'toutes' ? 'btn-primary' : 'btn-secondary'}
                >
                  Toutes ({listes.length})
                </button>
                <button
                  onClick={() => setFiltreActif('recentes')}
                  className={filtreActif === 'recentes' ? 'btn-primary' : 'btn-secondary'}
                >
                  <CalendarIcon className="w-4 h-4 inline mr-1 mb-1" />
                  Récentes
                </button>
                <button
                  onClick={() => setFiltreActif('partagees')}
                  className={filtreActif === 'partagees' ? 'btn-primary' : 'btn-secondary'}
                >
                  <ShareIcon className="w-4 h-4 inline mr-1 mb-1" />
                  Partagées
                </button>
              </div>

              {/* Bouton nouvelle liste */}
              <button
                onClick={() => setShowModal(true)}
                className="btn-primary"
              >
                <PlusIcon className="w-5 h-5 inline mr-2 mb-1" />
                Nouvelle Liste
              </button>
            </div>

            {/* Message d'erreur */}
            {currentError && (
              <div className="form-error p-4 rounded-lg mb-6 text-center" style={{ 
                backgroundColor: 'rgba(191, 97, 106, 0.1)',
                border: '1px solid var(--accent-color)'
              }}>
                {currentError}
                <button
                  onClick={chargerListes}
                  className="btn-secondary ml-4"
                >
                  Réessayer
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Contenu principal */}
        {listes.length === 0 ? (
          <div className="listes-grid">
            <div className="liste-card group">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--secondary-color)' }}>
                Aucune liste trouvée
              </h3>
              <p className="mb-6" style={{ color: 'rgba(236, 239, 244, 0.7)' }}>
                Créez votre première liste de courses pour commencer
              </p>
              <button onClick={() => setShowModal(true)} className="btn-primary">
                <PlusIcon className="w-5 h-5 inline mr-2 mb-1" />
                Créer ma première liste
              </button>
            </div>
          </div>
        ) : (
          <div className="listes-grid">
            {listes.map(liste => {
              const progression = calculerProgression(liste.articles)
              const nbArticles = liste.articles ? liste.articles.length : 0
              
              return (
                <div key={liste._id} className="liste-card group">
                  {/* En-tête de la carte */}
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-semibold" style={{ color: 'var(--secondary-color)' }}>
                      {liste.nom}
                    </h3>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => navigate(`/liste/${liste._id}`)}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        title="Voir la liste"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => dupliquerListe(liste._id)}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        title="Dupliquer"
                      >
                        <DocumentDuplicateIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => supprimerListe(liste._id)}
                        className="p-2 hover:bg-red-100 rounded-full transition-colors text-red-600"
                        title="Supprimer"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Description */}
                  {liste.description && (
                    <p className="mb-4" style={{ color: 'rgba(236, 239, 244, 0.7)' }}>
                      {liste.description}
                    </p>
                  )}

                  {/* Barre de progression */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span>Progression</span>
                      <span>{progression}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progression}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Métadonnées */}
                  <div className="liste-card-meta">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span>
                        <CalendarIcon className="w-4 h-4 inline mr-1" />
                        {formaterDate(liste.dateModification || liste.dateCreation)}
                      </span>
                      <span>
                        <DocumentTextIcon className="w-4 h-4 inline mr-1" />
                        {nbArticles} article{nbArticles > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Modal de création */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              {/* Header du modal */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="modal-title">
                  <PlusIcon className="w-6 h-6 inline mr-2 mb-1" />
                  Nouvelle Liste de Courses
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  style={{ color: 'var(--secondary-color)' }}
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              {/* Formulaire */}
              <form onSubmit={creerListe} className="space-y-4">
                <div>
                  <label htmlFor="nom" className="block text-sm font-medium mb-2" 
                         style={{ color: 'var(--secondary-color)' }}>
                    Nom de la liste *
                  </label>
                  <input
                    id="nom"
                    type="text"
                    required
                    value={nouvelleListe.nom}
                    onChange={(e) => setNouvelleListe({
                      ...nouvelleListe,
                      nom: e.target.value
                    })}
                    placeholder="Ex: Courses du weekend"
                    className="new-form-input"
                    maxLength={100}
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium mb-2" 
                         style={{ color: 'var(--secondary-color)' }}>
                    Description (optionnelle)
                  </label>
                  <textarea
                    id="description"
                    value={nouvelleListe.description}
                    onChange={(e) => setNouvelleListe({
                      ...nouvelleListe,
                      description: e.target.value
                    })}
                    placeholder="Décrivez votre liste..."
                    className="input resize-none new-form-input"
                    rows={3}
                    maxLength={500}
                  />
                </div>

                {/* Actions du modal */}
                <div className="flex gap-3 pt-4 border-t" style={{ borderColor: 'var(--secondary-color)' }}>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn-secondary flex-1"
                    disabled={creationLoading}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="btn-primary flex-1"
                    disabled={creationLoading || !nouvelleListe.nom.trim()}
                  >
                    {creationLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block mr-2"></div>
                        Création...
                      </>
                    ) : (
                      <>
                        <PlusIcon className="w-4 h-4 inline mr-2 mb-0.5" />
                        Créer la liste
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Bouton Soutenez-nous en bas de page */}
        <div style={{ 
          position: 'fixed', 
          left: '50%', 
          transform: 'translateX(-50%)', 
          zIndex: 1000, 
          bottom: '2rem', 
          display: 'flex', 
          justifyContent: 'center'
        }}>
          <DonateButton />
        </div>
      </div>
    </div>
  )
}
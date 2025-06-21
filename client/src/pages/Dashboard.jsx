import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { api } from '../utils/api'
import '../styles/style-liste-accueil.css';
import React from 'react';
import { Navigate } from 'react-router-dom';
import LogoutButton from '../components/LogoutButton';

import { 
  PlusIcon, 
  TrashIcon, 
  EyeIcon,
  ShareIcon,
  CalendarIcon,
  ShoppingCartIcon,
  DocumentTextIcon,
  XMarkIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

export default function Dashboard({ isAuthenticated, onLogout, premierChargement, setPremierChargement }) {
  const [listes, setListes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [nouvelleListe, setNouvelleListe] = useState({
    nom: '',
    description: ''
  })
  const [showModal, setShowModal] = useState(false)
  const [creationLoading, setCreationLoading] = useState(false)
  const [filtreActif, setFiltreActif] = useState('toutes') // toutes, recentes, partagees
  const [recherche, setRecherche] = useState('')
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false); // Ajoute cette ligne pour éviter le chargement infini
      return;
    }
    if (premierChargement) {
      chargerListes(true);
      setPremierChargement(false);
    } else {
      chargerListes(false);
    }
  }, [isAuthenticated]);

  const chargerListes = async (afficherToast = false) => {
    try {
      setLoading(true)
      setError('')
      const response = await api.obtenirListes()
      setListes(response.data || [])
      if (afficherToast) toast.success('Listes chargées !')
    } catch (err) {
      if (err.response?.status === 401 && onLogout) {
        onLogout();
        return;
      }
      const errorMessage = 'Erreur lors du chargement des listes';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Erreur chargement listes:', err);
    } finally {
      setLoading(false)
    }
  }

  const creerNouvelleListe = async (e) => {
    e.preventDefault()
    
    if (!nouvelleListe.nom.trim()) {
      toast.error('Le nom de la liste est requis')
      return
    }

    try {
      setCreationLoading(true)
      const listeData = {
        nom: nouvelleListe.nom.trim(),
        description: nouvelleListe.description.trim(),
        articles: [],
        dateCreation: new Date().toISOString(),
        dateModification: new Date().toISOString()
      }
      
      await api.creerListe(listeData)
      setShowModal(false)
      setNouvelleListe({ nom: '', description: '' })
      await chargerListes()
      toast.success('Liste créée avec succès !')
    } catch (err) {
      const errorMessage = 'Erreur lors de la création de la liste'
      setError(errorMessage)
      toast.error(errorMessage)
      console.error('Erreur création liste:', err)
    } finally {
      setCreationLoading(false)
    }
  }

  const supprimerListe = async (id, nom) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer la liste "${nom}" ?`)) {
      return
    }

    try {
      await api.supprimerListe(id)
      await chargerListes()
      toast.success('Liste supprimée !')
    } catch (err) {
      const errorMessage = 'Erreur lors de la suppression de la liste'
      toast.error(errorMessage)
      console.error('Erreur suppression liste:', err)
    }
  }

  const dupliquerListe = async (liste) => {
    try {
      const nouvelleListeData = {
        nom: `${liste.nom} (Copie)`,
        description: liste.description,
        articles: liste.articles.map(article => ({
          ...article,
          id: Date.now() + Math.random(),
          checked: false
        })),
        dateCreation: new Date().toISOString(),
        dateModification: new Date().toISOString()
      }
      
      await api.sauvegarderListe(nouvelleListeData)
      await chargerListes()
      toast.success('Liste dupliquée !')
    } catch (err) {
      toast.error('Erreur lors de la duplication')
      console.error('Erreur duplication:', err)
    }
  }

  // Filtrage et recherche
  const listesFiltrees = listes.filter(liste => {
    // Filtre par recherche
    const correspondRecherche = liste.nom.toLowerCase().includes(recherche.toLowerCase()) ||
                               (liste.description && liste.description.toLowerCase().includes(recherche.toLowerCase()))
    
    if (!correspondRecherche) return false

    // Filtre par catégorie
    switch (filtreActif) {
      case 'recentes':
        const uneSemaineEnMs = 7 * 24 * 60 * 60 * 1000
        const dateCreation = new Date(liste.dateCreation || Date.now())
        return Date.now() - dateCreation.getTime() < uneSemaineEnMs
      case 'partagees':
        return liste.estPartagee || false
      default:
        return true
    }
  })

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

  // Loading skeleton
  if (loading) {
    return (
      <div className="p-4" style={{ backgroundColor: 'var(--primary-color)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="loading-skeleton" style={{ height: '3rem', marginBottom: '2rem' }}></div>
          <div className="listes-grid">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card">
                <div className="loading-skeleton" style={{ height: '1.5rem', marginBottom: '1rem' }}></div>
                <div className="loading-skeleton" style={{ height: '1rem', marginBottom: '0.5rem' }}></div>
                <div className="loading-skeleton" style={{ height: '1rem' }}></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="btn-logout-dashboard">
        <LogoutButton />
      </div>
      <div className="p-4" style={{ backgroundColor: 'var(--primary-color)' }}>
        <div className="max-w-6xl mx-auto">
          
          {/* Header */}
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

            {/* Barre de recherche et filtres */}
            <div className="card mb-6">
              <div className="flex flex-col md:flex-row gap-4 items-center">
                {/* Recherche */}
                <div className="flex-1 ">
                  <input
                    type="text"
                    placeholder="Rechercher une liste..."
                    value={recherche}
                    onChange={(e) => setRecherche(e.target.value)}
                    className="input"
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
                    <CalendarIcon className="w-4 h-4 inline mr-1" />
                    Récentes
                  </button>
                  <button
                    onClick={() => setFiltreActif('partagees')}
                    className={filtreActif === 'partagees' ? 'btn-primary' : 'btn-secondary'}
                  >
                    <ShareIcon className="w-4 h-4 inline mr-1" />
                    Partagées
                  </button>
                </div>

                {/* Bouton nouvelle liste */}
                <button
                  onClick={() => setShowModal(true)}
                  className="btn-primary"
                >
                  <PlusIcon className="w-5 h-5 inline mr-2" />
                  Nouvelle Liste
                </button>
              </div>
            </div>
          </div>

          {/* Message d'erreur */}
          {error && (
            <div className="form-error p-4 rounded-lg mb-6 text-center" style={{ 
              backgroundColor: 'rgba(191, 97, 106, 0.1)',
              border: '1px solid var(--accent-color)'
            }}>
              {error}
              <button
                onClick={chargerListes}
                className="btn-secondary ml-4"
              >
                Réessayer
              </button>
            </div>
          )}

          {/* Grille des listes */}
          {listesFiltrees.length === 0 ? (
            <div className="card text-center py-16">
              <div className="text-6xl mb-6">📝</div>
              {recherche ? (
                <>
                  <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--secondary-color)' }}>
                    Aucune liste trouvée
                  </h3>
                  <p className="mb-6" style={{ color: 'rgba(236, 239, 244, 0.7)' }}>
                    Aucune liste ne correspond à votre recherche "{recherche}"
                  </p>
                  <button
                    onClick={() => setRecherche('')}
                    className="btn-secondary"
                  >
                    Effacer la recherche
                  </button>
                </>
              ) : (
                <>
                  <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--secondary-color)' }}>
                    Aucune liste pour le moment
                  </h3>
                  <p className="mb-6" style={{ color: 'rgba(236, 239, 244, 0.7)' }}>
                    Créez votre première liste de courses pour commencer
                  </p>
                  <button
                    onClick={() => setShowModal(true)}
                    className="btn-primary"
                  >
                    <PlusIcon className="w-5 h-5 inline mr-2" />
                    Créer ma première liste
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="listes-grid">
              {listesFiltrees.map((liste) => {
                const progression = calculerProgression(liste.articles)
                const nbArticles = liste.articles?.length || 0
                const nbArticlesCoches = liste.articles?.filter(a => a.checked).length || 0

                return (
                  <div key={liste.id} className="liste-card group">
                    {/* Header de la carte */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="liste-card-title group-hover:text-accent-color transition-colors">
                          {liste.nom}
                        </h3>
                        {liste.description && (
                          <p className="text-sm" style={{ color: 'rgba(236, 239, 244, 0.6)' }}>
                            {liste.description}
                          </p>
                        )}
                      </div>
                      
                      {liste.estPartagee && (
                        <div className="badge-primary">
                          <ShareIcon className="w-3 h-3 inline mr-1" />
                          Partagée
                        </div>
                      )}
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

                      {/* Barre de progression */}
                      {nbArticles > 0 && (
                        <div className="mb-4">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs" style={{ color: 'var(--secondary-color)' }}>
                              Progression
                            </span>
                            <span className="text-xs font-medium" style={{ color: 'var(--secondary-color)' }}>
                              {nbArticlesCoches}/{nbArticles} ({progression}%)
                            </span>
                          </div>
                          <div className="w-full rounded-full h-2" style={{ backgroundColor: 'var(--primary-color)' }}>
                            <div
                              className="h-2 rounded-full transition-all duration-300"
                              style={{
                                width: `${progression}%`,
                                backgroundColor: progression === 100 ? 'var(--success-color)' : 'var(--secondary-color)'
                              }}
                            ></div>
                          </div>
                        </div>
                      )}

                      {progression === 100 && nbArticles > 0 && (
                        <div className="flex items-center mb-3 text-sm" style={{ color: 'var(--success-color)' }}>
                          <CheckCircleIcon className="w-4 h-4 mr-2" />
                          Liste terminée !
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-4">
                      <Link
                        to={`/liste/${liste.id}`}
                        className="btn-primary flex-1 text-center"
                      >
                        <EyeIcon className="w-4 h-4 inline mr-2" />
                        Ouvrir
                      </Link>
                      
                      <button
                        onClick={() => dupliquerListe(liste)}
                        className="btn-secondary"
                        title="Dupliquer"
                      >
                        <DocumentTextIcon className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => supprimerListe(liste.id, liste.nom)}
                        className="btn-danger"
                        title="Supprimer"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
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
                    <PlusIcon className="w-6 h-6 inline mr-2" />
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
                <form onSubmit={creerNouvelleListe} className="space-y-6">
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
                      className="input"
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
                      className="input resize-none"
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
                          <PlusIcon className="w-4 h-4 inline mr-2" />
                          Créer la liste
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
        {/* Bouton Soutenez-nous en bas de page */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem', marginBottom: '1rem' }}>
          <button
            onClick={() => navigate('/donations', { state: { via: 'ListeAccueil' } })}
            className="btn-primary"
          >
            Soutenez-nous
          </button>
        </div>
      </div>
    </>
  )
}

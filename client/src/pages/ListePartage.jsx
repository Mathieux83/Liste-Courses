import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { api } from '../utils/api'
import '../styles/style-liste-partage.css'
import { 
  EyeIcon,
  ShareIcon,
  CheckCircleIcon,
  XCircleIcon,
  CalendarIcon,
  DocumentTextIcon,
  HomeIcon,
  ExclamationTriangleIcon,
  ClockIcon
} from '@heroicons/react/24/solid'
import NProgress from 'nprogress';
import { BouttonAccueil } from '../components/BouttonAccueil'

export default function ListePartage() {
  const { token } = useParams()
  console.log('Token récupéré via useParams :', token)
  const [liste, setListe] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [updateLoading, setUpdateLoading] = useState(false)

  useEffect(() => {
    chargerListePartagee()
  }, [token])

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

  const chargerListePartagee = async () => {
    try {
      setLoading(true)
      setError(null)
      const listeData = await api.obtenirListePartagee(token)
      setListe(listeData)
      toast.success('Liste partagée chargée !')
    } catch (error) {
      const errorMessage = error.response?.status === 404 
        ? 'Cette liste partagée n\'existe pas ou a été supprimée'
        : error.response?.status === 403
        ? 'Vous n\'avez pas accès à cette liste'
        : 'Impossible de charger la liste partagée'
      
      setError(errorMessage)
      toast.error(errorMessage)
      console.error('Erreur chargement liste partagée:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleArticle = async (articleId) => {
    if (updateLoading) return

    try {
      setUpdateLoading(true)
      let newChecked = false;
      setListe(prevListe => {
        const updatedArticles = prevListe.articles.map(article => {
          if (article.id === articleId) {
            newChecked = !article.checked;
            return { ...article, checked: newChecked, dateModification: new Date().toISOString() };
          }
          return article;
        });
        return {
          ...prevListe,
          articles: updatedArticles,
          dateModification: new Date().toISOString()
        };
      })

      // Synchronisation avec le serveur
      await api.mettreAJourArticlePartage(token, articleId, newChecked)
      toast.success('Article mis à jour !')
      
    } catch (error) {
      // Reverser la mise à jour optimiste en cas d'erreur
      setListe(prevListe => ({
        ...prevListe,
        articles: prevListe.articles.map(article =>
          article.id === articleId
            ? { ...article, checked: !article.checked }
            : article
        )
      }))
      
      toast.error('Erreur lors de la mise à jour')
      console.error('Erreur toggle article:', error)
    } finally {
      setUpdateLoading(false)
    }
  }

  const calculerTotal = () => {
    if (!liste || !liste.articles) return 0
    return liste.articles.reduce((total, article) => total + (article.montant || 0), 0)
  }

  const calculerProgression = () => {
    if (!liste || !liste.articles || liste.articles.length === 0) return 0
    const articlesCoches = liste.articles.filter(article => article.checked).length
    return Math.round((articlesCoches / liste.articles.length) * 100)
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
  if (loading) {
    return null;
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

  const articlesNonCoches = liste.articles.filter(article => !article.checked)
  const articlesCoches = liste.articles.filter(article => article.checked)
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
                  {liste.articles.length} article{liste.articles.length > 1 ? 's' : ''}
                </span>
              </div>
              
              <div className="flex items-center">
                <CalendarIcon className="w-5 h-5 mr-2" style={{ color: 'var(--secondary-color)' }} />
                <span style={{ color: 'rgba(236, 239, 244, 0.7)' }}>
                  Modifiée le {formaterDate(liste.dateModification)}
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
            {liste.articles.length > 0 && (
              <div className="mt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium" style={{ color: 'var(--secondary-color)' }}>
                    Progression de la liste
                  </span>
                  <span className="text-sm font-semibold" style={{ color: 'var(--secondary-color)' }}>
                    {articlesCoches.length}/{liste.articles.length} ({progression}%)
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
          {liste.articles.length === 0 ? (
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
                    {articlesNonCoches.map((article) => (
                      <div key={article.id} className="liste-item">
                        <div className="flex items-center w-full">
                          <div style={{ width: '40px', display: 'flex', justifyContent: 'start' }}>
                            <input
                              type="checkbox"
                              checked={article.checked}
                              onChange={() => toggleArticle(article.id)}
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
                    {articlesCoches.map((article) => (
                      <div key={article.id} className="liste-item liste-item-checked">
                        <div className="flex items-center w-full">
                          <div style={{ width: '40px', display: 'flex', justifyContent: 'start' }}>
                            <input
                              type="checkbox"
                              checked={article.checked}
                              onChange={() => toggleArticle(article.id)}
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
                      {liste.articles.length} article{liste.articles.length > 1 ? 's' : ''} au total
                      {articlesCoches.length > 0 && ` • ${articlesCoches.length} acheté${articlesCoches.length > 1 ? 's' : ''}`}
                    </div>
                  </div>
                  
                  {progression > 0 && (
                    <div className={progression === 100 ? 'badge-success' : 'badge-primary'} style={{ padding: '0.5rem', borderRadius: '0.5rem'}}>                      {progression}% terminé
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

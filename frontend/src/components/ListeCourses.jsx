import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import ModalPartage from './ModalPartage'
import { api } from '../utils/api'
import { exporterPDF, capturerEcran, imprimerListe } from '../utils/exportUtils'
import { PlusIcon, TrashIcon, ShareIcon, PrinterIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline'
import '../styles/style-liste-courses.css'

const ListeCourses = () => {
  const { id } = useParams()
  const [articles, setArticles] = useState([])
  const [nouvelArticle, setNouvelArticle] = useState({
    nom: '',
    montant: '',
    checked: false
  })
  const [modalPartageOuvert, setModalPartageOuvert] = useState(false)
  const [nomListe, setNomListe] = useState('Ma Liste de Courses')
  const [listeId, setListeId] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    chargerListe()
    // eslint-disable-next-line
  }, [id])

  const chargerListe = async () => {
    try {
      setLoading(true)
      let liste
      if (id) {
        liste = await api.obtenirListeParId(id)
      } else {
        liste = await api.obtenirListe()
      }
      if (liste) {
        setArticles(liste.articles || [])
        setNomListe(liste.nom || 'Ma Liste de Courses')
        setListeId(liste.id)
      }
    } catch (error) {
      console.error('Erreur lors du chargement:', error)
      toast.error('Erreur lors du chargement de la liste')
    } finally {
      setLoading(false)
    }
  }

  const sauvegarderListe = async () => {
    try {
      const listeData = {
        id: listeId,
        nom: nomListe,
        articles: articles
      }
      const liste = await api.sauvegarderListe(listeData)
      setListeId(liste.id)
      toast.success('Liste sauvegardée !')
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde')
      console.error('Erreur sauvegarde:', error)
    }
  }

  const ajouterArticle = () => {
    if (nouvelArticle.nom.trim() === '') {
      toast.error('Veuillez saisir un nom d\'article')
      return
    }

    const article = {
      id: Date.now(),
      nom: nouvelArticle.nom.trim(),
      montant: parseFloat(nouvelArticle.montant) || 0,
      checked: false,
      dateAjout: new Date().toISOString()
    }

    setArticles([...articles, article])
    setNouvelArticle({ nom: '', montant: '', checked: false })
    toast.success('Article ajouté !')
  }

  const supprimerArticle = (id) => {
    setArticles(articles.filter(article => article.id !== id))
    toast.success('Article supprimé !')
  }

  const toggleArticle = (id) => {
    setArticles(articles.map(article =>
      article.id === id
        ? { ...article, checked: !article.checked }
        : article
    ))
  }

  const calculerTotal = () => {
    return articles.reduce((total, article) => total + article.montant, 0)
  }

  const viderListe = () => {
    if (window.confirm('Êtes-vous sûr de vouloir vider la liste ?')) {
      setArticles([])
      toast.success('Liste vidée !')
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      ajouterArticle()
    }
  }

  const articlesNonCoches = articles.filter(article => !article.checked)
  const articlesCoches = articles.filter(article => article.checked)

  if (loading) {
    return (
      <div className="liste-container">
        <div className="card">
          <div className="loading-skeleton" style={{ height: '2rem', marginBottom: '1rem' }}></div>
          <div className="loading-skeleton" style={{ height: '1rem', marginBottom: '0.5rem' }}></div>
          <div className="loading-skeleton" style={{ height: '1rem' }}></div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="liste-container">
        {/* Header avec titre et actions */}
        <div className="liste-header">
          <input
            type="text"
            value={nomListe}
            onChange={(e) => setNomListe(e.target.value)}
            className="liste-title input"
            style={{ 
              fontSize: '2rem', 
              fontWeight: '700', 
              textAlign: 'center',
              background: 'transparent',
              border: 'none',
              color: 'var(--secondary-color)'
            }}
          />
          
          {/* Boutons d'actions */}
          <div className="flex justify-center gap-3 mt-4 flex-wrap">
            <button
              onClick={() => setModalPartageOuvert(true)}
              className="btn-primary"
              disabled={!listeId}
            >
              <ShareIcon className="w-5 h-5 inline mr-2" />
              Partager
            </button>
            
            <button
              onClick={() => exporterPDF(articles, nomListe)}
              className="btn-secondary"
            >
              <DocumentArrowDownIcon className="w-5 h-5 inline mr-2" />
              Exporter PDF
            </button>
            
            <button
              onClick={() => imprimerListe(articles, nomListe)}
              className="btn-secondary"
            >
              <PrinterIcon className="w-5 h-5 inline mr-2" />
              Imprimer
            </button>
          </div>
        </div>

        {/* Formulaire d'ajout */}
        <div className="add-item-form">
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--secondary-color)' }}>
            Ajouter un article
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                className="input"
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
                className="input"
              />
            </div>
          </div>
          
          <div className="flex gap-3 mt-4">
            <button
              onClick={ajouterArticle}
              className="btn-primary flex-1"
            >
              <PlusIcon className="w-5 h-5 inline mr-2" />
              Ajouter
            </button>
            
            <button
              onClick={sauvegarderListe}
              className="btn-secondary"
            >
              Sauvegarder
            </button>
            
            {articles.length > 0 && (
              <button
                onClick={viderListe}
                className="btn-danger"
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
                <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--secondary-color)' }}>
                  À acheter ({articlesNonCoches.length})
                </h3>
                
                <div className="space-y-2">
                  {articlesNonCoches.map((article) => (
                    <div
                      key={article.id}
                      className="liste-item"
                    >
                      <div className="flex items-center space-x-3 flex-1">
                        <input
                          type="checkbox"
                          checked={article.checked}
                          onChange={() => toggleArticle(article.id)}
                          className="w-5 h-5 rounded border-2 border-secondary-color focus:ring-2 focus:ring-accent-color"
                        />
                        
                        <div className="flex-1">
                          <span className="liste-item-text font-medium">
                            {article.nom}
                          </span>
                          {article.montant > 0 && (
                            <span className="text-sm ml-2" style={{ color: 'var(--accent-color)' }}>
                              {article.montant.toFixed(2)} €
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <button
                        onClick={() => supprimerArticle(article.id)}
                        className="delete-btn ml-3"
                        title="Supprimer"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
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
                    <div
                      key={article.id}
                      className="liste-item liste-item-checked"
                    >
                      <div className="flex items-center space-x-3 flex-1">
                        <input
                          type="checkbox"
                          checked={article.checked}
                          onChange={() => toggleArticle(article.id)}
                          className="w-5 h-5 rounded border-2"
                        />
                        
                        <div className="flex-1">
                          <span className="liste-item-text">
                            {article.nom}
                          </span>
                          {article.montant > 0 && (
                            <span className="text-sm ml-2">
                              {article.montant.toFixed(2)} €
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <button
                        onClick={() => supprimerArticle(article.id)}
                        className="delete-btn ml-3"
                        title="Supprimer"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
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
                    Total: {calculerTotal().toFixed(2)} €
                  </span>
                  <div className="text-sm mt-1" style={{ color: 'rgba(236, 239, 244, 0.7)' }}>
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

        {/* Modal de partage */}
        {modalPartageOuvert && (
          <ModalPartage
            listeId={listeId}
            nomListe={nomListe}
            onClose={() => setModalPartageOuvert(false)}
          />
        )}
      </div>
    </>
  )
}

export default ListeCourses

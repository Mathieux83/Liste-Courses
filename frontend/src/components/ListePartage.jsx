import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { api } from '../utils/api'

const ListePartagee = () => {
  const { token } = useParams()
  const [liste, setListe] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    chargerListePartagee()
  }, [token])

  const chargerListePartagee = async () => {
    try {
      setLoading(true)
      const listeData = await api.obtenirListePartagee(token)
      setListe(listeData)
    } catch (error) {
      setError('Impossible de charger la liste partagée')
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleArticle = (articleId) => {
    setListe(prevListe => ({
      ...prevListe,
      articles: prevListe.articles.map(article =>
        article.id === articleId
          ? { ...article, checked: !article.checked }
          : article
      )
    }))
    toast.success('Article mis à jour !')
  }

  const calculerTotal = () => {
    if (!liste || !liste.articles) return 0
    return liste.articles.reduce((total, article) => total + article.montant, 0)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de la liste...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Erreur</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        {/* Header d'information */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-t-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-2xl">📋</span>
            </div>
            <div className="ml-3">
              <p className="text-yellow-800 font-medium">
                Vue en lecture seule
              </p>
              <p className="text-yellow-700 text-sm">
                Vous pouvez cocher les éléments mais pas modifier la liste
              </p>
            </div>
          </div>
        </div>

        {/* Contenu de la liste */}
        <div className="p-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">
            {liste.nom}
          </h1>

          {/* Articles */}
          {liste.articles && liste.articles.length > 0 ? (
            <div className="space-y-2 mb-6">
              {liste.articles.map((article) => (
                <div
                  key={article.id}
                  className={`flex items-center justify-between p-4 rounded-lg border transition-all duration-200 ${
                    article.checked 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-center space-x-4 flex-1">
                    <input
                      type="checkbox"
                      checked={article.checked}
                      onChange={() => toggleArticle(article.id)}
                      className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500 focus:ring-2"
                    />
                    <span className={`text-lg ${
                      article.checked 
                        ? 'line-through text-gray-500' 
                        : 'text-gray-800'
                    }`}>
                      {article.nom}
                    </span>
                  </div>
                  
                  <span className={`font-semibold ${
                    article.checked ? 'text-gray-500' : 'text-primary-600'
                  }`}>
                    {article.montant.toFixed(2)}€
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🛒</div>
              <p className="text-xl text-gray-500">Liste vide</p>
            </div>
          )}

          {/* Total */}
          {liste.articles && liste.articles.length > 0 && (
            <div className="p-4 bg-primary-50 rounded-lg border-2 border-primary-200">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-primary-800">
                  Total approximatif:
                </span>
                <span className="text-2xl font-bold text-primary-600">
                  {calculerTotal().toFixed(2)}€
                </span>
              </div>
              <div className="mt-2 text-sm text-primary-700">
                Articles cochés: {liste.articles.filter(a => a.checked).reduce((total, article) => total + article.montant, 0).toFixed(2)}€
              </div>
            </div>
          )}

          {/* Info de partage */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 text-center">
              Cette liste a été partagée avec vous • Dernière mise à jour: {new Date(liste.dateModification || Date.now()).toLocaleDateString('fr-FR')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ListePartagee

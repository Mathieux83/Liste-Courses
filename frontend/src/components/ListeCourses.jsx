import React, { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import ModalPartage from './ModalPartage'
import { api } from '../utils/api'
import { exporterPDF, capturerEcran, imprimerListe } from '../utils/exportUtils'

const ListeCourses = () => {
  const [articles, setArticles] = useState([])
  const [nouvelArticle, setNouvelArticle] = useState({
    nom: '',
    montant: '',
    checked: false
  })
  const [modalPartageOuvert, setModalPartageOuvert] = useState(false)
  const [nomListe, setNomListe] = useState('Ma Liste de Courses')
  const [listeId, setListeId] = useState(null)

  useEffect(() => {
    chargerListe()
  }, [])

  const chargerListe = async () => {
    try {
      const liste = await api.obtenirListe()
      if (liste) {
        setArticles(liste.articles || [])
        setNomListe(liste.nom || 'Ma Liste de Courses')
        setListeId(liste.id)
      }
    } catch (error) {
      console.error('Erreur lors du chargement:', error)
    }
  }

  const sauvegarderListe = async () => {
    try {
      const listeData = {
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

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg" id="liste-courses">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-start mb-4">
            <input
              type="text"
              value={nomListe}
              onChange={(e) => setNomListe(e.target.value)}
              className="text-3xl font-bold text-gray-800 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-primary-500 rounded px-2"
              placeholder="Nom de la liste"
            />
            <div className="flex space-x-2 no-print">
              <button
                onClick={() => setModalPartageOuvert(true)}
                className="btn-primary flex items-center space-x-2"
                disabled={!listeId}
              >
                <span>📤</span>
                <span>Partager</span>
              </button>
              <button
                onClick={() => exporterPDF(articles, nomListe)}
                className="btn-warning flex items-center space-x-2"
              >
                <span>📄</span>
                <span>PDF</span>
              </button>
              <button
                onClick={() => capturerEcran('liste-courses', nomListe)}
                className="btn-success flex items-center space-x-2"
              >
                <span>📸</span>
                <span>Capture</span>
              </button>
              <button
                onClick={imprimerListe}
                className="btn-secondary flex items-center space-x-2"
              >
                <span>🖨️</span>
                <span>Imprimer</span>
              </button>
            </div>
          </div>

          {/* Formulaire d'ajout */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex space-x-4">
              <input
                type="text"
                placeholder="Nom de l'article"
                className="input-field flex-1"
                value={nouvelArticle.nom}
                onChange={(e) => setNouvelArticle({...nouvelArticle, nom: e.target.value})}
                onKeyPress={handleKeyPress}
              />
              <input
                type="number"
                placeholder="Prix approximatif (€)"
                className="input-field w-40"
                value={nouvelArticle.montant}
                onChange={(e) => setNouvelArticle({...nouvelArticle, montant: e.target.value})}
                onKeyPress={handleKeyPress}
                step="0.01"
                min="0"
              />
              <button
                onClick={ajouterArticle}
                className="btn-primary"
              >
                Ajouter
              </button>
            </div>
          </div>

          {/* Actions rapides */}
          <div className="flex justify-between items-center mt-4 no-print">
            <div className="flex space-x-2">
              <button
                onClick={sauvegarderListe}
                className="btn-success"
              >
                💾 Sauvegarder
              </button>
              <button
                onClick={viderListe}
                className="btn-danger"
                disabled={articles.length === 0}
              >
                🗑️ Vider
              </button>
            </div>
            <div className="text-sm text-gray-600">
              {articles.length} article{articles.length > 1 ? 's' : ''} • {articles.filter(a => a.checked).length} coché{articles.filter(a => a.checked).length > 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Liste des articles */}
        <div className="p-6">
          {articles.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🛒</div>
              <p className="text-xl text-gray-500 mb-2">Votre liste est vide</p>
              <p className="text-gray-400">Ajoutez des articles pour commencer</p>
            </div>
          ) : (
            <div className="space-y-2">
              {articles.map((article) => (
                <div
                  key={article.id}
                  className={`liste-item flex items-center justify-between p-4 rounded-lg border transition-all duration-200 ${
                    article.checked 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-4 flex-1">
                    <input
                      type="checkbox"
                      checked={article.checked}
                      onChange={() => toggleArticle(article.id)}
                      className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500 focus:ring-2"
                    />
                    <div className="flex-1">
                      <span className={`text-lg ${
                        article.checked 
                          ? 'line-through text-gray-500' 
                          : 'text-gray-800'
                      }`}>
                        {article.nom}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <span className={`font-semibold ${
                      article.checked ? 'text-gray-500' : 'text-primary-600'
                    }`}>
                      {article.montant.toFixed(2)}€
                    </span>
                    <button
                      onClick={() => supprimerArticle(article.id)}
                      className="text-red-500 hover:text-red-700 transition-colors p-1 no-print"
                      title="Supprimer l'article"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Total */}
          {articles.length > 0 && (
            <div className="liste-total mt-6 p-4 bg-primary-50 rounded-lg border-2 border-primary-200">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-primary-800">
                  Total approximatif:
                </span>
                <span className="text-2xl font-bold text-primary-600">
                  {calculerTotal().toFixed(2)}€
                </span>
              </div>
              <div className="mt-2 text-sm text-primary-700">
                Articles cochés: {articles.filter(a => a.checked).reduce((total, article) => total + article.montant, 0).toFixed(2)}€
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de partage */}
      {modalPartageOuvert && (
        <ModalPartage
          listeId={listeId}
          nomListe={nomListe}
          onClose={() => setModalPartageOuvert(false)}
        />
      )}
    </div>
  )
}

export default ListeCourses

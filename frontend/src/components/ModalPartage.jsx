import React, { useState } from 'react'
import { toast } from 'react-hot-toast'
import { api } from '../utils/api'

const ModalPartage = ({ listeId, nomListe, onClose }) => {
  const [lienPartage, setLienPartage] = useState('')
  const [loading, setLoading] = useState(false)

  const genererLienPartage = async () => {
    try {
      setLoading(true)
      const token = await api.genererTokenPartage(listeId)
      const lien = `${window.location.origin}/liste-partagee/${token}`
      setLienPartage(lien)
      toast.success('Lien de partage généré !')
    } catch (error) {
      toast.error('Erreur lors de la génération du lien')
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const copierLien = () => {
    navigator.clipboard.writeText(lienPartage)
    toast.success('Lien copié dans le presse-papiers !')
  }

  const partagerViaEmail = () => {
    const subject = encodeURIComponent(`Liste de courses: ${nomListe}`)
    const body = encodeURIComponent(`Voici ma liste de courses à consulter:\n\n${lienPartage}`)
    window.open(`mailto:?subject=${subject}&body=${body}`)
  }

  const partagerViaWhatsApp = () => {
    const text = encodeURIComponent(`Voici ma liste de courses: ${nomListe}\n${lienPartage}`)
    window.open(`https://wa.me/?text=${text}`)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">Partager la liste</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            {/* Génération du lien */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lien de partage
              </label>
              {!lienPartage ? (
                <button
                  onClick={genererLienPartage}
                  disabled={loading}
                  className="w-full btn-primary flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Génération...</span>
                    </>
                  ) : (
                    <>
                      <span>🔗</span>
                      <span>Générer le lien</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="space-y-2">
                  <div className="flex">
                    <input
                      type="text"
                      value={lienPartage}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg bg-gray-50 text-sm"
                    />
                    <button
                      onClick={copierLien}
                      className="px-4 py-2 bg-primary-500 text-white rounded-r-lg hover:bg-primary-600 transition-colors"
                    >
                      📋
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Ce lien permet de consulter et cocher les éléments de votre liste
                  </p>
                </div>
              )}
            </div>

            {/* Options de partage */}
            {lienPartage && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Partager via
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={partagerViaEmail}
                    className="btn-secondary flex items-center justify-center space-x-2"
                  >
                    <span>📧</span>
                    <span>Email</span>
                  </button>
                  <button
                    onClick={partagerViaWhatsApp}
                    className="btn-success flex items-center justify-center space-x-2"
                  >
                    <span>💬</span>
                    <span>WhatsApp</span>
                  </button>
                </div>
              </div>
            )}

            {/* Information */}
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>ℹ️ Information:</strong> Les personnes avec le lien pourront voir votre liste et cocher les éléments, mais ne pourront pas la modifier.
              </p>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="btn-secondary"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ModalPartage

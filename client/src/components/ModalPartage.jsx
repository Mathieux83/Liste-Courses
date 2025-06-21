import React, { useState } from 'react'
import { toast } from 'react-hot-toast'
import { api } from '../utils/api'
import '../styles/style-modal-partage.css'
import { 
  XMarkIcon, 
  LinkIcon, 
  EnvelopeIcon, 
  ChatBubbleLeftRightIcon,
  ClipboardDocumentIcon 
} from '@heroicons/react/24/outline'

const ModalPartage = ({ listeId, nomListe, onClose }) => {
  const [lienPartage, setLienPartage] = useState('')
  const [loading, setLoading] = useState(false)
  const [lienGenere, setLienGenere] = useState(false)

  const genererLienPartage = async () => {
    try {
      setLoading(true)
      const token = await api.genererTokenPartage(listeId)
      const lien = `${window.location.origin}/liste-partagee/${token}`
      setLienPartage(lien)
      setLienGenere(true)
      toast.success('Lien de partage généré !')
    } catch (error) {
      toast.error('Erreur lors de la génération du lien')
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const copierLien = async () => {
    try {
      await navigator.clipboard.writeText(lienPartage)
      toast.success('Lien copié dans le presse-papiers !')
    } catch (error) {
      // Fallback pour les navigateurs qui ne supportent pas clipboard API
      const textArea = document.createElement('textarea')
      textArea.value = lienPartage
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      toast.success('Lien copié !')
    }
  }

  const partagerViaEmail = () => {
    const subject = encodeURIComponent(`Liste de courses: ${nomListe}`)
    const body = encodeURIComponent(
      `Salut !\n\nJe partage avec toi ma liste de courses "${nomListe}".\n\nTu peux la consulter et cocher les éléments via ce lien :\n${lienPartage}\n\nBonne journée !`
    )
    window.open(`mailto:?subject=${subject}&body=${body}`)
  }

  const partagerViaWhatsApp = () => {
    const text = encodeURIComponent(
      `📝 Liste de courses: *${nomListe}*\n\nRegarde ma liste et coche les éléments au fur et à mesure :\n${lienPartage}`
    )
    window.open(`https://wa.me/?text=${text}`)
  }

  const partagerViaTelegram = () => {
    const text = encodeURIComponent(
      `📝 Liste de courses: ${nomListe}\n\n${lienPartage}`
    )
    window.open(`https://t.me/share/url?url=${lienPartage}&text=${text}`)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="modal-title">
            Partager "{nomListe}"
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            style={{ color: 'var(--secondary-color)' }}
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Description */}
        <div className="mb-6 p-4 rounded-lg" style={{ 
          backgroundColor: 'var(--primary-color)', 
          border: '1px solid var(--secondary-color)' 
        }}>
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-1">
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ 
                backgroundColor: 'var(--secondary-color)' 
              }}>
                <LinkIcon className="w-4 h-4" style={{ color: 'var(--primary-color)' }} />
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2" style={{ color: 'var(--secondary-color)' }}>
                Comment ça marche ?
              </h3>
              <p className="text-sm" style={{ color: 'rgba(236, 239, 244, 0.8)' }}>
                Ce lien permet de consulter et cocher les éléments de votre liste. 
                Les personnes avec le lien pourront voir votre liste et cocher les éléments, 
                mais ne pourront pas la modifier.
              </p>
            </div>
          </div>
        </div>

        {/* Génération du lien */}
        {!lienGenere ? (
          <div className="text-center">
            <button
              onClick={genererLienPartage}
              disabled={loading}
              className="btn-primary"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white inline-block mr-2"></div>
                  Génération...
                </>
              ) : (
                <>
                  <LinkIcon className="w-5 h-5 inline mr-2" />
                  Générer le lien de partage
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Lien généré */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--secondary-color)' }}>
                Lien de partage :
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={lienPartage}
                  readOnly
                  className="share-link-input flex-1"
                />
                <button
                  onClick={copierLien}
                  className="btn-secondary"
                  title="Copier le lien"
                >
                  <ClipboardDocumentIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Boutons de partage */}
            <div>
              <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--secondary-color)' }}>
                Partager via :
              </h3>
              <div className="share-buttons">
                <button
                  onClick={partagerViaEmail}
                  className="share-btn"
                  style={{ backgroundColor: 'var(--secondary-dark)' }}
                >
                  <EnvelopeIcon className="w-5 h-5 inline mr-2" />
                  Email
                </button>
                
                <button
                  onClick={partagerViaWhatsApp}
                  className="share-btn"
                  style={{ backgroundColor: '#25D366' }}
                >
                  <ChatBubbleLeftRightIcon className="w-5 h-5 inline mr-2" />
                  WhatsApp
                </button>
                
                <button
                  onClick={partagerViaTelegram}
                  className="share-btn"
                  style={{ backgroundColor: '#0088cc' }}
                >
                  <ChatBubbleLeftRightIcon className="w-5 h-5 inline mr-2" />
                  Telegram
                </button>
              </div>
            </div>

            {/* Informations supplémentaires */}
            <div className="text-xs p-3 rounded-lg" style={{ 
              backgroundColor: 'rgba(136, 192, 208, 0.1)', 
              color: 'rgba(236, 239, 244, 0.7)' 
            }}>
              <p className="mb-1">
                <strong>ℹ️ Information:</strong> Les personnes avec le lien pourront voir votre liste 
                et cocher les éléments, mais ne pourront pas la modifier.
              </p>
              <p>
                Le lien reste actif tant que vous ne supprimez pas la liste.
              </p>
            </div>
          </div>
        )}

        {/* Actions du modal */}
        <div className="flex justify-end mt-6 pt-4 border-t" style={{ borderColor: 'var(--secondary-color)' }}>
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}

export default ModalPartage

import React, { useState, useEffect } from 'react'
import { api } from '../utils/api'
import { 
  MapPinIcon, 
  TruckIcon, 
  XMarkIcon, 
  CheckCircleIcon,
  ClockIcon,
  CurrencyEuroIcon 
} from '@heroicons/react/24/outline'

export default function DeliveryOptions({ liste, onClose }) {
  const [postalCode, setPostalCode] = useState('')
  const [services, setServices] = useState([])
  const [selectedService, setSelectedService] = useState(null)
  const [selectedStore, setSelectedStore] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [orderCreated, setOrderCreated] = useState(false)

  // Services de livraison mockés pour la démo
  const mockServices = [
    {
      id: 1,
      name: 'Carrefour Drive',
      price: 0,
      deliveryTime: '2-4h',
      description: 'Retrait gratuit en magasin',
      logo: '🛒',
      stores: [
        { id: 1, name: 'Carrefour Trans-en-Provence', address: '123 Route de Draguignan' },
        { id: 2, name: 'Carrefour Les Arcs', address: '456 Avenue de la Gare' }
      ]
    },
    {
      id: 2,
      name: 'Uber Eats',
      price: 2.99,
      deliveryTime: '30-45min',
      description: 'Livraison rapide à domicile',
      logo: '🚗',
      stores: [
        { id: 3, name: 'Monoprix Centre-ville', address: '789 Place de la Mairie' }
      ]
    },
    {
      id: 3,
      name: 'Deliveroo',
      price: 3.49,
      deliveryTime: '25-40min',
      description: 'Livraison express',
      logo: '🏍️',
      stores: [
        { id: 4, name: 'Casino Proximité', address: '321 Rue des Oliviers' }
      ]
    }
  ]

  // Charger les services disponibles
  const loadServices = async () => {
    try {
      setLoading(true)
      setError('')
      
      // Simulation d'un appel API
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      if (postalCode === '83720') { // Code postal de Trans-en-Provence
        setServices(mockServices)
      } else {
        setServices(mockServices.slice(1)) // Moins de services pour d'autres codes postaux
      }
    } catch (err) {
      setError('Impossible de charger les services de livraison')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Créer une commande
  const createOrder = async (e) => {
    e.preventDefault()
    
    if (!selectedService || !selectedStore) {
      setError('Veuillez sélectionner un service et un magasin')
      return
    }

    try {
      setLoading(true)
      setError('')
      
      // Simulation d'un appel API
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setOrderCreated(true)
    } catch (err) {
      setError('Erreur lors de la création de la commande')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (postalCode.length === 5) {
      loadServices()
    } else {
      setServices([])
      setSelectedService(null)
      setSelectedStore(null)
    }
  }, [postalCode])

  // Vue de confirmation de commande
  if (orderCreated) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" 
                 style={{ backgroundColor: 'var(--success-color)' }}>
              <CheckCircleIcon className="w-8 h-8 text-white" />
            </div>
            
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--success-color)' }}>
              Commande créée !
            </h2>
            
            <p className="mb-6" style={{ color: 'rgba(236, 239, 244, 0.8)' }}>
              Votre commande a été transmise à <strong>{selectedService?.name}</strong>.
              <br />
              Vous recevrez des notifications sur l'état de votre commande.
            </p>
            
            <div className="card mb-6">
              <div className="text-left">
                <h3 className="font-semibold mb-2" style={{ color: 'var(--secondary-color)' }}>
                  Détails de la commande :
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Service :</span>
                    <span>{selectedService?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Magasin :</span>
                    <span>{selectedStore?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Frais de livraison :</span>
                    <span>{selectedService?.price === 0 ? 'Gratuit' : `${selectedService?.price}€`}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Délai estimé :</span>
                    <span>{selectedService?.deliveryTime}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <button onClick={onClose} className="btn-primary">
              Fermer
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="modal-title">
            <TruckIcon className="w-6 h-6 inline mr-2" />
            Options de livraison
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            style={{ color: 'var(--secondary-color)' }}
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Formulaire de code postal */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--secondary-color)' }}>
            <MapPinIcon className="w-4 h-4 inline mr-1" />
            Code postal de livraison :
          </label>
          <input
            type="text"
            placeholder="Ex: 83720"
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
            className="input"
            maxLength={5}
          />
          <p className="text-xs mt-1" style={{ color: 'rgba(236, 239, 244, 0.6)' }}>
            Saisissez votre code postal pour voir les services disponibles
          </p>
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="form-error mb-4 p-3 rounded-lg" style={{ 
            backgroundColor: 'rgba(191, 97, 106, 0.1)',
            border: '1px solid var(--accent-color)'
          }}>
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && postalCode.length === 5 && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4" 
                 style={{ borderColor: 'var(--secondary-color)' }}></div>
            <p style={{ color: 'var(--secondary-color)' }}>
              Recherche des services disponibles...
            </p>
          </div>
        )}

        {/* Services disponibles */}
        {services.length > 0 && !loading && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold" style={{ color: 'var(--secondary-color)' }}>
              Services disponibles ({services.length})
            </h3>
            
            <div className="space-y-3">
              {services.map((service) => (
                <div
                  key={service.id}
                  className={`delivery-card ${selectedService?.id === service.id ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedService(service)
                    setSelectedStore(null)
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="text-2xl">{service.logo}</div>
                      <div>
                        <h4 className="delivery-service-name">
                          {service.name}
                        </h4>
                        <p className="text-sm mb-2" style={{ color: 'rgba(236, 239, 244, 0.7)' }}>
                          {service.description}
                        </p>
                        <div className="flex items-center space-x-4 text-sm">
                          <span className="flex items-center">
                            <ClockIcon className="w-4 h-4 mr-1" style={{ color: 'var(--secondary-color)' }} />
                            {service.deliveryTime}
                          </span>
                          <span className="delivery-service-price flex items-center">
                            <CurrencyEuroIcon className="w-4 h-4 mr-1" />
                            {service.price === 0 ? 'Gratuit' : `${service.price}€`}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {selectedService?.id === service.id && (
                      <CheckCircleIcon className="w-6 h-6" style={{ color: 'var(--accent-color)' }} />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Sélection du magasin */}
            {selectedService && (
              <div className="space-y-3">
                <h4 className="font-medium" style={{ color: 'var(--secondary-color)' }}>
                  Choisir un magasin :
                </h4>
                
                <div className="space-y-2">
                  {selectedService.stores.map((store) => (
                    <div
                      key={store.id}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedStore?.id === store.id 
                          ? 'border-accent-color bg-accent-color bg-opacity-10' 
                          : 'border-secondary-color hover:border-accent-color'
                      }`}
                      style={{
                        backgroundColor: selectedStore?.id === store.id 
                          ? 'rgba(191, 97, 106, 0.1)' 
                          : 'var(--primary-light)',
                        borderColor: selectedStore?.id === store.id 
                          ? 'var(--accent-color)' 
                          : 'var(--secondary-color)'
                      }}
                      onClick={() => setSelectedStore(store)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-medium" style={{ color: 'var(--secondary-color)' }}>
                            {store.name}
                          </h5>
                          <p className="text-sm" style={{ color: 'rgba(236, 239, 244, 0.7)' }}>
                            {store.address}
                          </p>
                        </div>
                        
                        {selectedStore?.id === store.id && (
                          <CheckCircleIcon className="w-5 h-5" style={{ color: 'var(--accent-color)' }} />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bouton de commande */}
            {selectedService && selectedStore && (
              <div className="border-t pt-6" style={{ borderColor: 'var(--secondary-color)' }}>
                <button
                  onClick={createOrder}
                  disabled={loading}
                  className="btn-primary w-full"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white inline-block mr-2"></div>
                      Création de la commande...
                    </>
                  ) : (
                    <>
                      <TruckIcon className="w-5 h-5 inline mr-2" />
                      Commander via {selectedService.name}
                      {selectedService.price > 0 && ` (${selectedService.price}€)`}
                    </>
                  )}
                </button>
                
                <p className="text-xs text-center mt-2" style={{ color: 'rgba(236, 239, 244, 0.6)' }}>
                  Vous serez redirigé vers la plateforme du service pour finaliser votre commande
                </p>
              </div>
            )}
          </div>
        )}

        {/* Message si aucun service */}
        {postalCode.length === 5 && services.length === 0 && !loading && (
          <div className="text-center py-8">
            <TruckIcon className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--secondary-color)' }} />
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--secondary-color)' }}>
              Aucun service disponible
            </h3>
            <p style={{ color: 'rgba(236, 239, 244, 0.7)' }}>
              Désolé, aucun service de livraison n'est disponible pour le code postal {postalCode}.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

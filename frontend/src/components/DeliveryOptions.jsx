import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { MapPinIcon, TruckIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function DeliveryOptions({ liste, onClose }) {
  const [postalCode, setPostalCode] = useState('');
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedStore, setSelectedStore] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [orderCreated, setOrderCreated] = useState(false);

  // Charger les services disponibles
  const loadServices = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get(`/delivery/services?postalCode=${postalCode}`);
      setServices(response.data);
    } catch (err) {
      setError('Impossible de charger les services de livraison');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Créer une commande
  const createOrder = async (e) => {
    e.preventDefault();
    if (!selectedService || !selectedStore) {
      setError('Veuillez sélectionner un service et un magasin');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await api.post('/delivery/orders', {
        listeId: liste.id,
        serviceId: selectedService.id,
        store: selectedStore
      });
      setOrderCreated(true);
    } catch (err) {
      setError('Erreur lors de la création de la commande');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (postalCode.length === 5) {
      loadServices();
    }
  }, [postalCode]);

  if (orderCreated) {
    return (
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <TruckIcon className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Commande créée avec succès!</h3>
            <p className="mt-2 text-sm text-gray-500">
              Vous recevrez des notifications sur l'état de votre commande.
            </p>
            <button
              onClick={onClose}
              className="mt-4 w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Options de livraison</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <XMarkIcon className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={createOrder}>
          <div className="space-y-4">
            <div>
              <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700">
                Code postal
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="postalCode"
                  id="postalCode"
                  pattern="[0-9]{5}"
                  required
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="75001"
                />
              </div>
            </div>

            {services.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Services disponibles
                </label>
                <div className="space-y-2">
                  {services.map((service) => (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => setSelectedService(service)}
                      className={`w-full px-4 py-2 border rounded-md text-left flex items-center ${
                        selectedService?.id === service.id
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <TruckIcon className="h-5 w-5 mr-2 text-gray-400" />
                      {service.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedService && (
              <div>
                <label htmlFor="store" className="block text-sm font-medium text-gray-700">
                  Point de retrait
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="store"
                    id="store"
                    required
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    value={selectedStore || ''}
                    onChange={(e) => setSelectedStore(e.target.value)}
                    placeholder="Adresse du magasin"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !selectedService || !selectedStore}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Création de la commande...' : 'Commander'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

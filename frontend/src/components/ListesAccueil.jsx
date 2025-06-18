import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { Link } from 'react-router-dom';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

export default function ListesAccueil() {
  const [listes, setListes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [nouvelleListe, setNouvelleListe] = useState({
    nom: '',
    articles: []
  });
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    chargerListes();
  }, []);

  const chargerListes = async () => {
    try {
      const response = await api.obtenirListes();
      setListes(response.data);
      setError('');
    } catch (err) {
      setError('Erreur lors du chargement des listes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const creerNouvelleListe = async (e) => {
    e.preventDefault();
    try {
      await api.creerListe(nouvelleListe);
      setShowModal(false);
      setNouvelleListe({ nom: '', articles: [] });
      await chargerListes();
    } catch (err) {
      setError('Erreur lors de la création de la liste');
      console.error(err);
    }
  };

  const supprimerListe = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette liste ?')) {
      return;
    }
    try {
      await api.supprimerListe(id);
      await chargerListes();
    } catch (err) {
      setError('Erreur lors de la suppression de la liste');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Mes Listes de Courses</h1>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Nouvelle Liste
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-8">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {listes.map((liste) => (
          <div
            key={liste.id}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200"
          >
            <Link to={`/liste/${liste.id}`} className="block p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">{liste.nom}</h2>
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>{liste.articles.length} articles</span>
                <span>Modifiée le {new Date(liste.dateModification).toLocaleDateString()}</span>
              </div>
            </Link>
            <div className="px-6 py-4 bg-gray-50 border-t flex justify-between items-center">
              <span className="text-sm text-gray-500">
                {liste.estPrincipale ? 'Liste principale' : 'Liste secondaire'}
              </span>
              {!liste.estPrincipale && (
                <button
                  onClick={() => supprimerListe(liste.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal de création de liste */}
      {showModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={creerNouvelleListe}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="mb-4">
                    <label htmlFor="nom" className="block text-sm font-medium text-gray-700">
                      Nom de la liste
                    </label>
                    <input
                      type="text"
                      name="nom"
                      id="nom"
                      required
                      className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      value={nouvelleListe.nom}
                      onChange={(e) => setNouvelleListe({ ...nouvelleListe, nom: e.target.value })}
                    />
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Créer
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={() => setShowModal(false)}
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

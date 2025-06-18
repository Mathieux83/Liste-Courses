import React from 'react';
import { useOfflineStatus } from '../hooks/useOffline';

export default function OfflineStatus() {
  const { isOnline, isUpdateAvailable, updateApp } = useOfflineStatus();

  if (!isOnline) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-red-500 text-white p-4">
        <div className="container mx-auto text-center">
          <p className="font-medium">
            Vous êtes actuellement hors ligne. Certaines fonctionnalités peuvent être limitées.
          </p>
        </div>
      </div>
    );
  }

  if (isUpdateAvailable) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-indigo-600 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <p className="font-medium">
            Une nouvelle version est disponible !
          </p>
          <button
            onClick={updateApp}
            className="bg-white text-indigo-600 px-4 py-2 rounded-md font-medium hover:bg-indigo-50"
          >
            Mettre à jour
          </button>
        </div>
      </div>
    );
  }

  return null;
}

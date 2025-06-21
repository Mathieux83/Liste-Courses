import { useState, useEffect } from 'react';
import { Workbox } from 'workbox-window';

export function useOfflineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [wb, setWb] = useState(null);

  useEffect(() => {
    // Gestionnaires d'événements pour la connectivité
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Configuration du Service Worker
    if ('serviceWorker' in navigator) {
      const workbox = new Workbox('/service-worker.js');

      // Écouter les mises à jour
      workbox.addEventListener('waiting', () => {
        setIsUpdateAvailable(true);
      });

      // Enregistrer le service worker
      workbox.register();
      setWb(workbox);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fonction pour mettre à jour l'application
  const updateApp = async () => {
    if (wb) {
      wb.messageSkipWaiting();
      setIsUpdateAvailable(false);
      window.location.reload();
    }
  };

  return {
    isOnline,
    isUpdateAvailable,
    updateApp
  };
}

export function useServiceWorker() {
  const [registration, setRegistration] = useState(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready
        .then(reg => {
          setRegistration(reg);
        })
        .catch(error => {
          console.error('Erreur lors de l\'accès au Service Worker:', error);
        });
    }
  }, []);

  // Fonction pour demander la permission des notifications
  const requestNotificationPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch (error) {
      console.error('Erreur lors de la demande de permission:', error);
      return null;
    }
  };

  // Fonction pour s'abonner aux notifications push
  const subscribeToPush = async () => {
    try {
      const permission = await requestNotificationPermission();
      if (permission !== 'granted') {
        throw new Error('Permission des notifications refusée');
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.VITE_VAPID_PUBLIC_KEY
      });

      return subscription;
    } catch (error) {
      console.error('Erreur lors de l\'abonnement aux notifications:', error);
      return null;
    }
  };

  return {
    registration,
    requestNotificationPermission,
    subscribeToPush
  };
}

// SocketContext.jsx - Version simplifiée qui délègue à socketService
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { useSelector } from 'react-redux';
import { selectAuthState } from '../store/slices/authSlice';
import socketService from '../services/socketService';

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket doit être utilisé à l\'intérieur d\'un SocketProvider');
  }
  return context;
};

const SocketProvider = ({ 
  children, 
  onListeUpdate,
  currentListeId,
}) => {
  // Récupération de l'état d'authentification depuis Redux
  const authState = useSelector(selectAuthState);
  const [isConnected, setIsConnected] = useState(socketService.connected);
  const [connectionError, setConnectionError] = useState(null);
  
  // Mise à jour de l'état de connexion
  const updateConnectionStatus = useCallback(() => {
    setIsConnected(socketService.connected);
  }, []);
  
  // Gestion de la connexion/déconnexion basée sur l'état d'authentification
  useEffect(() => {
    const initSocket = async () => {
      if (!authState.isAuthenticated || !authState.token) {
        console.log('[SocketProvider] Déconnexion - Aucun token valide');
        if (socketService.connected) {
          await socketService.disconnect();
          updateConnectionStatus();
        }
        return;
      }

      try {
        const token = authState.token;
        console.log('[SocketProvider] Connexion avec le token:', token ? 'token valide' : 'pas de token');
        
        if (!token) {
          throw new Error('Aucun token disponible pour la connexion');
        }
        
        await socketService.connect(token);
        console.log('[SocketProvider] 🔌 Connecté via socketService');
        updateConnectionStatus();
        setConnectionError(null);
      } catch (error) {
        console.error('[SocketProvider] ❌ Erreur de connexion:', error);
        setConnectionError(error.message || 'Erreur de connexion');
        updateConnectionStatus();
      }
    };

    initSocket();

    return () => {
      // On ne déconnecte plus automatiquement pour permettre les reconnexions
      // La déconnexion est gérée par le service
    };
  }, [authState.isAuthenticated, authState.token]);

  // Gestion des événements socket
  useEffect(() => {
    if (!socketService.socket) return;

    const handleListeUpdate = (updatedListe) => {
      console.log('[SocketProvider] Liste mise à jour reçue:', updatedListe);
      if (onListeUpdate && typeof onListeUpdate === 'function') {
        onListeUpdate(updatedListe);
      }
    };

    const handleConnect = () => {
      console.log('[SocketProvider] Socket connectée');
      updateConnectionStatus();
      setConnectionError(null);
      
      // Si on a un currentListeId, on délègue la gestion à socketService
      if (currentListeId) {
        console.log(`[SocketProvider] Reconnexion, demande de rejoindre room: ${currentListeId}`);
        socketService.joinListeRoom(currentListeId).catch(console.error);
      }
    };

    const handleDisconnect = () => {
      console.log('[SocketProvider] Socket déconnectée');
      updateConnectionStatus();
    };

    const handleError = (error) => {
      console.error('[SocketProvider] Erreur socket:', error);
      setConnectionError(error.message || 'Erreur de connexion');
    };

    // S'abonner aux événements
    const unsubscribeListeUpdate = socketService.onListeUpdate(handleListeUpdate);
    const unsubscribeConnect = socketService.onConnect(handleConnect);
    const unsubscribeDisconnect = socketService.onDisconnect(handleDisconnect);
    const unsubscribeError = socketService.onError(handleError);

    // Gestion du changement de salle
    const handleRoomChange = async () => {
      if (!currentListeId) return;
      
      try {
        console.log(`[SocketProvider] Changement de salle demandé vers: ${currentListeId}`);
        await socketService.joinListeRoom(currentListeId);
        console.log(`[SocketProvider] Changement de salle réussi: ${currentListeId}`);
      } catch (error) {
        console.error(`[SocketProvider] Échec du changement de salle vers ${currentListeId}:`, error);
      }
    };

    // Si on a un currentListeId au montage, on rejoint la salle
    if (currentListeId) {
      handleRoomChange();
    }

    return () => {
      // Se désabonner des événements
      if (typeof unsubscribeListeUpdate === 'function') unsubscribeListeUpdate();
      if (typeof unsubscribeConnect === 'function') unsubscribeConnect();
      if (typeof unsubscribeDisconnect === 'function') unsubscribeDisconnect();
      if (typeof unsubscribeError === 'function') unsubscribeError();
    };
  }, [currentListeId, onListeUpdate]);

  // Gestion du changement de salle
  useEffect(() => {
    if (!currentListeId || !socketService.connected) return;
    
    console.log(`[SocketProvider] Demande de rejoindre la salle: ${currentListeId}`);
    
    socketService.joinListeRoom(currentListeId)
      .then(() => console.log(`[SocketProvider] Rejoint avec succès la salle: ${currentListeId}`))
      .catch(error => console.error(`[SocketProvider] Erreur en rejoignant la salle ${currentListeId}:`, error));
    
    return () => {
      if (currentListeId) {
        console.log(`[SocketProvider] Quitte la salle: ${currentListeId}`);
        socketService.leaveListeRoom(currentListeId).catch(console.error);
      }
    };
  }, [currentListeId]);

  // Méthodes exposées par le contexte
  const contextValue = {
    isConnected,
    connectionError,
    socket: socketService.socket,
    socketId: socketService.socketId,
    currentRoom: () => socketService.currentRoom,
    joinListeRoom: (listeId) => {
      if (!listeId) {
        const error = new Error('ID de liste invalide');
        console.error('[SocketContext] Erreur:', error.message);
        return Promise.reject(error);
      }
      
      console.log(`[SocketContext] Demande de rejoindre la salle: ${listeId}`);
      return socketService.joinListeRoom(listeId)
        .then(result => {
          console.log(`[SocketContext] Rejoint avec succès la salle: ${listeId}`);
          return result;
        })
        .catch(error => {
          console.error(`[SocketContext] Erreur en rejoignant la salle ${listeId}:`, error);
          throw error; // Propage l'erreur pour permettre la gestion en aval
        });
    },
    leaveListeRoom: (listeId) => {
      if (!listeId) {
        console.warn('[SocketContext] ID de liste invalide pour quitter la salle');
        return Promise.resolve();
      }
      
      console.log(`[SocketContext] Demande de quitter la salle: ${listeId}`);
      return socketService.leaveListeRoom(listeId)
        .then(() => console.log(`[SocketContext] A quitté la salle: ${listeId}`))
        .catch(error => {
          console.error(`[SocketContext] Erreur en quittant la salle ${listeId}:`, error);
          throw error; // Propage l'erreur pour permettre la gestion en aval
        });
    },
    on: (event, callback) => {
      if (typeof event !== 'string' || typeof callback !== 'function') {
        console.warn('[SocketContext] Paramètres invalides pour on()');
        return () => {};
      }
      console.log(`[SocketContext] Abonnement à l'événement: ${event}`);
      return socketService.on(event, callback);
    },
    off: (event, callback) => {
      if (typeof event !== 'string') {
        console.warn('[SocketContext] Événement invalide pour off()');
        return;
      }
      console.log(`[SocketContext] Désabonnement de l'événement: ${event}`);
    },
    
    // Émission d'événements
    emit: (event, data, callback) => {
      if (!isConnected) {
        console.warn(`[SocketContext] Tentative d'émission alors que non connecté (${event})`);
        return false;
      }
      return socketService.emit(event, data, callback);
    },
    
    // Reconnexion
    reconnect: async () => {
      if (!authState.isAuthenticated || !authState.token) {
        console.warn('[SocketContext] Impossible de se reconnecter: utilisateur non authentifié');
        return false;
      }
      
      try {
        console.log('[SocketContext] Tentative de reconnexion...');
        await socketService.disconnect();
        await socketService.connect(authState.token);
        updateConnectionStatus();
        
        // Rejoindre la room précédente si nécessaire
        if (currentListeId) {
          await socketService.joinListeRoom(currentListeId);
        }
        
        console.log('[SocketContext] Reconnexion réussie');
        return true;
      } catch (error) {
        console.error('[SocketContext] Échec de la reconnexion:', error);
        updateConnectionStatus();
        throw error;
      }
    },
    
    // Méthode spécifique pour les mises à jour de liste
    emitListeUpdate: (listeData) => {
      if (!isConnected) {
        const error = new Error('Non connecté au serveur');
        console.warn('[SocketContext]', error.message);
        return Promise.reject(error);
      }
      
      if (!listeData || !listeData.id) {
        const error = new Error('Données de liste invalides');
        console.error('[SocketContext]', error.message);
        return Promise.reject(error);
      }
      
      console.log('[SocketContext] Mise à jour de la liste:', listeData.id);
      return new Promise((resolve, reject) => {
        try {
          socketService.emit('update-liste', listeData, (response) => {
            if (response && response.error) {
              console.error('[SocketContext] Erreur lors de la mise à jour de la liste:', response.error);
              reject(new Error(response.error));
            } else {
              console.log('[SocketContext] Liste mise à jour avec succès:', listeData.id);
              resolve(response);
            }
          });
        } catch (error) {
          console.error('[SocketContext] Erreur lors de l\'émission de update-liste:', error);
          reject(error);
        }
      });
    },
  };

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};

export { SocketProvider };
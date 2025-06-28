import { io } from 'socket.io-client';

// Configuration des constantes
const SOCKET_SERVER_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3001';
const INITIAL_RECONNECT_DELAY = 2000; // 2s
const MAX_RECONNECT_ATTEMPTS = 10; // 10 tentatives
const CONNECTION_TIMEOUT = 30000; // 30 secondes pour la connexion
const ROOM_JOIN_TIMEOUT = 10000; // 10 secondes pour rejoindre une room
const MAX_PENDING_MESSAGES = 50;

/**
 * Service de gestion des sockets pour la communication en temps réel
 * Gère la connexion, la reconnexion et les salles de discussion
 */
class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = MAX_RECONNECT_ATTEMPTS;
    this.reconnectDelay = INITIAL_RECONNECT_DELAY;
    this.reconnectTimer = null;
    this.currentListeId = null;
    this.pendingMessages = [];
    this.eventListeners = new Map(); // Clé: nom d'événement, Valeur: tableau de callbacks
    this.connectionPromise = null;
    this.connectionResolve = null;
    this.connectionReject = null;
  }

  // ===== GESTION DE LA CONNEXION =====

  /**
   * Initialise la connexion Socket.IO
   * @param {string} authToken - Token d'authentification
   * @returns {Promise<void>}
   */
  async connect(authToken) {
    // Si déjà connecté, retourner une promesse résolue
    if (this.socket?.connected) {
      console.log('[SocketService] Déjà connecté au serveur');
      return Promise.resolve();
    }

    // Si une connexion est déjà en cours, retourner la promesse existante
    if (this.connectionPromise) {
      console.log('[SocketService] Connexion déjà en cours');
      return this.connectionPromise;
    }

    console.log('[SocketService] Tentative de connexion au serveur...');
    
    // Créer une nouvelle promesse pour la connexion
    this.connectionPromise = new Promise((resolve, reject) => {
      this.connectionResolve = resolve;
      this.connectionReject = reject;

      try {
        // Nettoyer l'ancienne connexion si elle existe
        if (this.socket) {
          this._cleanupSocket();
        }

        // Créer une nouvelle connexion
        this.socket = io(SOCKET_SERVER_URL, {
          auth: { token: authToken },
          reconnection: true,
          reconnectionAttempts: this.maxReconnectAttempts,
          reconnectionDelay: this.reconnectDelay,
          reconnectionDelayMax: 30000, // 30s max
          randomizationFactor: 0.5,
          timeout: CONNECTION_TIMEOUT,
          transports: ['websocket', 'polling']
        });

        // Configurer les écouteurs d'événements
        this._setupEventListeners();

        // Configurer le timeout de connexion
        const timeoutId = setTimeout(() => {
          if (!this.isConnected) {
            const error = new Error('Timeout de connexion dépassé');
            console.error('[SocketService]', error.message);
            this.connectionReject?.(error);
            this._cleanupConnection();
          }
        }, CONNECTION_TIMEOUT);

        // S'abonner aux événements de connexion (une seule fois)
        const onConnect = () => {
          clearTimeout(timeoutId);
          console.log('[SocketService] Connecté au serveur Socket.IO');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.reconnectDelay = INITIAL_RECONNECT_DELAY;
          this.connectionResolve?.();
          this._cleanupConnection();
          this._processPendingMessages();
        };

        const onConnectError = (error) => {
          clearTimeout(timeoutId);
          console.error('[SocketService] Erreur de connexion:', error.message);
          this.connectionReject?.(error);
          this._cleanupConnection();
        };

        this.socket.once('connect', onConnect);
        this.socket.once('connect_error', onConnectError);

      } catch (error) {
        console.error('[SocketService] Erreur lors de la connexion:', error);
        this.connectionReject?.(error);
        this._cleanupConnection();
      }
    });

    return this.connectionPromise;
  }

  /**
   * Déconnecte proprement la socket
   */
  disconnect() {
    console.log('[SocketService] Déconnexion demandée');
    
    // Nettoyer les timers
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    // Quitter la room actuelle
    if (this.currentListeId) {
      this.leaveListeRoom(this.currentListeId).catch(console.error);
    }
    
    // Nettoyer la socket
    this._cleanupSocket();
  }

  // ===== GESTION DES ÉVÉNEMENTS INTERNES =====

  /**
   * Configure les écouteurs d'événements de la socket
   * @private
   */
  _setupEventListeners() {
    if (!this.socket) return;

    // Réinitialiser les écouteurs pour éviter les doublons
    this.socket.off('connect');
    this.socket.off('disconnect');
    this.socket.off('connect_error');
    this.socket.off('reconnect_attempt');
    this.socket.off('reconnect_failed');
    this.socket.off('error');
    this.socket.off('reconnect');

    // Configurer les écouteurs
    this.socket.on('connect', () => this._handleConnect());
    this.socket.on('disconnect', (reason) => this._handleDisconnect(reason));
    this.socket.on('connect_error', (error) => this._handleConnectError(error));
    this.socket.on('reconnect_attempt', () => this._handleReconnectAttempt());
    this.socket.on('reconnect_failed', () => this._handleReconnectFailed());
    this.socket.on('error', (error) => this._handleError(error));
    this.socket.on('reconnect', (attempt) => this._handleReconnect(attempt));
  }

  /**
   * Gestion de la connexion réussie
   * @private
   */
  _handleConnect() {
    console.log('[SocketService] Connecté au serveur Socket.IO, socket ID:', this.socket?.id);
    this.isConnected = true;
    this.reconnectAttempts = 0;
    this.reconnectDelay = INITIAL_RECONNECT_DELAY;
    
    // Résoudre la promesse de connexion en cours si elle existe
    if (this.connectionResolve) {
      this.connectionResolve();
      this._cleanupConnection();
    }
    
    // Traiter les messages en attente
    this._processPendingMessages();
    
    // Émettre l'événement de connexion
    this._emitLocalEvent('connect');
  }

  /**
   * Gestion de la déconnexion
   * @private
   */
  _handleDisconnect(reason) {
    console.log(`[SocketService] Déconnecté du serveur. Raison: ${reason}`);
    this.isConnected = false;
    
    // Rejeter la promesse de connexion en cours si elle existe
    if (this.connectionReject) {
      const error = new Error(`Déconnecté: ${reason}`);
      this.connectionReject(error);
      this._cleanupConnection();
    }
    
    // Émettre l'événement de déconnexion
    this._emitLocalEvent('disconnect', { reason });
    
    // Si la déconnexion n'est pas intentionnelle, programmer une reconnexion
    if (reason !== 'io client disconnect') {
      this._scheduleReconnect();
    }
  }

  /**
   * Gestion des erreurs de connexion
   * @private
   */
  _handleConnectError(error) {
    console.error('[SocketService] Erreur de connexion:', error.message);
    
    if (this.connectionReject) {
      this.connectionReject(error);
      this._cleanupConnection();
    }
    
    this._emitLocalEvent('connect_error', error);
  }

  /**
   * Gestion des tentatives de reconnexion
   * @private
   */
  _handleReconnectAttempt() {
    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1), 30000);
    
    console.log(`[SocketService] Tentative de reconnexion ${this.reconnectAttempts}/${this.maxReconnectAttempts} dans ${delay}ms`);
    this._emitLocalEvent('reconnect_attempt', { 
      attempt: this.reconnectAttempts,
      delay: delay
    });
    
    this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, 30000);
  }

  /**
   * Gestion de l'échec de reconnexion
   * @private
   */
  _handleReconnectFailed() {
    console.error(`[SocketService] Échec de la reconnexion après ${this.reconnectAttempts} tentatives`);
    
    if (this.connectionReject) {
      const error = new Error(`Échec de la reconnexion après ${this.reconnectAttempts} tentatives`);
      this.connectionReject(error);
      this._cleanupConnection();
    }
    
    this._emitLocalEvent('reconnect_failed');
    
    // Réinitialiser les compteurs
    this.reconnectAttempts = 0;
    this.reconnectDelay = INITIAL_RECONNECT_DELAY;
  }

  /**
   * Gestion d'une reconnexion réussie
   * @private
   */
  _handleReconnect(attempt) {
    console.log(`[SocketService] Reconnexion réussie après ${attempt} tentatives, socket ID: ${this.socket?.id}`);
    this.isConnected = true;
    this.reconnectAttempts = 0;
    this.reconnectDelay = INITIAL_RECONNECT_DELAY;
    
    // Retenter de rejoindre la salle actuelle si nécessaire
    if (this.currentListeId) {
      console.log(`[SocketService] Reconnexion - Tentative de rejoindre la salle ${this.currentListeId}`);
      
      // Utiliser un délai pour s'assurer que la connexion est bien établie
      setTimeout(() => {
        this.joinListeRoom(this.currentListeId)
          .then(() => console.log(`[SocketService] Salle ${this.currentListeId} rejointe avec succès après reconnexion`))
          .catch(error => {
            console.error('[SocketService] Erreur lors de la reconnexion à la salle:', error);
            // Réessayer une fois après un court délai en cas d'échec
            setTimeout(() => {
              this.joinListeRoom(this.currentListeId)
                .then(() => console.log('[SocketService] Salle rejointe avec succès lors de la deuxième tentative'))
                .catch(err => console.error('[SocketService] Échec de la deuxième tentative de rejoindre la salle:', err));
            }, 1000);
          });
      }, 500); // Délai court pour s'assurer que la connexion est bien établie
    }
    
    this._processPendingMessages();
    this._emitLocalEvent('reconnect', { attempt });
  }

  /**
   * Gestion des erreurs générales
   * @private
   */
  _handleError(error) {
    console.error('[SocketService] Erreur:', error);
    this._emitLocalEvent('error', error);
  }

  /**
   * Planifie une tentative de reconnexion
   * @private
   */
  _scheduleReconnect() {
    // Nettoyer toute tentative de reconnexion précédente
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    // Vérifier si nous avons dépassé le nombre maximum de tentatives
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(`[SocketService] Nombre maximum de tentatives de reconnexion (${this.maxReconnectAttempts}) atteint`);
      this._handleReconnectFailed();
      return;
    }

    // Calculer le délai avec backoff exponentiel
    const delay = Math.min(
      INITIAL_RECONNECT_DELAY * Math.pow(1.5, this.reconnectAttempts - 1),
      30000 // Maximum 30 secondes
    );

    console.log(`[SocketService] Tentative de reconnexion dans ${delay}ms (${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
    
    // Planifier la prochaine tentative
    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      console.log(`[SocketService] Tentative de reconnexion ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      
      // Émettre un événement local
      this._emitLocalEvent('reconnect_attempt', {
        attempt: this.reconnectAttempts,
        maxAttempts: this.maxReconnectAttempts,
        nextDelay: Math.min(delay * 1.5, 30000)
      });
      
      // Tenter de se reconnecter
      if (this.socket) {
        this.socket.connect();
      }
    }, delay);
  }

  // ===== GESTION DES UTILITAIRES =====

  /**
   * Méthode utilitaire pour nettoyer les références de connexion
   * @private
   */
  _cleanupConnection() {
    this.connectionPromise = null;
    this.connectionResolve = null;
    this.connectionReject = null;
  }

  /**
   * Traite les messages en attente
   * @private
   */
  _processPendingMessages() {
    while (this.pendingMessages.length > 0) {
      const { event, data, options } = this.pendingMessages.shift();
      this.emit(event, data, options);
    }
  }

  /**
   * Méthode pour nettoyer la socket
   * @private
   */
  _cleanupSocket() {
    if (!this.socket) return;

    // Supprimer tous les écouteurs
    this.socket.off();
    
    // Déconnecter si connecté
    if (this.socket.connected) {
      this.socket.disconnect();
    }
    
    this.socket = null;
    this.isConnected = false;
  }

  // ===== GESTION DES IDENTIFIANTS =====

  /**
   * Normalise un ID de liste (gère à la fois les chaînes et les objets avec _id/id)
   * @private
   * @param {string|object} listeId - ID de la liste à normaliser
   * @returns {string|null} ID normalisé ou null si invalide
   */
  _normalizeListeId(listeId) {
    if (!listeId) return null;
    if (typeof listeId === 'string') return listeId.trim();
    if (typeof listeId === 'object' && listeId !== null) {
      const id = listeId.id || listeId._id;
      return id ? String(id).trim() : null;
    }
    return String(listeId).trim();
  }

  /**
   * Vérifie si deux IDs de liste sont identiques
   * @private
   * @param {string|object} id1 - Premier ID à comparer
   * @param {string|object} id2 - Deuxième ID à comparer
   * @returns {boolean} true si les IDs sont identiques
   */
  _isSameListeId(id1, id2) {
    if (!id1 || !id2) return false;
    const normId1 = this._normalizeListeId(id1);
    const normId2 = this._normalizeListeId(id2);
    return normId1 !== null && normId1 === normId2;
  }

  // ===== GESTION DES SALLES =====

  /**
   * Rejoint une salle spécifique (pour une liste partagée)
   * @param {string|object} listeId - ID de la liste ou objet contenant l'ID
   * @returns {Promise<{success: boolean, roomId: string, alreadyInRoom?: boolean}>}
   */
  async joinListeRoom(listeId) {
    const normalizedId = this._normalizeListeId(listeId);
    
    if (!normalizedId) {
      const error = new Error('ID de liste invalide pour rejoindre la room');
      console.warn(`[SocketService] ${error.message}`, listeId);
      throw error;
    }

    // Vérifier si on est déjà dans cette salle
    if (this._isSameListeId(this.currentListeId, normalizedId) && this.socket?.connected) {
      console.log(`[SocketService] Déjà dans la room ${normalizedId} et connecté`);
      return { success: true, roomId: normalizedId, alreadyInRoom: true };
    }

    const previousListeId = this.currentListeId;
    
    // Attendre que la connexion soit établie si nécessaire
    if (!this.socket || !this.socket.connected) {
      console.log(`[SocketService] Connexion non établie, attente pour rejoindre la room ${normalizedId}...`);
      
      try {
        await new Promise((resolve, reject) => {
          if (this.socket?.connected) return resolve();
          
          const timeout = setTimeout(() => {
            reject(new Error(`Timeout en attente de la connexion pour rejoindre la room ${normalizedId}`));
          }, CONNECTION_TIMEOUT);
          
          const onConnect = () => {
            clearTimeout(timeout);
            this.socket.off('connect', onConnect);
            this.socket.off('connect_error', onError);
            resolve();
          };
          
          const onError = (error) => {
            clearTimeout(timeout);
            this.socket.off('connect', onConnect);
            this.socket.off('connect_error', onError);
            reject(error);
          };
          
          this.socket?.on('connect', onConnect);
          this.socket?.on('connect_error', onError);
        });
      } catch (error) {
        console.error(`[SocketService] ${error.message}`);
        throw error;
      }
    }

    // Si on est déjà dans cette salle et connecté, ne rien faire
    if (this._isSameListeId(this.currentListeId, normalizedId) && this.socket.connected) {
      console.log(`[SocketService] Déjà dans la room ${normalizedId} et connecté (vérification finale)`);
      return { success: true, roomId: normalizedId, alreadyInRoom: true };
    }

    // Quitter l'ancienne room si nécessaire
    if (previousListeId && !this._isSameListeId(previousListeId, normalizedId)) {
      try {
        console.log(`[SocketService] Quitte l'ancienne room ${previousListeId} pour rejoindre ${normalizedId}`);
        await this.leaveListeRoom(previousListeId);
      } catch (error) {
        console.warn(`[SocketService] Erreur en quittant l'ancienne room ${previousListeId}:`, error.message);
      }
    }

    // Mettre à jour l'ID actuel avant la tentative de rejoindre
    this.currentListeId = normalizedId;
    
    console.log(`[SocketService] Tentative de rejoindre la room: ${normalizedId}`);
    
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        const error = new Error('Socket non initialisée');
        this.currentListeId = previousListeId;
        return reject(error);
      }

      const timeout = setTimeout(() => {
        this.currentListeId = previousListeId;
        const error = new Error(`Timeout lors de la tentative de rejoindre la room ${normalizedId}`);
        console.warn(`[SocketService] ${error.message}`);
        reject(error);
      }, ROOM_JOIN_TIMEOUT);

      this.socket.emit('join-liste', normalizedId, (response) => {
        clearTimeout(timeout);
        
        if (response?.error) {
          this.currentListeId = previousListeId;
          console.error(`[SocketService] Erreur du serveur en rejoignant la room ${normalizedId}:`, response.error);
          reject(new Error(response.error));
        } else {
          console.log(`[SocketService] A bien rejoint la room ${normalizedId}`);
          resolve({ success: true, roomId: normalizedId });
        }
      });
    });
  }

  /**
   * Quitte une salle spécifique
   * @param {string|object} listeId - ID de la liste ou objet contenant l'ID
   * @returns {Promise<void>}
   */
  async leaveListeRoom(listeId) {
    const normalizedId = this._normalizeListeId(listeId);
    
    if (!normalizedId) {
      console.warn('[SocketService] ID de liste invalide pour quitter la room');
      return;
    }
    
    console.log(`[SocketService] Quitte la room: ${normalizedId}`);
    
    // Si on quitte la room actuelle, mettre à jour l'ID
    if (this._isSameListeId(this.currentListeId, normalizedId)) {
      this.currentListeId = null;
    }
    
    if (!this.socket || !this.socket.connected) {
      console.warn('[SocketService] Impossible de quitter la room: socket non connectée');
      return;
    }
    
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        console.warn(`[SocketService] Timeout en quittant la room ${normalizedId}`);
        resolve();
      }, ROOM_JOIN_TIMEOUT);
      
      this.socket.emit('leave-liste', normalizedId, (response) => {
        clearTimeout(timeout);
        if (response?.error) {
          console.error(`[SocketService] Erreur du serveur en quittant la room ${normalizedId}:`, response.error);
        } else {
          console.log(`[SocketService] A bien quitté la room ${normalizedId}`);
        }
        resolve();
      });
    });
  }

  // ===== GESTION DES ÉVÉNEMENTS PUBLICS =====

  /**
   * Écoute les mises à jour d'une liste
   * @param {Function} callback - Fonction à appeler lors des mises à jour
   * @returns {Function} Fonction pour se désabonner
   */
  onListeUpdate(callback) {
    return this.on('liste-updated', callback);
  }

  /**
   * Écoute les erreurs
   * @param {Function} callback - Fonction à appeler lors des erreurs
   * @returns {Function} Fonction pour se désabonner
   */
  onError(callback) {
    return this.on('error', callback);
  }

  /**
   * Écoute les événements de connexion
   * @param {Function} callback - Fonction à appeler lors de la connexion
   * @returns {Function} Fonction pour se désabonner
   */
  onConnect(callback) {
    return this.on('connect', callback);
  }

  /**
   * Écoute les événements de déconnexion
   * @param {Function} callback - Fonction à appeler lors de la déconnexion
   * @returns {Function} Fonction pour se désabonner
   */
  onDisconnect(callback) {
    return this.on('disconnect', callback);
  }

  /**
   * S'abonne à un événement
   * @param {string} event - Nom de l'événement
   * @param {Function} callback - Fonction à appeler lors de la réception
   * @returns {Function} Fonction pour se désabonner
   */
  on(event, callback) {
    if (typeof event !== 'string' || typeof callback !== 'function') {
      console.warn('[SocketService] Paramètres invalides pour on()');
      return () => {};
    }

    // Initialiser le tableau des callbacks pour cet événement si nécessaire
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }

    const callbacks = this.eventListeners.get(event);
    
    // Éviter les doublons
    if (!callbacks.includes(callback)) {
      callbacks.push(callback);
      
      // Ajouter l'écouteur à la socket si elle existe
      if (this.socket) {
        this.socket.on(event, callback);
      }
    }

    // Retourner une fonction pour se désabonner
    return () => this.off(event, callback);
  }

  /**
   * Se désabonne d'un événement
   * @param {string} event - Nom de l'événement
   * @param {Function} [callback] - Fonction à désabonner (si non fourni, désabonne tous les callbacks)
   */
  off(event, callback) {
    if (!this.eventListeners.has(event)) {
      return;
    }

    const callbacks = this.eventListeners.get(event);
    
    if (typeof callback === 'function') {
      // Supprimer un callback spécifique
      const index = callbacks.indexOf(callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
        this.socket?.off(event, callback);
      }
    } else {
      // Supprimer tous les callbacks pour cet événement
      for (const cb of callbacks) {
        this.socket?.off(event, cb);
      }
      this.eventListeners.delete(event);
    }
  }

  /**
   * Émet un événement vers le serveur
   * @param {string} event - Nom de l'événement
   * @param {*} data - Données à envoyer
   * @param {Object} [options] - Options (ex: callback)
   * @returns {boolean} true si l'événement a été émis, false s'il a été mis en attente
   */
  emit(event, data = {}, options = {}) {
    // Si la socket n'est pas connectée, mettre en file d'attente
    if (!this.socket || !this.isConnected) {
      console.log(`[SocketService] Socket non connectée, mise en attente de l'événement: ${event}`, data);
      this._addPendingMessage(event, data, options);
      return false;
    }

    try {
      if (options.callback && typeof options.callback === 'function') {
        this.socket.emit(event, data, options.callback);
      } else {
        this.socket.emit(event, data);
      }
      return true;
    } catch (error) {
      console.error(`[SocketService] Erreur lors de l'émission de l'événement ${event}:`, error);
      return false;
    }
  }

  /**
   * Émet un événement local aux écouteurs enregistrés
   * @private
   * @param {string} event - Nom de l'événement
   * @param {*} data - Données à envoyer
   */
  _emitLocalEvent(event, data = {}) {
    if (this.eventListeners.has(event)) {
      const callbacks = [...this.eventListeners.get(event)];
      
      for (const callback of callbacks) {
        try {
          callback(data);
        } catch (error) {
          console.error(`[SocketService] Erreur dans le callback pour l'événement ${event}:`, error);
        }
      }
    }
  }

  /**
   * Ajoute un message à la file d'attente
   * @private
   */
  _addPendingMessage(event, data, options = {}) {
    this.pendingMessages.push({ event, data, options });
    
    // Limiter la taille de la file d'attente
    if (this.pendingMessages.length > MAX_PENDING_MESSAGES) {
      console.warn(`[SocketService] File d'attente pleine, suppression des anciens messages`);
      this.pendingMessages = this.pendingMessages.slice(-MAX_PENDING_MESSAGES);
    }
    
    return this.pendingMessages.length;
  }

  // ===== GETTERS =====

  /**
   * Retourne le statut de connexion
   * @returns {boolean}
   */
  get connected() {
    return this.socket?.connected ?? false;
  }

  /**
   * Retourne l'ID de la socket
   * @returns {string|null}
   */
  get socketId() {
    return this.socket?.id || null;
  }

  /**
   * Retourne l'ID de la liste actuelle
   * @returns {string|null}
   */
  get currentRoom() {
    return this.currentListeId;
  }

  getCurrentRoom() {
    return this.currentListeId;
  }

  /**
   * Retourne le nombre de messages en attente
   * @returns {number}
   */
  get pendingMessagesCount() {
    return this.pendingMessages.length;
  }
}

// Export d'une instance singleton
export default new SocketService();
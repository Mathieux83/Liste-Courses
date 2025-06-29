import { Server } from 'socket.io';
import { socketLogger } from './services/logger.js';
import User from './models/User.js';

let io;

export const initializeSocketIO = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST']
    },
    // Configuration des timeouts côté serveur
    pingTimeout: 120000,   // Augmenté à 120 secondes (2 minutes)
    pingInterval: 25000,   // 25 secondes
    connectTimeout: 60000, // Augmenté à 60 secondes pour la connexion initiale
    maxHttpBufferSize: 1e8, // Augmenter la taille maximale des messages (100MB)
    transports: ['websocket', 'polling'],
    allowEIO3: true,
    cookie: false,
    serveClient: false,
    allowUpgrades: true,
    perMessageDeflate: {
      threshold: 1024, // Seuil de compression en octets
      zlibDeflateOptions: {
        level: 9 // Niveau de compression maximum
      }
    }
  });

  // Middleware d'authentification
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      // console.warn(`[SOCKET] Tentative de connexion sans token: ${socket.id}`);
      socketLogger.warn(`[SOCKET] Tentative de connexion sans token: ${socket.id}`);
      return next(new Error('Authentification requise'));
    }
    
    // Vérifier le token ici si nécessaire
    // Par exemple : const user = verifyToken(token);
    // if (!user) return next(new Error('Token invalide'));
    
    socket.user = { id: token.userId };
    next();
  });

  io.on('connection', async (socket) => {
    const clientIp = socket.handshake.address;
    let username = 'inconnu'; // Nom par défaut

    if (socket.user && socket.user.id) {
      try {
        const user = await User.findById(socket.user.id).select('name');
        if (user) {
          username = user.name;
        }
      } catch (error) {
        socketLogger.error(`[SOCKET] Erreur lors de la récupération du nom d'utilisateur pour le socket ${socket.id}`, {
          timestamp: new Date().toISOString(),
          error: error.message,
          stack: error.stack
        });
      }
    }

    socketLogger.info(`Nouvelle connexion Socket.IO: ${socket.id} (${username}) depuis ${clientIp}`, {
      timestamp: new Date().toISOString(),
    });
    
    // Suivre l'état de la connexion
    let isDisconnecting = false;
    
    // Gestion des erreurs de la socket
    socket.on('error', (error) => {
      // console.error(`[SOCKET] Erreur sur la socket ${socket.id}:`, error);
      socketLogger.error(`[SOCKET] Erreur sur la socket ${socket.id}`, {
        timestamp: new Date().toISOString(),
        error: error.message,
        stack: error.stack
      });
    });

    // Rejoindre la salle de l'utilisateur avec callback
    socket.on('join-user', (userId, callback) => {
      try {
        if (!userId) {
          const error = 'ID utilisateur manquant';
          console.warn(`[SOCKET] ${error} pour socket ${socket.id}`);
          socketLogger.warn(`[SOCKET] ${error} pour socket ${socket.id}`, {
            timestamp: new Date().toISOString(),
            socketId: socket.id
          });
          return callback?.({ error });
        }
        
        const roomName = `user-${userId}`;
        
        // Quitter les anciennes rooms utilisateur
        Array.from(socket.rooms)
          .filter(room => room.startsWith('user-') && room !== roomName)
          .forEach(room => {
            socket.leave(room);
            // console.log(`[SOCKET] Socket ${socket.id} a quitté l'ancienne room utilisateur ${room}`);
            socketLogger.info(`[SOCKET] Socket ${socket.id} a quitté l'ancienne room utilisateur ${room}`, {
              timestamp: new Date().toISOString(),
              socketId: socket.id,
              room
            });
          });
        
        socket.join(roomName);
        console.log(`[SOCKET] Socket ${socket.id} a rejoint la room utilisateur ${roomName}`);
        socketLogger.info(`[SOCKET] Socket ${socket.id} a rejoint la room utilisateur ${roomName}`, {
          timestamp: new Date().toISOString(),
          socketId: socket.id,
          room: roomName
        });
        
        // Confirmer au client que l'opération a réussi
        callback?.({ success: true, roomId: roomName });
      } catch (error) {
        console.error(`[SOCKET] Erreur join-user pour ${userId}:`, error);
        socketLogger.error(`[SOCKET] Erreur join-user pour ${userId}`, {
          timestamp: new Date().toISOString(),
          socketId: socket.id,
          error: error.message,
          stack: error.stack
        });
        callback?.({ error: error.message });
      }
    });

    // Rejoindre la salle d'une liste avec callback
    socket.on('join-liste', (listeId, callback) => {
      try {
        if (!listeId) {
          const error = 'ID de liste manquant';
          console.warn(`[SOCKET] ${error} pour socket ${socket.id}`);
          socketLogger.warn(`[SOCKET] ${error} pour socket ${socket.id}`, {
            timestamp: new Date().toISOString(),
            socketId: socket.id
          });
          return callback?.({ error });
        }

        const roomName = `liste-${listeId}`;
        
        // Obtenir les rooms actuelles du socket
        const currentRooms = Array.from(socket.rooms);
        console.log(`[SOCKET] Socket ${socket.id} rooms actuelles:`, currentRooms);
        socketLogger.info(`[SOCKET] Socket ${socket.id} rooms actuelles`, {
          timestamp: new Date().toISOString(),
          socketId: socket.id,
          rooms: currentRooms
        });
        
        // Quitter toutes les rooms de liste précédentes
        currentRooms.forEach(room => {
          if (room.startsWith('liste-') && room !== roomName) {
            socket.leave(room);
            console.log(`[SOCKET] Socket ${socket.id} a quitté l'ancienne room ${room}`);
            socketLogger.info(`[SOCKET] Socket ${socket.id} a quitté l'ancienne room ${room}`, {
              timestamp: new Date().toISOString(),
              socketId: socket.id,
              room
            });
          }
        });
        
        // Rejoindre la nouvelle room
        socket.join(roomName);
        console.log(`[SOCKET] join-liste: socket ${socket.id} rejoint la room ${roomName} avec l'id de liste ${listeId}`);
        socketLogger.info(`[SOCKET] join-liste: socket ${socket.id} rejoint la room ${roomName}`, {
          timestamp: new Date().toISOString(),
          socketId: socket.id,
          listeId
        });
        
        // Confirmer au client que l'opération a réussi
        callback?.({ success: true, roomId: roomName, listeId });
        
        // Notifier les autres clients de la room qu'un nouvel utilisateur a rejoint
        socket.to(roomName).emit('user-joined-liste', {
          socketId: socket.id,
          listeId,
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        console.error(`[SOCKET] Erreur join-liste pour ${listeId}:`, error);
        socketLogger.error(`[SOCKET] Erreur join-liste pour ${listeId}`, {
          timestamp: new Date().toISOString(),
          socketId: socket.id,
          error: error.message,
          stack: error.stack
        });
        callback?.({ error: error.message });
      }
    });

    // Quitter la salle d'une liste avec callback
    socket.on('leave-liste', (listeId, callback) => {
      try {
        if (!listeId) {
          const error = 'ID de liste manquant';
          console.warn(`[SOCKET] ${error} pour socket ${socket.id}`);
          socketLogger.warn(`[SOCKET] ${error} pour socket ${socket.id}`, {
            timestamp: new Date().toISOString(),
            socketId: socket.id
          });
          return callback?.({ error });
        }

        const roomName = `liste-${listeId}`;
        
        // Vérifier si le socket est dans la room
        if (socket.rooms.has(roomName)) {
          socket.leave(roomName);
          console.log(`[SOCKET] leave-liste: socket ${socket.id} quitte la room ${roomName}`);
          socketLogger.info(`[SOCKET] leave-liste: socket ${socket.id} quitte la room ${roomName}`, {
            timestamp: new Date().toISOString(),
            socketId: socket.id,
            listeId
          });
          
          // Notifier les autres clients de la room
          socket.to(roomName).emit('user-left-liste', {
            socketId: socket.id,
            listeId,
            timestamp: new Date().toISOString()
          });
        } else {
          socketLogger.info(`[SOCKET] Socket ${socket.id} n'était pas dans la room ${roomName}`);
        }
        
        // Confirmer au client que l'opération a réussi
        callback?.({ success: true, roomId: roomName, listeId });
        
      } catch (error) {
        console.error(`[SOCKET] Erreur leave-liste pour ${listeId}:`, error);
        socketLogger.error(`[SOCKET] Erreur leave-liste pour ${listeId}`, {
          timestamp: new Date().toISOString(),
          socketId: socket.id,
          error: error.message,
          stack: error.stack
        });
        callback?.({ error: error.message });
      }
    });

    // Gestion de la déconnexion
    const handleDisconnect = (reason) => {
      if (isDisconnecting) return; // Éviter les traitements en double
      isDisconnecting = true;
      
      const rooms = Array.from(socket.rooms);
      console.log(`🔌 Déconnexion Socket.IO: ${socket.id}, Raison: ${reason}, Rooms:`, rooms);
      socketLogger.info(`Déconnexion Socket.IO: ${socket.id}`, {
        timestamp: new Date().toISOString(),
        socketId: socket.id,
        reason,
        rooms
      });
      
      // Notifier toutes les rooms que l'utilisateur s'est déconnecté
      rooms.forEach(room => {
        if (room !== socket.id) { // Ne pas notifier la room personnelle du socket
          socket.to(room).emit('user-disconnected', {
            socketId: socket.id,
            room,
            reason,
            timestamp: new Date().toISOString()
          });
        }
      });
      
      // Nettoyer les références
      rooms.forEach(room => socket.leave(room));
    };

    // Écouter les événements de déconnexion
    socket.on('disconnect', handleDisconnect);
    
    // Gestion des erreurs
    socket.on('error', (error) => {
      console.error(`[SOCKET] Erreur pour socket ${socket.id}:`, error);
      socketLogger.error(`[SOCKET] Erreur pour socket ${socket.id}`, {
        timestamp: new Date().toISOString(),
        socketId: socket.id,
        error: error.message,
        stack: error.stack
      });
    });
    
    // Événement de ping/pong pour maintenir la connexion
    socket.on('ping', (cb) => {
      if (typeof cb === 'function') {
        cb();
      }
    });
    
    // console.log(`[SOCKET] Socket ${socket.id} initialisé avec succès`);
    socketLogger.info(`[SOCKET] Socket ${socket.id} initialisé avec succès`, {
      timestamp: new Date().toISOString(),
      socketId: socket.id
    });
  });

  return io;
};

// Fonction utilitaire pour émettre vers une liste spécifique
export const emitToListe = (listeId, event, data) => {
  if (!io) {
    socketLogger.error('[SOCKET] IO non initialisé, impossible d\'émettre vers la liste');
    return false;
  }
  
  if (!listeId) {
    socketLogger.error('[SOCKET] ID de liste manquant pour émettre un événement');
    return false;
  }
  
  const roomName = `liste-${listeId}`;
  const clients = io.sockets.adapter.rooms.get(roomName);
  
  if (!clients || clients.size === 0) {
    socketLogger.warn(`[SOCKET] Aucun client dans la room ${roomName} pour l\'événement ${event}`);
    return false;
  }
  
  io.to(roomName).emit(event, data);
  socketLogger.info(`[SOCKET] Émission de ${event} vers la room ${roomName} (${clients.size} clients)`);
  return true;
};

// Fonction utilitaire pour émettre vers un utilisateur spécifique
export const emitToUser = (userId, event, data) => {
  if (!io) {
    console.error('[SOCKET] IO non initialisé, impossible d\'émettre vers l\'utilisateur');
    socketLogger.error('[SOCKET] IO non initialisé, impossible d\'émettre vers l\'utilisateur', {
      timestamp: new Date().toISOString(),
      event
    });
    return false;
  }
  
  if (!userId) {
    console.error('[SOCKET] ID utilisateur manquant pour émettre un événement');
    socketLogger.error('[SOCKET] ID utilisateur manquant pour émettre un événement', {
      timestamp: new Date().toISOString(),
      event
    });
    return false;
  }
  
  const roomName = `user-${userId}`;
  const clients = io.sockets.adapter.rooms.get(roomName);
  
  if (!clients || clients.size === 0) {
    console.warn(`[SOCKET] Aucun client dans la room utilisateur ${roomName} pour l'événement ${event}`);
    socketLogger.warn(`[SOCKET] Aucun client dans la room utilisateur ${roomName} pour l'événement ${event}`, {
      timestamp: new Date().toISOString(),
      userId,
      event
    });
    return false;
  }
  
  io.to(roomName).emit(event, data);socketLogger.info(`[SOCKET] Émission de ${event} vers l'utilisateur ${roomName} (${clients.size} clients)`);
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO non initialisé');
  }
  return io;
};

import { Server } from 'socket.io';

let io;

export const initializeSocketIO = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log('✨ Nouvelle connexion Socket.IO:', socket.id);

    // Rejoindre la salle de l'utilisateur
    socket.on('join-user', (userId) => {
      socket.join(`user-${userId}`);
    });

    // Rejoindre la salle d'une liste
    socket.on('join-liste', (listeId) => {
      socket.join(`liste-${listeId}`);
    });

    // Quitter la salle d'une liste
    socket.on('leave-liste', (listeId) => {
      socket.leave(`liste-${listeId}`);
    });

    socket.on('disconnect', () => {
      console.log('🔌 Déconnexion Socket.IO:', socket.id);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO non initialisé');
  }
  return io;
};

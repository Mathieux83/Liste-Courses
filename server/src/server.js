import logger from './services/logger.js';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import listesRoutes from './routes/listes.js';
import authRoutes from './routes/auth.js';
import notificationsRoutes from './routes/notifications.js';
import deliveryRoutes from './routes/delivery.js';
import { initializeSocketIO } from './socket.js';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';

// Configuration
dotenv.config()
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)



const mongoURI = `mongodb+srv://${process.env.MONGO_USER}:${encodeURIComponent(process.env.MONGO_PASSWORD)}@${process.env.MONGO_CLUSTER}/${process.env.MONGO_DB}?retryWrites=true&w=majority&appName=Cluster0`

const app = express()
const PORT = process.env.PORT
app.use(cookieParser())

// Middleware de sécurité
app.use(helmet({
  contentSecurityPolicy: false // Désactivé pour le développement
}))

// Limitation du taux de requêtes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limite à 100 requêtes par IP
  message: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.'
})
app.use('/api/', limiter)

// CORS
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3001',
  'https://listecourses.vercel.app',
  'https://listecourses-frontend.vercel.app',
  process.env.FRONTEND_URL,
  process.env.API_URL
].filter(Boolean);

// Configuration CORS plus permissive pour le développement
app.use(cors({
  origin: function (origin, callback) {
    // console.log('Origine de la requête:', origin);
    
    // En développement, on autorise toutes les origines
    if (process.env.NODE_ENV === 'development') {
      // console.log('Mode développement - Toutes les origines sont autorisées');
      return callback(null, true);
    }
    
    // En production, on vérifie les origines autorisées
    if (!origin || allowedOrigins.includes(origin)) {
      // console.log(`Origine autorisée: ${origin}`);
      return callback(null, true);
    }
    
    // Si l'origine n'est pas autorisée en production
    // console.log(`Origine non autorisée: ${origin}`);
    return callback(new Error('Origine non autorisée par CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
}))

// Parsing JSON avec limites de taille
app.use(express.json({ 
  limit: '1mb',
  verify: (req, res, buf) => {
    req.rawBody = buf.toString();
  }
}))
app.use(express.urlencoded({ 
  extended: true, 
  limit: '1mb' 
}))

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/listes', listesRoutes)
app.use('/api/notifications', notificationsRoutes)
app.use('/api/delivery', deliveryRoutes)
app.use('/api/reset-password', authRoutes)

// Route de test
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  })
})

// Gestion des erreurs 404
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Route non trouvée',
    path: req.path 
  })
})

// Gestionnaire d'erreurs global
app.use((error, req, res, next) => {
  errorLogger.error(error.message, { 
    stack: error.stack,
    path: req.path,
    method: req.method
  });

  const status = error.statusCode || 500;
  const message = error.message || 'Erreur interne du serveur';

  res.status(status).json({ 
    error: message,
    details: process.env.NODE_ENV === 'development' ? error.stack : undefined
  });
});



// Initialisation de la base de données et démarrage du serveur
const startServer = () => {
  const server = app.listen(PORT, () => {
    // console.log(`🚀 Serveur démarré sur le port ${PORT}`)
    // console.log(`📡 API disponible sur http://localhost:${PORT}/api`)
    // console.log(`🔍 Health check: http://localhost:${PORT}/api/health`)
    
    logger.info(`🚀 Serveur démarré sur le port ${PORT}`, {
      timestamp: new Date().toISOString()})
    logger.info(`📡 API disponible sur http://localhost:${PORT}/api`, {
      timestamp: new Date().toISOString()})
    logger.info(`🔍 Health check: http://localhost:${PORT}/api/health`, {
      timestamp: new Date().toISOString()})

    
      // Initialisation de Socket.IO
    const io = initializeSocketIO(server)
    // console.log('✨ Socket.IO initialisé')
    
    logger.info('✨ Socket.IO initialisé', {
      timestamp: new Date().toISOString()})
    })
}

// console.log('Tentative de connexion à MongoDB via l\URI :', mongoURI)
mongoose.connect(mongoURI)

.then(() => {
  // console.log('✅ Connexion à MongoDB établie')
  
  logger.info('✅ Connexion à MongoDB établie', {
    timestamp: new Date().toISOString()})
  startServer() // Démarre le serveur SEULEMENT si MongoDB est OK
})
.catch((err) => {
  dbLogger.error('❌ Erreur de connexion à MongoDB', err);
  process.exit(1);
})

// Gestion propre de l'arrêt
process.on('SIGINT', () => {
  // console.log('\n🛑 Arrêt du serveur...')
  logger.info('🛑 Arrêt du serveur via SIGINT', {
    timestamp: new Date().toISOString()})
  process.exit(0)
})

process.on('SIGTERM', () => {
  // console.log('\n🛑 Arrêt du serveur...')
  logger.info('🛑 Arrêt du serveur via SIGTERM', {
    timestamp: new Date().toISOString()})
  process.exit(0)
})

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import listesRoutes from './routes/listes.js'
import authRoutes from './routes/auth.js'
import notificationsRoutes from './routes/notifications.js'
import deliveryRoutes from './routes/delivery.js'
import resetPasswordRoutes from './routes/reset-password.js'
import { initializeSocketIO } from './socket.js'
import mongoose from 'mongoose'
import cookieParser from 'cookie-parser'

// Configuration
dotenv.config()
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)



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
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
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
app.use('/api/reset-password', resetPasswordRoutes)

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
  console.error('Erreur serveur:', error)
  res.status(500).json({ 
    error: 'Erreur interne du serveur',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Une erreur est survenue'
  })
})



// Initialisation de la base de données et démarrage du serveur
const startServer = () => {
  const server = app.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur le port ${PORT}`)
    console.log(`📡 API disponible sur http://localhost:${PORT}/api`)
    console.log(`🔍 Health check: http://localhost:${PORT}/api/health`)
  })

  // Initialisation de Socket.IO
  const io = initializeSocketIO(server)
  console.log('✨ Socket.IO initialisé')
}

mongoose.connect(process.env.MONGODB_URI)

.then(() => {
  console.log('✅ Connexion à MongoDB établie')
  startServer() // Démarre le serveur SEULEMENT si MongoDB est OK
})
.catch((err) => {
  console.error('❌ Erreur de connexion à MongoDB', err)
  process.exit(1)
})

// Gestion propre de l'arrêt
process.on('SIGINT', () => {
  console.log('\n🛑 Arrêt du serveur...')
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('\n🛑 Arrêt du serveur...')
  process.exit(0)
})

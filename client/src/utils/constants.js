// Constantes de l'application
export const APP_NAME = 'Liste de Courses';
export const APP_VERSION = '1.0.0';

// Clés de stockage local
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER: 'user',
  THEME: 'theme',
  OFFLINE_DATA: 'offline_data',
  LAST_SYNC: 'last_sync'
};

// Routes de l'API
export const API_ROUTES = {
  AUTH: '/auth',
  LISTES: '/listes',
  DELIVERY: '/delivery',
  NOTIFICATIONS: '/notifications',
  HEALTH: '/health'
};

// Configuration des notifications
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

// États de synchronisation
export const SYNC_STATUS = {
  PENDING: 'pending',
  SYNCING: 'syncing',
  SYNCED: 'synced',
  ERROR: 'error'
};

// Configuration de la PWA
export const PWA_CONFIG = {
  APP_NAME: 'Liste de Courses',
  SHORT_NAME: 'Courses',
  DESCRIPTION: 'Application de gestion de listes de courses',
  THEME_COLOR: '#4f46e5',
  BACKGROUND_COLOR: '#ffffff'
};

// Messages d'erreur
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Erreur de connexion réseau',
  AUTH_ERROR: 'Erreur d\'authentification',
  VALIDATION_ERROR: 'Erreur de validation',
  SERVER_ERROR: 'Erreur serveur',
  OFFLINE: 'Vous êtes hors ligne'
};

// Configuration des timeouts et limites
export const LIMITS = {
  MAX_ITEMS_PER_LIST: 100,
  MIN_PASSWORD_LENGTH: 6,
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 heures
  SYNC_INTERVAL: 5 * 60 * 1000, // 5 minutes
  DEBOUNCE_DELAY: 500 // 500ms
};

// États des articles
export const ITEM_STATUS = {
  PENDING: 'pending',
  CHECKED: 'checked',
  DELETED: 'deleted'
};

// Types de listes
export const LIST_TYPES = {
  MAIN: 'main',
  REGULAR: 'regular',
  SHARED: 'shared'
};

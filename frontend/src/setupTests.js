import '@testing-library/jest-dom';
import { server } from './mocks/server';
import { store } from './store';
import { cleanup } from '@testing-library/react';

// Configuration globale pour les tests
beforeAll(() => {
  // Démarrage du serveur de mock
  server.listen({ onUnhandledRequest: 'error' });
  
  // Configuration des variables d'environnement pour les tests
  process.env.VITE_API_URL = 'http://localhost:3001/api';
  process.env.VITE_WS_URL = 'ws://localhost:3001';
  
  // Suppression des warnings de console pendant les tests
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

// Réinitialisation après chaque test
afterEach(() => {
  // Nettoyage du DOM
  cleanup();
  
  // Réinitialisation des mocks
  server.resetHandlers();
  
  // Réinitialisation du store Redux
  store.dispatch({ type: 'RESET_STATE' });
  
  // Nettoyage du localStorage
  localStorage.clear();
  
  // Réinitialisation des mocks de fetch
  fetch.resetMocks();
});

// Nettoyage final
afterAll(() => {
  // Arrêt du serveur de mock
  server.close();
  
  // Restauration des console.warn et console.error
  console.warn.mockRestore();
  console.error.mockRestore();
});

// Mock du localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock des variables du navigateur
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock de IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {
    this.observe = jest.fn();
    this.unobserve = jest.fn();
    this.disconnect = jest.fn();
  }
};

// Utilitaires de test personnalisés
global.waitForData = () => new Promise(resolve => setTimeout(resolve, 0));

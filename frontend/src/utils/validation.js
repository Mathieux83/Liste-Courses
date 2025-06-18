import { LIMITS } from './constants';

// Validation des emails
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validation des mots de passe
export const validatePassword = (password) => {
  if (!password || typeof password !== 'string') return false;
  
  return (
    password.length >= LIMITS.MIN_PASSWORD_LENGTH &&
    /[A-Z]/.test(password) && // Au moins une majuscule
    /[a-z]/.test(password) && // Au moins une minuscule
    /[0-9]/.test(password) && // Au moins un chiffre
    /[^A-Za-z0-9]/.test(password) // Au moins un caractère spécial
  );
};

// Validation du nom d'utilisateur
export const validateUsername = (username) => {
  if (!username || typeof username !== 'string') return false;
  return username.length >= 3 && username.length <= 30;
};

// Validation d'une liste
export const validateList = (list) => {
  if (!list || typeof list !== 'object') return false;
  
  const { nom, articles } = list;
  
  // Vérification du nom
  if (!nom || typeof nom !== 'string' || nom.trim().length === 0) {
    return false;
  }
  
  // Vérification des articles
  if (!Array.isArray(articles)) {
    return false;
  }
  
  // Vérification du nombre d'articles
  if (articles.length > LIMITS.MAX_ITEMS_PER_LIST) {
    return false;
  }
  
  // Vérification de chaque article
  return articles.every(article => validateArticle(article));
};

// Validation d'un article
export const validateArticle = (article) => {
  if (!article || typeof article !== 'object') return false;
  
  const { nom, quantite } = article;
  
  // Vérification du nom
  if (!nom || typeof nom !== 'string' || nom.trim().length === 0) {
    return false;
  }
  
  // Vérification de la quantité
  if (quantite !== undefined) {
    if (typeof quantite !== 'number' || quantite <= 0) {
      return false;
    }
  }
  
  return true;
};

// Validation du code postal
export const validatePostalCode = (postalCode) => {
  // Format français : 5 chiffres
  const postalCodeRegex = /^[0-9]{5}$/;
  return postalCodeRegex.test(postalCode);
};

// Validation du numéro de téléphone
export const validatePhoneNumber = (phoneNumber) => {
  // Format français
  const phoneRegex = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/;
  return phoneRegex.test(phoneNumber);
};

// Validation des dates
export const validateDate = (date) => {
  if (!(date instanceof Date) && typeof date !== 'string') return false;
  
  const timestamp = Date.parse(date);
  return !isNaN(timestamp);
};

// Validation des URL
export const validateURL = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Formatage des dates
export const formatDate = (date) => {
  if (!date) return '';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(d);
};

// Formatage des prix
export const formatPrice = (price) => {
  if (typeof price !== 'number') return '';
  
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(price);
};

// Formatage des quantités
export const formatQuantity = (quantity, unit = '') => {
  if (typeof quantity !== 'number') return '';
  return `${quantity}${unit ? ` ${unit}` : ''}`;
};

// Formatage du nom complet
export const formatFullName = (firstName, lastName) => {
  return [firstName, lastName]
    .filter(Boolean)
    .map(name => name.trim())
    .join(' ');
};

// Formatage du numéro de téléphone
export const formatPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return '';
  
  // Nettoyage du numéro
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Format français
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
  }
  
  return phoneNumber;
};

// Formatage du code postal
export const formatPostalCode = (postalCode) => {
  if (!postalCode) return '';
  
  const cleaned = postalCode.replace(/\D/g, '');
  return cleaned.slice(0, 5);
};

// Formatage des slugs
export const formatSlug = (text) => {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

// Formatage de la taille des fichiers
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

// Formatage du temps écoulé
export const formatTimeAgo = (date) => {
  const now = new Date();
  const past = new Date(date);
  const diffTime = Math.abs(now - past);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Aujourd\'hui';
  if (diffDays === 1) return 'Hier';
  if (diffDays < 7) return `Il y a ${diffDays} jours`;
  if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaines`;
  if (diffDays < 365) return `Il y a ${Math.floor(diffDays / 30)} mois`;
  return `Il y a ${Math.floor(diffDays / 365)} ans`;
};

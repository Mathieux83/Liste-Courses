import { toast } from 'react-hot-toast';
import { NOTIFICATION_TYPES } from './constants';

const defaultOptions = {
  duration: 3000,
  position: 'top-right'
};

export const notify = {
  success: (message, options = {}) => {
    return toast.success(message, {
      ...defaultOptions,
      ...options,
      style: {
        background: '#22c55e',
        color: '#fff'
      },
      icon: '✅'
    });
  },

  error: (message, options = {}) => {
    return toast.error(message, {
      ...defaultOptions,
      ...options,
      style: {
        background: '#ef4444',
        color: '#fff'
      },
      icon: '❌'
    });
  },

  warning: (message, options = {}) => {
    return toast(message, {
      ...defaultOptions,
      ...options,
      style: {
        background: '#f59e0b',
        color: '#fff'
      },
      icon: '⚠️'
    });
  },

  info: (message, options = {}) => {
    return toast(message, {
      ...defaultOptions,
      ...options,
      style: {
        background: '#3b82f6',
        color: '#fff'
      },
      icon: 'ℹ️'
    });
  },

  loading: (message, options = {}) => {
    return toast.loading(message, {
      ...defaultOptions,
      ...options,
      style: {
        background: '#6b7280',
        color: '#fff'
      }
    });
  },

  custom: (message, options = {}) => {
    return toast(message, {
      ...defaultOptions,
      ...options
    });
  },

  dismiss: (toastId) => {
    toast.dismiss(toastId);
  },

  // Gestion des erreurs API
  handleError: (error) => {
    const message = error.response?.data?.message || error.message || 'Une erreur est survenue';
    notify.error(message);
  }
};

export default notify;

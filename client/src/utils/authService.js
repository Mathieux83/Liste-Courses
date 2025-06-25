// import axios from 'axios';

// const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// class AuthService {
//   async login(email, password) {
//     return axios.post(`${API_URL}/auth/login`, { email, password }, { withCredentials: true });
//   }

//   async register(name, email, password) {
//     return axios.post(`${API_URL}/auth/register`, { name, email, password }, { withCredentials: true });
//   }

//   async logout() {
//     return axios.post(`${API_URL}/auth/logout`, {}, { withCredentials: true });
//   }
// }

// export default new AuthService();

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class AuthService {
  async login(email, password) {
    return axios.post(`${API_URL}/auth/login`, { email, password }, { withCredentials: true });
  }

  async register(name, email, password) {
    return axios.post(`${API_URL}/auth/register`, { name, email, password }, { withCredentials: true });
  }

  async logout() {
    return axios.post(`${API_URL}/auth/logout`, {}, { withCredentials: true });
  }
  
  // Nouvelles méthodes pour la réinitialisation de mot de passe
  
  // Demander un lien de réinitialisation de mot de passe
  async forgotPassword(email) {
    return axios.post(`${API_URL}/auth/forgot-password`, { email }, { withCredentials: true });
  }
  
  // Vérifier la validité d'un token de réinitialisation
  async verifyResetToken(token) {
    return axios.get(`${API_URL}/auth/verify-reset-token/${token}`, { withCredentials: true });
  }
  
  // Réinitialiser le mot de passe avec un token valide
  async resetPassword(token, password) {
    return axios.post(`${API_URL}/auth/reset-password`, { token, password }, { withCredentials: true });
  }
}

export default new AuthService();

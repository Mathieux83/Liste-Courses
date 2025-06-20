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
}

export default new AuthService();
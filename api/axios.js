import axios from 'axios';
import { getToken } from './storage';

const api = axios.create({
  baseURL: 'https://91e8c33cf356.ngrok-free.app/api',  // <-- PUT your Laravel API URL here
  timeout: 5000,
});

api.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;

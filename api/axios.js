import axios from 'axios';
import { getToken } from './storage';

const api = axios.create({
  baseURL: 'https://eurodental.ma/api',
  timeout: 10000,
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

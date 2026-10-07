import axios from 'axios';
import { useAuthStore } from '../stores/auth.store';
export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1', timeout: 20000 });

api.interceptors.request.use(config => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
api.interceptors.response.use(response => response, error => {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      if (window.location.pathname !== '/login') window.location.assign('/login');
    }
    if (error.response?.status === 403 && window.location.pathname !== '/403') window.location.assign('/403');
  }
  return Promise.reject(error);
});


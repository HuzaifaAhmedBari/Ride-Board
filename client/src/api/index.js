import axios from 'axios';
import { getAuthToken } from './tokenStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api'
});

/**
 * Synchronously attach JWT from the token singleton.
 * No async, no awaiting Supabase — never hangs.
 */
api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

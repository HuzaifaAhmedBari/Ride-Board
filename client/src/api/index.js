import axios from 'axios';
import { supabase } from './supabase';

const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL || '/api' });

let memoryToken = null;

// Listen for auth changes once and cache the token in memory.
// This completely bypasses the infamous Supabase GoTrue lock bug in React Strict Mode.
supabase.auth.onAuthStateChange((_event, session) => {
  memoryToken = session?.access_token || null;
});

api.interceptors.request.use(config => {
  if (memoryToken) {
    config.headers.Authorization = `Bearer ${memoryToken}`;
  }
  return config;
});

export default api;

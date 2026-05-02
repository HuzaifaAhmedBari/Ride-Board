import axios from 'axios';
import { supabase } from './supabase';

const api = axios.create({ 
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api' 
});

// Add the Supabase token to every request automatically
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

export default api;

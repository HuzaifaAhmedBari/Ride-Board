import axios from 'axios';
import { supabase } from './supabase';

// Base axios instance — baseURL falls back to same-origin /api for Vercel deployment
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api'
});

/**
 * Attach the Supabase JWT to every request.
 * Routes that don't require auth will simply ignore the header.
 * This approach is simpler than selectively adding the header per-call.
 */
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

export default api;

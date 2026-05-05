import { create } from 'zustand';
import { supabase } from '../api/supabase';
import { setAuthToken } from '../api/tokenStore';
import api from '../api';

export const useAuthStore = create(set => ({
  user: null,
  profile: null,
  loading: true,

  init: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setAuthToken(session.access_token); // make token available synchronously
      try {
        const { data } = await api.get('/users/me');
        set({ user: session.user, profile: data.profile, loading: false });
      } catch (err) {
        if (err.response?.status === 401) {
          await supabase.auth.signOut().catch(() => {});
          setAuthToken(null);
          set({ user: null, profile: null, loading: false });
        } else {
          set({ user: session.user, profile: null, loading: false });
        }
      }
    } else {
      set({ loading: false });
    }

    supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setAuthToken(session.access_token); // keep token in sync on every auth change
        try {
          const { data } = await api.get('/users/me');
          set({ user: session.user, profile: data.profile });
        } catch {
          set({ user: session.user, profile: null });
        }
      } else {
        setAuthToken(null);
        set({ user: null, profile: null });
      }
    });
  },

  signOut: async () => {
    try { await supabase.auth.signOut(); } catch (e) { console.error(e); }
    setAuthToken(null);
    set({ user: null, profile: null });
  },

  refreshProfile: async () => {
    try {
      const { data } = await api.get('/users/me');
      set({ profile: data.profile });
    } catch {
      set({ profile: null });
    }
  }
}));

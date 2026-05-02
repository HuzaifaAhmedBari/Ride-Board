import { create } from 'zustand';
import { supabase } from '../api/supabase';
import api from '../api';

export const useAuthStore = create(set => ({
  user: null,
  profile: null,
  loading: true,

  init: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      try {
        const { data } = await api.get('/users/me');
        set({ user: session.user, profile: data.profile, loading: false });
      } catch {
        set({ user: session.user, profile: null, loading: false });
      }
    } else {
      set({ loading: false });
    }
    supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        try {
          const { data } = await api.get('/users/me');
          set({ user: session.user, profile: data.profile });
        } catch {
          set({ user: session.user, profile: null });
        }
      } else {
        set({ user: null, profile: null });
      }
    });
  },

  signOut: async () => {
    try { await supabase.auth.signOut(); } catch (e) { console.error(e); }
    set({ user: null, profile: null });
  }
}));

/**
 * A simple module-level singleton to hold the JWT.
 * Used by the API interceptor to attach auth headers synchronously,
 * avoiding the async supabase.auth.getSession() that can hang.
 */
let _token = null;

export const setAuthToken = (token) => { _token = token; };
export const getAuthToken = () => _token;

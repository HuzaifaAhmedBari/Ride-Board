const supabase = require('../db');

/**
 * Express middleware that validates a Supabase JWT from the Authorization header.
 * Attaches the authenticated user object to `req.user` on success.
 */
module.exports = async function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    console.error('Auth Error:', error?.message || 'No user found');
    return res.status(401).json({ error: error?.message || 'Invalid token' });
  }

  req.user = user;
  next();
};

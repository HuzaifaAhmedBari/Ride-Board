const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/auth');
const supabase = require('../db');

/**
 * POST /api/auth/profile
 * Called once after signup to insert the authenticated user's public profile row.
 * Requires: name (string), optional email and phone.
 */
router.post('/profile', requireAuth, async (req, res) => {
  const { name, phone, email } = req.body;
  if (!name || !phone || !email) return res.status(400).json({ error: 'Name, email, and phone are required' });

  const { error } = await supabase.from('users').insert({
    id: req.user.id,
    name,
    email,
    phone
  });

  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

module.exports = router;

const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/auth');
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// POST /api/auth/profile
// Called once after signup to create the public users row
router.post('/profile', requireAuth, async (req, res) => {
  const { name, phone, email } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });

  const { error } = await supabase.from('users').insert({
    id: req.user.id,
    name,
    email: email || req.user.email,
    phone: phone || null
  });

  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

module.exports = router;

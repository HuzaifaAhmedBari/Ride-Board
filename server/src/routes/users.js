const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/auth');
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// GET /api/users/me — own full profile
router.get('/me', requireAuth, async (req, res) => {
  const [profileRes, postedRes, bookingsRes] = await Promise.all([
    supabase.from('users').select('*').eq('id', req.user.id).single(),
    supabase.from('rides').select('*').eq('poster_id', req.user.id).order('start_time', { ascending: false }),
    supabase.from('bookings').select('*, ride:ride_id(*)').eq('rider_id', req.user.id).order('created_at', { ascending: false })
  ]);

  res.json({
    profile: profileRes.data,
    posted_rides: postedRes.data || [],
    booked_rides: bookingsRes.data || []
  });
});

// PATCH /api/users/me — update own profile
router.patch('/me', requireAuth, async (req, res) => {
  const { name, phone } = req.body;
  const { error } = await supabase
    .from('users').update({ name, phone }).eq('id', req.user.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

// GET /api/users/:id — public driver profile
router.get('/:id', requireAuth, async (req, res) => {
  const { data: profile, error } = await supabase
    .from('users')
    .select('id, name, created_at')
    .eq('id', req.params.id)
    .single();

  if (error) return res.status(404).json({ error: 'User not found' });

  const { data: rides } = await supabase
    .from('rides')
    .select('id, origin_address, destination_address, start_time, fare_per_seat, seats_remaining, status')
    .eq('poster_id', req.params.id)
    .order('start_time', { ascending: false });

  const allRides = rides || [];
  res.json({
    profile,
    completed_rides: allRides.filter(r => r.status === 'expired').length,
    active_rides: allRides.filter(r => r.status === 'active')
  });
});

module.exports = router;

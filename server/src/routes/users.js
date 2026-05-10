const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/auth');
const supabase = require('../db');

/**
 * GET /api/users/me  [Auth required]
 * Returns the authenticated user's full profile, posted rides, and bookings.
 */
router.get('/me', requireAuth, async (req, res) => {
  try {
    const now = new Date().toISOString();
  const [profileRes, postedRes, bookingsRes, reviewsRes] = await Promise.all([
    supabase.from('users').select('*, rating:user_ratings!reviewee_id(avg_rating, review_count)').eq('id', req.user.id).single(),
    supabase.from('rides').select('*').eq('poster_id', req.user.id).order('start_time', { ascending: false }),
    supabase.from('bookings').select('*, ride:ride_id(*, poster:poster_id(id, name))').eq('rider_id', req.user.id).order('created_at', { ascending: false }),
    supabase.from('reviews').select('ride_id').eq('reviewer_id', req.user.id)
  ]);

    const reviewedRideIds = new Set((reviewsRes.data || []).map(r => r.ride_id));
    const bookedRides = (bookingsRes.data || []).map(b => ({
      ...b,
      is_reviewed: reviewedRideIds.has(b.ride_id)
    }));

    const postedRides = postedRes.data || [];
    
    res.json({
      profile: profileRes.data,
      posted_rides: postedRides,
      posted_active: postedRides.filter(r => (r.status === 'active' || r.status === 'full') && new Date(r.start_time) > new Date()),
      posted_expired: postedRides.filter(r => r.status === 'expired' || r.status === 'cancelled' || new Date(r.start_time) <= new Date()),
      booked_rides: bookedRides
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /api/users/me  [Auth required]
 * Updates the authenticated user's name and/or phone number.
 */
router.patch('/me', requireAuth, async (req, res) => {
  const { name, phone } = req.body;
  const { error } = await supabase
    .from('users').update({ name, phone }).eq('id', req.user.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

/**
 * GET /api/users/:id  [Auth required]
 * Returns a driver's public profile and their active/completed ride counts.
 */
router.get('/:id', requireAuth, async (req, res) => {
  const [profileRes, ridesRes, reviewsRes, myBookingsRes] = await Promise.all([
    supabase.from('users').select('id, name, created_at, rating:user_ratings!reviewee_id(avg_rating, review_count)').eq('id', req.params.id).single(),
    supabase.from('rides').select('id, origin_address, destination_address, start_time, fare_per_seat, seats_remaining, status').eq('poster_id', req.params.id).order('start_time', { ascending: false }),
    supabase.from('reviews').select('id, rating, comment, created_at, reviewer:users!reviewer_id(name)').eq('reviewee_id', req.params.id).order('created_at', { ascending: false }),
    supabase.from('bookings').select('ride_id').eq('rider_id', req.user.id)
  ]);

  if (profileRes.error) return res.status(404).json({ error: 'User not found' });

  const now = new Date();
  const allRides = ridesRes.data || [];
  const activeRides = allRides.filter(r => ['active', 'full'].includes(r.status) && new Date(r.start_time) > now);
  
  res.json({
    profile:         profileRes.data,
    completed_rides: allRides.filter(r => r.status === 'expired' || new Date(r.start_time) <= now).length,
    active_rides:    activeRides,
    reviews:         reviewsRes.data || [],
    my_bookings:     myBookingsRes.data || []
  });
});

module.exports = router;

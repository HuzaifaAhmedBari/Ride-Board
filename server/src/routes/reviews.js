const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/auth');
const supabase = require('../db');

/**
 * POST /api/reviews
 * Submits a review for a ride participant.
 */
router.post('/', requireAuth, async (req, res) => {
  const { ride_id, reviewee_id, rating, comment } = req.body;
  const reviewer_id = req.user.id;

  if (!ride_id || !reviewee_id || !rating) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // 1. Verify the ride is expired/completed
    const { data: ride, error: rideErr } = await supabase
      .from('rides')
      .select('status, poster_id')
      .eq('id', ride_id)
      .single();

    if (rideErr || !ride) return res.status(404).json({ error: 'Ride not found' });
    if (ride.status !== 'expired') {
      return res.status(400).json({ error: 'You can only review completed rides' });
    }

    // 2. Verify the reviewer was a participant (either driver or booked passenger)
    const { data: booking } = await supabase
      .from('bookings')
      .select('id')
      .eq('ride_id', ride_id)
      .eq('rider_id', reviewer_id)
      .single();

    const isDriver = ride.poster_id === reviewer_id;
    const isPassenger = !!booking;

    if (!isDriver && !isPassenger) {
      return res.status(403).json({ error: 'You were not a participant in this ride' });
    }

    // 3. Insert the review
    const { data, error: insertErr } = await supabase
      .from('reviews')
      .insert({
        ride_id,
        reviewer_id,
        reviewee_id,
        rating,
        comment
      })
      .select()
      .single();

    if (insertErr) {
      if (insertErr.code === '23505') {
        return res.status(409).json({ error: 'You have already reviewed this ride' });
      }
      return res.status(400).json({ error: insertErr.message });
    }

    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/reviews/user/:userId
 * Gets average rating and reviews for a specific user.
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('reviewee_id', req.params.userId);

    if (error) throw error;

    const avgRating = reviews.length > 0 
      ? reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length 
      : 0;

    res.json({
      averageRating: avgRating.toFixed(1),
      totalReviews: reviews.length,
      reviews
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

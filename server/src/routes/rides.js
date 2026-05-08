const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/auth');
const supabase = require('../db');
const { geocode } = require('../services/nominatim');
const { getPolyline } = require('../services/osrm');

/**
 * POST /api/rides
 * Creates a new ride listing. Auth required — only logged-in users can post rides.
 * Coordinates are supplied directly by the MapPicker component; geocoding is only
 * used as a fallback when lat/lng are missing.
 */
router.post('/', requireAuth, async (req, res) => {
  const {
    origin_address, origin_lat, origin_lng,
    destination_address, destination_lat, destination_lng,
    start_time, total_seats, fare_per_seat
  } = req.body;

  if (!origin_address || !destination_address || !start_time || !total_seats || fare_per_seat == null)
    return res.status(400).json({ error: 'All fields are required' });

  if (new Date(start_time) <= Date.now() + 15 * 60 * 1000)
    return res.status(400).json({ error: 'Departure must be at least 15 minutes from now' });

  try {
    let originCoords = { lat: origin_lat, lng: origin_lng };
    let destCoords   = { lat: destination_lat, lng: destination_lng };
    if (!origin_lat || !origin_lng)           originCoords = await geocode(origin_address);
    if (!destination_lat || !destination_lng) destCoords   = await geocode(destination_address);

    const polyline = await getPolyline(
      originCoords.lng, originCoords.lat,
      destCoords.lng,   destCoords.lat
    );

    const { data: ride, error } = await supabase
      .from('rides')
      .insert({
        poster_id:           req.user.id,
        origin_address,
        origin_lat:          originCoords.lat,
        origin_lng:          originCoords.lng,
        destination_address,
        destination_lat:     destCoords.lat,
        destination_lng:     destCoords.lng,
        start_time,
        total_seats,
        seats_remaining:     total_seats,
        fare_per_seat,
        route_polyline:      polyline
      })
      .select()
      .single();

    if (error) throw error;
    res.json(ride);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/rides/stats
 * Returns aggregate stats for the home page.
 */
router.get('/stats', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('rides')
      .select('seats_remaining')
      .eq('status', 'active');

    if (error) throw error;

    const stats = {
      activeRides: data.length,
      totalSeats: data.reduce((sum, r) => sum + r.seats_remaining, 0)
    };
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/rides/:id
 * Returns a single ride with poster info. Public — no auth required.
 */
router.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('rides')
    .select('*, poster:poster_id(id, name, phone, created_at)')
    .eq('id', req.params.id)
    .single();

  if (error) return res.status(404).json({ error: 'Ride not found' });
  res.json(data);
});

/**
 * PATCH /api/rides/:id/cancel
 * Cancels a ride. Auth required — only the poster can cancel.
 */
router.patch('/:id/cancel', requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const { data: ride, error: findErr } = await supabase.from('rides').select('poster_id, status').eq('id', id).single();
    if (findErr || !ride) return res.status(404).json({ error: 'Ride not found' });
    
    if (ride.poster_id !== req.user.id) return res.status(403).json({ error: 'Not authorized to cancel this ride' });
    if (ride.status === 'expired' || ride.status === 'cancelled') return res.status(400).json({ error: 'Ride cannot be cancelled' });

    const { error: updErr } = await supabase.from('rides').update({ status: 'cancelled' }).eq('id', id);
    if (updErr) throw updErr;

    // Cancel all associated bookings as well
    await supabase.from('bookings').update({ status: 'cancelled' }).eq('ride_id', id);

    res.json({ success: true, message: 'Ride cancelled successfully' });
  } catch (err) {
    console.error('[Ride Cancel Error]:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

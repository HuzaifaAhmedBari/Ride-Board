const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/auth');
const { geocode } = require('../services/nominatim');
const { getPolyline } = require('../services/osrm');
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// POST /api/rides — post a new ride
// Frontend sends lat/lng from MapPicker directly; geocoding on server is skipped when coords provided
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
    // Use coords from frontend if provided; fall back to geocoding if missing
    let originCoords = { lat: origin_lat, lng: origin_lng };
    let destCoords   = { lat: destination_lat, lng: destination_lng };
    if (!origin_lat || !origin_lng) originCoords = await geocode(origin_address);
    if (!destination_lat || !destination_lng) destCoords = await geocode(destination_address);

    const polyline = await getPolyline(
      originCoords.lng, originCoords.lat,
      destCoords.lng, destCoords.lat
    );

    const { data: ride, error } = await supabase
      .from('rides')
      .insert({
        poster_id: req.user.id,
        origin_address,
        origin_lat: originCoords.lat,
        origin_lng: originCoords.lng,
        destination_address,
        destination_lat: destCoords.lat,
        destination_lng: destCoords.lng,
        start_time,
        total_seats,
        seats_remaining: total_seats,
        fare_per_seat,
        route_polyline: polyline
      })
      .select()
      .single();

    if (error) throw error;
    res.json(ride);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/rides/:id — single ride with poster info
router.get('/:id', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('rides')
    .select('*, poster:poster_id(id, name, phone, created_at)')
    .eq('id', req.params.id)
    .single();

  if (error) return res.status(404).json({ error: 'Ride not found' });
  res.json(data);
});

module.exports = router;

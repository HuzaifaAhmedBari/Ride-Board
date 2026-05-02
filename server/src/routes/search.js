const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/auth');
const { haversineDistance } = require('../utils/geo');
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const PICKUP_RADIUS_KM      = 5;  // rider's pickup must be within this of any point on the route polyline
const DESTINATION_RADIUS_KM = 3;  // rider's dropoff must be within this of the route's destination

// POST /api/search
// Body: { pickup_lat, pickup_lng, dropoff_lat, dropoff_lng }
// All coordinates come from MapPicker on the frontend — no geocoding needed here
router.post('/', requireAuth, async (req, res) => {
  const { pickup_lat, pickup_lng, dropoff_lat, dropoff_lng } = req.body;

  if (pickup_lat == null || pickup_lng == null || dropoff_lat == null || dropoff_lng == null) {
    // If no coordinates are provided, just return all active rides
    const { data: rides, error } = await supabase
      .from('rides')
      .select('*, poster:poster_id(id, name, email, phone)')
      .eq('status', 'active')
      .order('fare_per_seat', { ascending: true });
    
    if (error) return res.status(500).json({ error: error.message });
    return res.json(rides);
  }

  try {
    // Fetch all active rides, cheapest first
    const { data: rides, error } = await supabase
      .from('rides')
      .select('*, poster:poster_id(id, name, email, phone)')
      .eq('status', 'active')
      .order('fare_per_seat', { ascending: true });

    if (error) throw error;

    const results = rides.reduce((acc, ride) => {
      // 1. Destination must be near the route's destination
      const dropoffDist = haversineDistance(dropoff_lat, dropoff_lng, ride.destination_lat, ride.destination_lng);
      if (dropoffDist > DESTINATION_RADIUS_KM) return acc;

      // 2. Pickup must be near any point on the route polyline
      let minPickupDist = Infinity;

      if (ride.route_polyline && ride.route_polyline.coordinates) {
        // GeoJSON LineString coordinates: [[lng, lat], [lng, lat], ...]
        const coords = ride.route_polyline.coordinates;
        // Optimization: Step through polyline points to reduce compute time
        const STEP = 5;
        for (let i = 0; i < coords.length; i += STEP) {
          const [lng, lat] = coords[i];
          const dist = haversineDistance(pickup_lat, pickup_lng, lat, lng);
          if (dist < minPickupDist) {
            minPickupDist = dist;
          }
        }
      } else {
        // Fallback if no polyline is available
        minPickupDist = haversineDistance(pickup_lat, pickup_lng, ride.origin_lat, ride.origin_lng);
      }

      if (minPickupDist <= PICKUP_RADIUS_KM) {
        acc.push({
          ...ride,
          pickup_distance_km: parseFloat(minPickupDist.toFixed(1)),
          dropoff_distance_km: parseFloat(dropoffDist.toFixed(1))
        });
      }

      return acc;
    }, []);
    // Already sorted cheapest-first by DB; both filters preserve that order

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

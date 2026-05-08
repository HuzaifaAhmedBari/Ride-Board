const express = require('express');
const router = express.Router();
const supabase = require('../db');
const { haversineDistance } = require('../utils/geo');

// Proximity thresholds for ride matching
const PICKUP_RADIUS_KM      = 1; // rider's pickup must be within this of any point on the route polyline
const DESTINATION_RADIUS_KM = 2; // rider's dropoff must be within this of the route's destination

/**
 * POST /api/search
 * Public — no auth required. Accepts optional pickup/dropoff coordinates.
 * If no coordinates are provided, returns all active rides sorted by fare.
 */
router.post('/', async (req, res) => {
  const { pickup_lat, pickup_lng, dropoff_lat, dropoff_lng } = req.body;

  // No location filter — return all active rides cheapest-first
  if (pickup_lat == null && dropoff_lat == null) {
    const { data: rides, error } = await supabase
      .from('rides')
      .select(`
        *, 
        poster:poster_id(
          id, name, email, phone,
          rating:user_ratings!reviewee_id(avg_rating, review_count)
        )
      `)
      .eq('status', 'active')
      .gt('seats_remaining', 0)
      .order('fare_per_seat', { ascending: true });

    if (error) return res.status(500).json({ error: error.message });
    return res.json(rides);
  }

  try {
    const { data: rides, error } = await supabase
      .from('rides')
      .select(`
        *, 
        poster:poster_id(
          id, name, email, phone,
          rating:user_ratings!reviewee_id(avg_rating, review_count)
        )
      `)
      .eq('status', 'active')
      .gt('seats_remaining', 0)
      .order('fare_per_seat', { ascending: true });

    if (error) throw error;

    const results = rides.reduce((acc, ride) => {
      // 1. Rider's dropoff must be near the route's destination
      let dropoffDist = 0;
      if (dropoff_lat != null && dropoff_lng != null) {
        dropoffDist = haversineDistance(dropoff_lat, dropoff_lng, ride.destination_lat, ride.destination_lng);
        if (dropoffDist > DESTINATION_RADIUS_KM) return acc;
      }

      // 2. Rider's pickup must be near any point on the route polyline
      let minPickupDist = 0;
      if (pickup_lat != null && pickup_lng != null) {
        minPickupDist = Infinity;
        if (ride.route_polyline?.coordinates) {
          const coords = ride.route_polyline.coordinates;
          const STEP = 5;
          for (let i = 0; i < coords.length; i += STEP) {
            const [lng, lat] = coords[i];
            const dist = haversineDistance(pickup_lat, pickup_lng, lat, lng);
            if (dist < minPickupDist) minPickupDist = dist;
          }
        } else {
          minPickupDist = haversineDistance(pickup_lat, pickup_lng, ride.origin_lat, ride.origin_lng);
        }

        if (minPickupDist > PICKUP_RADIUS_KM) return acc;
      }

      acc.push({
        ...ride,
        pickup_distance_km:  pickup_lat != null ? parseFloat(minPickupDist.toFixed(1)) : null,
        dropoff_distance_km: dropoff_lat != null ? parseFloat(dropoffDist.toFixed(1)) : null
      });

      return acc;
    }, []);

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

/**
 * seed.js  —  Run with:  node seed.js
 *
 * Creates 3 test users (auth + public profile), inserts realistic Karachi rides
 * with OSRM-backed polylines decimated to ≤ 30 points each, and one sample booking.
 */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const OSRM_BASE = process.env.OSRM_BASE_URL || 'https://router.project-osrm.org';
const MAX_POLYLINE_POINTS = 30; // keep stored polylines small

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Fetch a GeoJSON LineString from OSRM between two points and decimate it. */
async function fetchPolyline(originLng, originLat, destLng, destLat) {
  try {
    const { data } = await axios.get(
      `${OSRM_BASE}/route/v1/driving/${originLng},${originLat};${destLng},${destLat}`,
      { params: { overview: 'full', geometries: 'geojson' }, timeout: 8000 }
    );
    if (data.code !== 'Ok') return null;
    const coords = data.routes[0].geometry.coordinates;
    return {
      type: 'LineString',
      coordinates: decimateCoords(coords, MAX_POLYLINE_POINTS)
    };
  } catch (err) {
    console.warn(`  ⚠ OSRM failed (${err.message}), polyline will be null`);
    return null;
  }
}

/**
 * Reduce an array of [lng, lat] coordinates to at most maxPoints
 * using uniform stride sampling so the shape is preserved.
 */
function decimateCoords(coords, maxPoints) {
  if (coords.length <= maxPoints) return coords;
  const step = Math.ceil(coords.length / maxPoints);
  const out = [];
  for (let i = 0; i < coords.length; i += step) out.push(coords[i]);
  // Always include the final point
  if (out[out.length - 1] !== coords[coords.length - 1]) {
    out.push(coords[coords.length - 1]);
  }
  return out;
}

/** Create a Supabase auth user and their public.users profile. */
async function createUser(email, password, name, phone) {
  // Create auth user
  const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
    email, password, email_confirm: true
  });
  if (authErr) throw new Error(`Auth create failed for ${email}: ${authErr.message}`);

  const userId = authData.user.id;

  // Create public profile
  const { error: profileErr } = await supabase.from('users').insert({ id: userId, name, email, phone });
  if (profileErr) throw new Error(`Profile create failed for ${email}: ${profileErr.message}`);

  console.log(`  ✅ User "${name}" (${email}) created — id: ${userId}`);
  return userId;
}

// ─── Seed Data ────────────────────────────────────────────────────────────────

const USERS = [
  { email: 'ali@rideboard.com',    password: 'password123', name: 'Ali Khan',    phone: '+92 300-1234567' },
  { email: 'sara@rideboard.com',   password: 'password123', name: 'Sara Ahmed',  phone: '+92 321-9876543' },
  { email: 'usman@rideboard.com',  password: 'password123', name: 'Usman Raza',  phone: '+92 333-5556677' },
];

/**
 * Rides as [poster index, origin{address,lat,lng}, dest{address,lat,lng}, hoursFromNow, seats, fare]
 * All coordinates are real locations around Karachi.
 */
const RIDES_SPEC = [
  {
    posterIdx: 0,
    origin: { address: 'Gulshan-e-Iqbal, Karachi', lat: 24.9180, lng: 67.0971 },
    dest:   { address: 'Clifton, Karachi',          lat: 24.8138, lng: 67.0325 },
    hoursFromNow: 2, seats: 3, fare: 300
  },
  {
    posterIdx: 1,
    origin: { address: 'DHA Phase 6, Karachi',   lat: 24.7993, lng: 67.0648 },
    dest:   { address: 'Saddar, Karachi',         lat: 24.8607, lng: 67.0101 },
    hoursFromNow: 4, seats: 2, fare: 200
  },
  {
    posterIdx: 0,
    origin: { address: 'North Nazimabad, Karachi', lat: 24.9453, lng: 67.0323 },
    dest:   { address: 'University of Karachi',    lat: 24.9421, lng: 67.1147 },
    hoursFromNow: 6, seats: 4, fare: 150
  },
  {
    posterIdx: 2,
    origin: { address: 'Korangi, Karachi',       lat: 24.8237, lng: 67.1287 },
    dest:   { address: 'Gulshan-e-Iqbal, Karachi', lat: 24.9180, lng: 67.0971 },
    hoursFromNow: 8, seats: 1, fare: 250
  },
  {
    posterIdx: 1,
    origin: { address: 'Malir, Karachi',         lat: 24.9000, lng: 67.1800 },
    dest:   { address: 'DHA Phase 2, Karachi',   lat: 24.8147, lng: 67.0780 },
    hoursFromNow: 10, seats: 3, fare: 400
  },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

async function seed() {
  console.log('\n=== RideBoard Seed Script ===\n');

  // 1. Create users
  console.log('Creating users...');
  const userIds = [];
  for (const u of USERS) {
    const id = await createUser(u.email, u.password, u.name, u.phone);
    userIds.push(id);
  }

  // 2. Create rides with real polylines
  console.log('\nCreating rides with OSRM polylines...');
  const rideIds = [];

  for (const spec of RIDES_SPEC) {
    const { origin, dest, hoursFromNow, seats, fare, posterIdx } = spec;
    const startTime = new Date(Date.now() + hoursFromNow * 60 * 60 * 1000).toISOString();

    console.log(`  Fetching polyline: ${origin.address} → ${dest.address}`);
    const polyline = await fetchPolyline(origin.lng, origin.lat, dest.lng, dest.lat);
    const pointCount = polyline?.coordinates?.length ?? 0;
    console.log(`  ↳ Polyline: ${pointCount} points (capped at ${MAX_POLYLINE_POINTS})`);

    const { data: ride, error } = await supabase
      .from('rides')
      .insert({
        poster_id:           userIds[posterIdx],
        origin_address:      origin.address,
        origin_lat:          origin.lat,
        origin_lng:          origin.lng,
        destination_address: dest.address,
        destination_lat:     dest.lat,
        destination_lng:     dest.lng,
        start_time:          startTime,
        total_seats:         seats,
        seats_remaining:     seats,
        fare_per_seat:       fare,
        route_polyline:      polyline,
        status:              'active'
      })
      .select('id')
      .single();

    if (error) {
      console.error(`  ❌ Failed to insert ride: ${error.message}`);
    } else {
      console.log(`  ✅ Ride inserted — id: ${ride.id}`);
      rideIds.push({ rideId: ride.id, posterIdx, seats });
    }
  }

  // 3. Create one sample booking (user Sara books Ali's first ride)
  console.log('\nCreating sample booking...');
  const targetRide = rideIds[0]; // Ali's first ride
  if (targetRide && userIds[1]) {
    // Decrement seat
    const { error: seatErr } = await supabase
      .from('rides')
      .update({ seats_remaining: targetRide.seats - 1 })
      .eq('id', targetRide.rideId);

    if (seatErr) {
      console.error('  ❌ Seat decrement failed:', seatErr.message);
    } else {
      const { error: bookErr } = await supabase
        .from('bookings')
        .insert({ ride_id: targetRide.rideId, rider_id: userIds[1] });

      if (bookErr) {
        console.error('  ❌ Booking insert failed:', bookErr.message);
      } else {
        console.log(`  ✅ Sara booked Ali's ride`);
      }
    }
  }

  console.log('\n=== Seed Complete ===');
  console.log('\nTest credentials (all passwords: password123):');
  USERS.forEach(u => console.log(`  ${u.name.padEnd(14)} — ${u.email}`));
}

seed().catch(err => {
  console.error('\n❌ Seed failed:', err.message);
  process.exit(1);
});

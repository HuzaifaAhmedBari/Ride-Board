/**
 * seed.js  —  Run with:  node seed.js
 *
 * Creates 4 test users, inserts active and COMPLETED rides,
 * diverse bookings, and a rich set of reviews for a "lived-in" feel.
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
const MAX_POLYLINE_POINTS = 30;

async function fetchPolyline(originLng, originLat, destLng, destLat) {
  try {
    const { data } = await axios.get(
      `${OSRM_BASE}/route/v1/driving/${originLng},${originLat};${destLng},${destLat}`,
      { params: { overview: 'full', geometries: 'geojson' }, timeout: 8000 }
    );
    if (data.code !== 'Ok') return null;
    return { type: 'LineString', coordinates: decimateCoords(data.routes[0].geometry.coordinates, MAX_POLYLINE_POINTS) };
  } catch (err) { return null; }
}

function decimateCoords(coords, maxPoints) {
  if (coords.length <= maxPoints) return coords;
  const step = Math.ceil(coords.length / maxPoints);
  const out = [];
  for (let i = 0; i < coords.length; i += step) out.push(coords[i]);
  if (out[out.length - 1] !== coords[coords.length - 1]) out.push(coords[coords.length - 1]);
  return out;
}

async function createUser(email, password, name, phone) {
  const { data: authData, error: authErr } = await supabase.auth.admin.createUser({ email, password, email_confirm: true });
  if (authErr) throw new Error(`Auth fail: ${authErr.message}`);
  const userId = authData.user.id;
  await supabase.from('users').insert({ id: userId, name, email, phone });
  console.log(`  ✅ User "${name}" created`);
  return userId;
}

const USERS = [
  { email: 'ali@rideboard.com',    password: 'password123', name: 'Ali Khan',    phone: '+92 300-1112222' },
  { email: 'sara@rideboard.com',   password: 'password123', name: 'Sara Ahmed',  phone: '+92 321-3334444' },
  { email: 'usman@rideboard.com',  password: 'password123', name: 'Usman Raza',  phone: '+92 333-5556666' },
  { email: 'zainab@rideboard.com', password: 'password123', name: 'Zainab Malik', phone: '+92 345-7778888' },
];

const RIDES_SPEC = [
  // Active
  { p: 0, o: 'Gulshan', ol: [67.0971, 24.9180], d: 'Clifton', dl: [67.0325, 24.8138], h: 3, s: 3, f: 300, st: 'active' },
  { p: 1, o: 'DHA Ph 6', ol: [67.0648, 24.7993], d: 'Saddar', dl: [67.0101, 24.8607], h: 5, s: 2, f: 200, st: 'active' },
  { p: 2, o: 'North Nazimabad', ol: [67.0323, 24.9453], d: 'Airport', dl: [67.1610, 24.9060], h: 8, s: 4, f: 500, st: 'active' },
  { p: 3, o: 'Johar Ph 1', ol: [67.1350, 24.9200], d: 'Bahria Town', dl: [67.3300, 24.9800], h: 12, s: 3, f: 800, st: 'active' },
  
  // Completed
  { p: 2, o: 'Korangi', ol: [67.1287, 24.8237], d: 'Gulshan', dl: [67.0971, 24.9180], h: -24, s: 4, f: 250, st: 'expired' },
  { p: 0, o: 'Malir', ol: [67.1800, 24.9000], d: 'DHA Ph 2', dl: [67.0780, 24.8147], h: -48, s: 4, f: 400, st: 'expired' },
  { p: 1, o: 'Saddar', ol: [67.0101, 24.8607], d: 'Clifton', dl: [67.0325, 24.8138], h: -72, s: 3, f: 200, st: 'expired' },
  { p: 3, o: 'Defence Ph 5', ol: [67.0600, 24.8100], d: 'Tariq Road', dl: [67.0600, 24.8700], h: -96, s: 4, f: 150, st: 'expired' },
  { p: 0, o: 'Nazimabad', ol: [67.0300, 24.9100], d: 'Civic Center', dl: [67.0700, 24.8900], h: -120, s: 2, f: 100, st: 'expired' },
];

async function seed() {
  console.log('\n=== RideBoard Mega Seed ===\n');
  const ids = [];
  for (const u of USERS) ids.push(await createUser(u.email, u.password, u.name, u.phone));

  const rideIds = [];
  for (const sp of RIDES_SPEC) {
    const poly = await fetchPolyline(sp.ol[0], sp.ol[1], sp.dl[0], sp.dl[1]);
    const { data: r } = await supabase.from('rides').insert({
      poster_id: ids[sp.p], origin_address: sp.o, origin_lat: sp.ol[1], origin_lng: sp.ol[0],
      destination_address: sp.d, destination_lat: sp.dl[1], destination_lng: sp.dl[0],
      start_time: new Date(Date.now() + sp.h * 3600000).toISOString(), total_seats: sp.s, seats_remaining: sp.s,
      fare_per_seat: sp.f, route_polyline: poly, status: sp.st
    }).select('id').single();
    rideIds.push(r.id);
  }

  console.log('\nCreating history, bookings and reviews...');
  
  // 1. Sara reviews Usman (Ride 4)
  await supabase.from('bookings').insert({ ride_id: rideIds[4], rider_id: ids[1] });
  await supabase.from('reviews').insert({ ride_id: rideIds[4], reviewer_id: ids[1], reviewee_id: ids[2], rating: 5, comment: 'Punctual and very smooth drive!' });

  // 2. Usman reviews Ali (Ride 5)
  await supabase.from('bookings').insert({ ride_id: rideIds[5], rider_id: ids[2] });
  await supabase.from('reviews').insert({ ride_id: rideIds[5], reviewer_id: ids[2], reviewee_id: ids[0], rating: 4, comment: 'Nice car, bit talkative driver.' });

  // 3. Zainab reviews Sara (Ride 6)
  await supabase.from('bookings').insert({ ride_id: rideIds[6], rider_id: ids[3] });
  await supabase.from('reviews').insert({ ride_id: rideIds[6], reviewer_id: ids[3], reviewee_id: ids[1], rating: 5, comment: 'Best carpooling experience in Karachi!' });

  // 4. Ali reviews Zainab (Ride 7)
  await supabase.from('bookings').insert({ ride_id: rideIds[7], rider_id: ids[0] });
  await supabase.from('reviews').insert({ ride_id: rideIds[7], reviewer_id: ids[0], reviewee_id: ids[3], rating: 4, comment: 'Safe driving.' });

  // 5. Unreviewed ride for testing (Ali booked Zainab's ride 7? No, Zainab booked Ali)
  // Let's make Ride 8 (Ali) unreviewed by Usman
  await supabase.from('bookings').insert({ ride_id: rideIds[8], rider_id: ids[2] });

  console.log('  ✅ 5 Completed rides seeded with 4 reviews');
  console.log('\n=== Seed Complete ===');
}

seed().catch(err => { console.error('\n❌ Seed failed:', err.message); process.exit(1); });

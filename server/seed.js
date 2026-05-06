/**
 * seed.js - Populates the database with future rides, users, and bookings.
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

async function fetchPolyline(originLng, originLat, destLng, destLat) {
  try {
    const { data } = await axios.get(
      `${OSRM_BASE}/route/v1/driving/${originLng},${originLat};${destLng},${destLat}`,
      { params: { overview: 'full', geometries: 'geojson' }, timeout: 8000 }
    );
    if (data.code !== 'Ok') return null;
    return { type: 'LineString', coordinates: data.routes[0].geometry.coordinates };
  } catch (err) { return null; }
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
  { p: 0, o: 'Gulshan', ol: [67.0971, 24.9180], d: 'Clifton', dl: [67.0325, 24.8138], h: 24, s: 3, f: 300, st: 'active' },
  { p: 1, o: 'DHA Ph 6', ol: [67.0648, 24.7993], d: 'Saddar', dl: [67.0101, 24.8607], h: 48, s: 2, f: 200, st: 'active' },
  { p: 2, o: 'North Nazimabad', ol: [67.0323, 24.9453], d: 'Airport', dl: [67.1610, 24.9060], h: 72, s: 4, f: 500, st: 'active' },
  { p: 3, o: 'Johar Ph 1', ol: [67.1350, 24.9200], d: 'Bahria Town', dl: [67.3300, 24.9800], h: 96, s: 3, f: 800, st: 'active' },
];

async function seed() {
  console.log('\n=== RideBoard Seed (Future Rides Only) ===\n');
  const ids = [];
  for (const u of USERS) ids.push(await createUser(u.email, u.password, u.name, u.phone));

  for (const sp of RIDES_SPEC) {
    const poly = await fetchPolyline(sp.ol[0], sp.ol[1], sp.dl[0], sp.dl[1]);
    await supabase.from('rides').insert({
      poster_id: ids[sp.p], origin_address: sp.o, origin_lat: sp.ol[1], origin_lng: sp.ol[0],
      destination_address: sp.d, destination_lat: sp.dl[1], destination_lng: sp.dl[0],
      start_time: new Date(Date.now() + sp.h * 3600000).toISOString(), total_seats: sp.s, seats_remaining: sp.s,
      fare_per_seat: sp.f, route_polyline: poly, status: sp.st
    });
  }

  console.log('\n=== Seed Complete ===');
}

seed().catch(err => { console.error('\n❌ Seed failed:', err.message); process.exit(1); });


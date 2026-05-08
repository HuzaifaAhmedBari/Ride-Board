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
  { email: 'fatima@rideboard.com', password: 'password123', name: 'Fatima Noor',  phone: '+92 300-8889999' },
  { email: 'hamza@rideboard.com',  password: 'password123', name: 'Hamza Sheikh', phone: '+92 311-2223333' },
  { email: 'aisha@rideboard.com',  password: 'password123', name: 'Aisha Siddiqui', phone: '+92 322-4445555' },
  { email: 'bilal@rideboard.com',  password: 'password123', name: 'Bilal Javed',  phone: '+92 333-6667777' },
];

const RIDES_SPEC = [
  { p: 0, o: 'Gulshan', ol: [67.0971, 24.9180], d: 'Clifton', dl: [67.0325, 24.8138], h: 4, s: 3, f: 300, st: 'active' },
  { p: 1, o: 'DHA Ph 6', ol: [67.0648, 24.7993], d: 'Saddar', dl: [67.0101, 24.8607], h: 8, s: 2, f: 200, st: 'active' },
  { p: 2, o: 'North Nazimabad', ol: [67.0323, 24.9453], d: 'Airport', dl: [67.1610, 24.9060], h: 12, s: 4, f: 500, st: 'active' },
  { p: 3, o: 'Johar Ph 1', ol: [67.1350, 24.9200], d: 'Bahria Town', dl: [67.3300, 24.9800], h: 24, s: 3, f: 800, st: 'active' },
  { p: 4, o: 'Malir', ol: [67.1957, 24.8920], d: 'Tariq Road', dl: [67.0583, 24.8722], h: 2, s: 4, f: 250, st: 'active' },
  { p: 5, o: 'Korangi', ol: [67.1167, 24.8333], d: 'LuckyOne Mall', dl: [67.0894, 24.9258], h: 6, s: 3, f: 350, st: 'active' },
  { p: 6, o: 'Orangi', ol: [66.9934, 24.9472], d: 'Garden East', dl: [67.0286, 24.8770], h: 18, s: 2, f: 150, st: 'active' },
  { p: 7, o: 'DHA Ph 8', ol: [67.0700, 24.7800], d: 'Nazimabad 7', dl: [67.0300, 24.9100], h: 36, s: 4, f: 450, st: 'active' },
  { p: 0, o: 'Federal B Area', ol: [67.0694, 24.9353], d: 'Kemari', dl: [66.9750, 24.8210], h: 48, s: 3, f: 400, st: 'active' },
  { p: 1, o: 'PECHS', ol: [67.0600, 24.8700], d: 'Steel Town', dl: [67.3400, 24.8500], h: 72, s: 2, f: 600, st: 'active' },
];

async function seed() {
  console.log('\n=== RideBoard Seed (Enriched Data) ===\n');
  const userIds = [];
  for (const u of USERS) {
    userIds.push(await createUser(u.email, u.password, u.name, u.phone));
  }

  const rideIds = [];
  for (const sp of RIDES_SPEC) {
    const poly = await fetchPolyline(sp.ol[0], sp.ol[1], sp.dl[0], sp.dl[1]);
    const { data: rideData, error: rideErr } = await supabase.from('rides').insert({
      poster_id: userIds[sp.p], 
      origin_address: sp.o, origin_lat: sp.ol[1], origin_lng: sp.ol[0],
      destination_address: sp.d, destination_lat: sp.dl[1], destination_lng: sp.dl[0],
      start_time: new Date(Date.now() + sp.h * 3600000).toISOString(), 
      total_seats: sp.s, seats_remaining: sp.s,
      fare_per_seat: sp.f, route_polyline: poly, status: sp.st
    }).select();
    
    if (rideErr) {
      console.error(`  ❌ Failed to create ride from ${sp.o}: ${rideErr.message}`);
    } else if (rideData && rideData[0]) {
      rideIds.push(rideData[0].id);
      console.log(`  ✅ Ride from "${sp.o}" to "${sp.d}" created`);
    }
  }

  console.log('\n=== Creating Sample Bookings ===\n');
  // Add some random bookings (ensuring rider is not the poster)
  for (let i = 0; i < 8; i++) {
    const randomRideIndex = Math.floor(Math.random() * RIDES_SPEC.length);
    const ride = RIDES_SPEC[randomRideIndex];
    const rideId = rideIds[randomRideIndex];
    
    // Pick a random user who is not the poster
    let riderIndex;
    do {
      riderIndex = Math.floor(Math.random() * userIds.length);
    } while (riderIndex === ride.p);

    const { error: bookErr } = await supabase.from('bookings').insert({
      ride_id: rideId,
      rider_id: userIds[riderIndex],
      status: 'confirmed'
    });

    if (bookErr) {
      if (bookErr.code !== '23505') { // Ignore unique constraint errors
        console.error(`  ❌ Booking failed: ${bookErr.message}`);
      }
    } else {
      // Manually decrement seats_remaining for the ride
      const { data: currentRide } = await supabase.from('rides').select('seats_remaining').eq('id', rideId).single();
      if (currentRide && currentRide.seats_remaining > 0) {
        await supabase.from('rides').update({ seats_remaining: currentRide.seats_remaining - 1 }).eq('id', rideId);
        console.log(`  ✅ Booking created: User "${USERS[riderIndex].name}" joined Ride from "${ride.o}"`);
      }
    }
  }

  console.log('\n=== Seed Complete ===');
}

seed().catch(err => { console.error('\n❌ Seed failed:', err.message); process.exit(1); });


const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/auth');
const { sendBookingConfirmationRider, sendBookingNotificationDriver } = require('../services/email');
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// POST /api/bookings
router.post('/', requireAuth, async (req, res) => {
  const { ride_id } = req.body;
  if (!ride_id) return res.status(400).json({ error: 'ride_id is required' });

  try {
    // Fetch ride with poster info
    const { data: ride, error: rideErr } = await supabase
      .from('rides')
      .select('*, poster:poster_id(id, name, phone)')
      .eq('id', ride_id)
      .single();

    if (rideErr || !ride) return res.status(404).json({ error: 'Ride not found' });
    if (ride.status !== 'active') return res.status(409).json({ error: 'Ride is no longer available' });
    if (ride.seats_remaining <= 0) return res.status(409).json({ error: 'No seats remaining' });
    if (ride.poster_id === req.user.id) return res.status(400).json({ error: 'You cannot book your own ride' });

    // Decrement seat with optimistic concurrency check
    const newSeats = ride.seats_remaining - 1;
    const { error: updateErr } = await supabase
      .from('rides')
      .update({
        seats_remaining: newSeats,
        status: newSeats === 0 ? 'full' : 'active'
      })
      .eq('id', ride_id)
      .eq('seats_remaining', ride.seats_remaining)  // fails if another booking snuck in
      .eq('status', 'active');

    if (updateErr) return res.status(409).json({ error: 'Seat no longer available, please try again' });

    // Ensure the rider exists in public.users to prevent foreign key errors
    const { data: existingRider } = await supabase.from('users').select('id').eq('id', req.user.id).single();
    if (!existingRider) {
      await supabase.from('users').insert({ 
        id: req.user.id, 
        name: req.user.email?.split('@')[0] || 'Rider' 
      });
    }

    // Insert booking record
    const { data: booking, error: bookErr } = await supabase
      .from('bookings')
      .insert({ ride_id, rider_id: req.user.id })
      .select()
      .single();

    if (bookErr) {
      // Roll back seat decrement on booking insert failure
      await supabase.from('rides').update({
        seats_remaining: ride.seats_remaining,
        status: 'active'
      }).eq('id', ride_id);
      return res.status(400).json({ error: bookErr.message });
    }

    // Fetch rider profile for emails
    const { data: rider } = await supabase
      .from('users').select('name, phone').eq('id', req.user.id).single();

    // Fire-and-forget emails
    sendBookingConfirmationRider({
      riderEmail: req.user.email,
      riderName: rider.name,
      driverName: ride.poster.name,
      origin: ride.origin_address,
      destination: ride.destination_address,
      startTime: ride.start_time,
      fare: ride.fare_per_seat
    }).catch(console.error);

    // Fetch driver's auth email via admin API
    supabase.auth.admin.getUserById(ride.poster_id)
      .then(({ data: { user: driverUser } }) =>
        sendBookingNotificationDriver({
          driverEmail: driverUser.email,
          driverName: ride.poster.name,
          riderName: rider.name,
          riderPhone: rider.phone,
          origin: ride.origin_address,
          destination: ride.destination_address,
          startTime: ride.start_time
        })
      ).catch(console.error);

    res.json(booking);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

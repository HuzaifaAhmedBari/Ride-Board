const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/auth');
const supabase = require('../db');
const { sendBookingConfirmationRider, sendBookingNotificationDriver } = require('../services/email');

/**
 * POST /api/bookings  [Auth required]
 * Books one seat on an active ride and sends email notifications to both
 * the rider (confirmation) and the driver (alert).
 * Uses optimistic-concurrency on the seat update to prevent double-booking.
 */
router.post('/', requireAuth, async (req, res) => {
  const { ride_id } = req.body;
  if (!ride_id) return res.status(400).json({ error: 'ride_id is required' });

  try {
    // Fetch ride with poster contact info (email comes from public.users)
    const { data: ride, error: rideErr } = await supabase
      .from('rides')
      .select('*, poster:poster_id(id, name, email, phone)')
      .eq('id', ride_id)
      .single();

    if (rideErr || !ride) return res.status(404).json({ error: 'Ride not found' });
    if (ride.status !== 'active') return res.status(409).json({ error: 'Ride is no longer available' });
    if (ride.seats_remaining <= 0) return res.status(409).json({ error: 'No seats remaining' });
    if (ride.poster_id === req.user.id) return res.status(400).json({ error: 'You cannot book your own ride' });

    // Optimistic-concurrency seat decrement
    const newSeats = ride.seats_remaining - 1;
    const { error: updateErr } = await supabase
      .from('rides')
      .update({
        seats_remaining: newSeats,
        status: newSeats === 0 ? 'full' : 'active'
      })
      .eq('id', ride_id)
      .eq('seats_remaining', ride.seats_remaining) // guard against concurrent bookings
      .eq('status', 'active');

    if (updateErr) return res.status(409).json({ error: 'Seat no longer available, please try again' });

    // Ensure rider exists in public.users (may not if they skipped profile creation)
    const { data: existingRider } = await supabase
      .from('users').select('id').eq('id', req.user.id).single();

    if (!existingRider) {
      await supabase.from('users').insert({
        id:    req.user.id,
        name:  req.user.email?.split('@')[0] || 'Rider',
        email: req.user.email
      });
    }

    // Insert booking record
    const { data: booking, error: bookErr } = await supabase
      .from('bookings')
      .insert({ ride_id, rider_id: req.user.id })
      .select()
      .single();

    if (bookErr) {
      // Roll back seat decrement
      await supabase.from('rides').update({
        seats_remaining: ride.seats_remaining,
        status: 'active'
      }).eq('id', ride_id);
      
      if (bookErr.message?.includes('bookings_ride_id_rider_id_key')) {
        return res.status(409).json({ error: 'You have already booked this ride.' });
      }
      return res.status(400).json({ error: bookErr.message });
    }

    // Fetch rider's own profile for email personalisation
    const { data: riderProfile } = await supabase
      .from('users')
      .select('name, email, phone')
      .eq('id', req.user.id)
      .single();

    const riderName  = riderProfile?.name  || req.user.email?.split('@')[0] || 'Rider';
    const riderEmail = riderProfile?.email || req.user.email;
    const riderPhone = riderProfile?.phone || null;

    // Fire-and-forget email notifications (don't let email failure block the response)
    if (riderEmail) {
      sendBookingConfirmationRider({
        riderEmail,
        riderName,
        driverName:  ride.poster?.name,
        origin:      ride.origin_address,
        destination: ride.destination_address,
        startTime:   ride.start_time,
        fare:        ride.fare_per_seat
      }).catch(e => console.error('Rider email error:', e));
    }

    if (ride.poster?.email) {
      sendBookingNotificationDriver({
        driverEmail: ride.poster.email,
        driverName:  ride.poster.name,
        riderName,
        riderPhone,
        origin:      ride.origin_address,
        destination: ride.destination_address,
        startTime:   ride.start_time
      }).catch(e => console.error('Driver email error:', e));
    }

    res.json(booking);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/bookings/:ride_id
 * Cancels a booking for the authenticated user and frees up the seat.
 */
router.delete('/:ride_id', requireAuth, async (req, res) => {
  const { ride_id } = req.params;

  try {
    // 1. Delete the booking
    const { data: booking, error: deleteErr } = await supabase
      .from('bookings')
      .delete()
      .eq('ride_id', ride_id)
      .eq('rider_id', req.user.id)
      .select()
      .single();

    if (deleteErr || !booking) {
      return res.status(400).json({ error: 'Booking not found or could not be cancelled' });
    }

    // 2. Increment seats remaining and optionally reactivate the ride
    const { data: ride } = await supabase.from('rides').select('seats_remaining, status').eq('id', ride_id).single();
    if (ride) {
      await supabase.from('rides').update({
        seats_remaining: ride.seats_remaining + 1,
        status: 'active' // Ensure it becomes active again if it was full
      }).eq('id', ride_id);
    }

    res.json({ success: true, message: 'Booking cancelled' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

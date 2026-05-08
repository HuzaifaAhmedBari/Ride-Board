const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/auth');
const supabase = require('../db');
const { sendBookingConfirmationRider, sendBookingNotificationDriver } = require('../services/email');

/**
 * POST /api/bookings  [Auth required]
 * Books one seat on an active ride.
 */
router.post('/', requireAuth, async (req, res) => {
  const { ride_id } = req.body;
  if (!ride_id) return res.status(400).json({ error: 'ride_id is required' });

  try {
    const { data: ride } = await supabase
      .from('rides')
      .select('*, poster:poster_id(id, name, email, phone)')
      .eq('id', ride_id)
      .single();

    if (!ride) return res.status(404).json({ error: 'Ride not found' });
    if (ride.status !== 'active') return res.status(409).json({ error: 'Ride no longer available' });
    if (ride.poster_id === req.user.id) return res.status(400).json({ error: 'Cannot book own ride' });

    const { data: existing } = await supabase.from('bookings').select('status').eq('ride_id', ride_id).eq('rider_id', req.user.id).single();
    if (existing?.status === 'confirmed') return res.status(409).json({ error: 'Already booked' });

    // Optimistic decrement
    const { error: updErr } = await supabase.from('rides').update({ seats_remaining: ride.seats_remaining - 1, status: ride.seats_remaining - 1 === 0 ? 'full' : 'active' }).eq('id', ride_id).eq('seats_remaining', ride.seats_remaining);
    if (updErr) return res.status(409).json({ error: 'Seat no longer available' });

    const { data: booking, error: bookErr } = await supabase.from('bookings').upsert({ ride_id, rider_id: req.user.id, status: 'confirmed' }, { onConflict: 'ride_id,rider_id' }).select().single();
    if (bookErr) {
      await supabase.from('rides').update({ seats_remaining: ride.seats_remaining, status: 'active' }).eq('id', ride_id);
      return res.status(400).json({ error: bookErr.message });
    }

    // Fire-and-forget notifications
    const riderName = req.user.email?.split('@')[0] || 'Rider';
    if (req.user.email) {
      sendBookingConfirmationRider({
        riderEmail: req.user.email, riderName, driverName: ride.poster?.name,
        origin: ride.origin_address, destination: ride.destination_address, startTime: ride.start_time, fare: ride.fare_per_seat
      }).catch(console.error);
    }
    if (ride.poster?.email) {
      sendBookingNotificationDriver({
        driverEmail: ride.poster.email, driverName: ride.poster.name, riderName,
        origin: ride.origin_address, destination: ride.destination_address, startTime: ride.start_time
      }).catch(console.error);
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
    // 1. Update the booking status to 'cancelled'
    const { data: booking, error: updateErr } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('ride_id', ride_id)
      .eq('rider_id', req.user.id)
      .neq('status', 'cancelled') // Only update if not already cancelled
      .select()
      .single();

    if (updateErr || !booking) {
      return res.status(400).json({ error: 'Booking already cancelled or not found' });
    }

    // 2. Increment seats remaining and reactivate the ride
    const { data: ride } = await supabase.from('rides').select('seats_remaining').eq('id', ride_id).single();
    if (ride) {
      await supabase.from('rides').update({
        seats_remaining: ride.seats_remaining + 1,
        status: 'active'
      }).eq('id', ride_id);
    }

    res.json({ success: true, message: 'Booking cancelled' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

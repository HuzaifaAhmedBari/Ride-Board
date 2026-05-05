const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/auth');
const supabase = require('../db');

/**
 * GET /api/messages/:ride_id
 * Fetches message history for a group chat.
 */
router.get('/:ride_id', requireAuth, async (req, res) => {
  const { ride_id } = req.params;

  try {
    // Verify user is authorized (driver or passenger)
    const { data: ride } = await supabase.from('rides').select('poster_id').eq('id', ride_id).single();
    const { data: booking } = await supabase.from('bookings').select('id').eq('ride_id', ride_id).eq('rider_id', req.user.id).single();

    if (!ride) return res.status(404).json({ error: 'Ride not found' });
    if (ride.poster_id !== req.user.id && !booking) {
      return res.status(403).json({ error: 'You are not authorized to view messages for this ride' });
    }

    const { data: messages, error } = await supabase
      .from('messages')
      .select('*, sender:sender_id(name)')
      .eq('ride_id', ride_id)
      .order('created_at', { ascending: true });

    if (error) throw error;
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/messages
 * Sends a message to a group chat.
 */
router.post('/', requireAuth, async (req, res) => {
  const { ride_id, content } = req.body;
  if (!ride_id || !content) return res.status(400).json({ error: 'ride_id and content are required' });

  try {
    // Verify user is authorized
    const { data: ride } = await supabase.from('rides').select('poster_id').eq('id', ride_id).single();
    const { data: booking } = await supabase.from('bookings').select('id').eq('ride_id', ride_id).eq('rider_id', req.user.id).single();

    if (!ride) return res.status(404).json({ error: 'Ride not found' });
    if (ride.poster_id !== req.user.id && !booking) {
      return res.status(403).json({ error: 'You are not authorized to send messages to this ride' });
    }

    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        ride_id,
        sender_id: req.user.id,
        content
      })
      .select('*, sender:sender_id(name)')
      .single();

    if (error) throw error;
    res.json(message);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

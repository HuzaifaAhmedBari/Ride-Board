import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import AddressSearchBox from '../components/AddressSearchBox';
import MapPicker from '../components/MapPicker';

export default function PostRidePage() {
  const navigate = useNavigate();
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [startTime, setStartTime] = useState('');
  const [seats, setSeats] = useState(1);
  const [fare, setFare] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!origin || !destination) {
      setError('Please place pins for both origin and destination.');
      return;
    }
    
    setLoading(true);
    setError('');

    // Check if start time is at least 15 minutes in the future
    const fifteenMinsFromNow = new Date(Date.now() + 15 * 60 * 1000);
    const selectedTime = new Date(startTime);
    if (selectedTime < fifteenMinsFromNow) {
      setError('Departure must be at least 15 minutes from now.');
      setLoading(false);
      return;
    }

    try {
      await api.post('/rides', {
        origin_address: origin.address,
        origin_lat: origin.lat,
        origin_lng: origin.lng,
        destination_address: destination.address,
        destination_lat: destination.lat,
        destination_lng: destination.lng,
        start_time: new Date(startTime).toISOString(),
        total_seats: parseInt(seats, 10),
        fare_per_seat: parseFloat(fare)
      });
      
      navigate('/find', { state: { message: 'Your ride is live!' } });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to post ride');
      setLoading(false);
    }
  }

  return (
    <div className="container">
      <div className="post-form-container">
        <h2 className="post-title">Post a Ride</h2>
        {error && <div className="toast toast-error">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Origin</label>
            <AddressSearchBox placeholder="Search origin..." onSelect={setOrigin} value={origin?.address} />
            <MapPicker value={origin} onChange={setOrigin} height={200} />
          </div>

          <div className="form-group">
            <label className="form-label">Destination</label>
            <AddressSearchBox placeholder="Search destination..." onSelect={setDestination} value={destination?.address} />
            <MapPicker value={destination} onChange={setDestination} height={200} />
          </div>

          <div className="form-group">
            <label className="form-label">Departure Date & Time</label>
            <input
              type="datetime-local"
              required
              className="form-input"
              value={startTime}
              onChange={e => setStartTime(e.target.value)}
              min={new Date(Date.now() + 15 * 60000).toISOString().slice(0, 16)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Available Seats (1-8)</label>
            <input
              type="number"
              required
              min="1"
              max="8"
              className="form-input"
              value={seats}
              onChange={e => setSeats(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Fare per Seat (PKR)</label>
            <input
              type="number"
              required
              min="0"
              step="10"
              className="form-input"
              value={fare}
              onChange={e => setFare(e.target.value)}
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: '1rem' }}
            disabled={loading}
          >
            {loading ? 'Posting...' : 'Post Ride'}
          </button>
        </form>
      </div>
    </div>
  );
}

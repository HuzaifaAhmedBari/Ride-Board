import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import api from '../api';
import AddressSearchBox from '../components/AddressSearchBox';
import MapPicker from '../components/MapPicker';
import RouteCard from '../components/RouteCard';
import { useAuthStore } from '../store/authStore';
import L from 'leaflet';

const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  shadowSize: [41, 41]
});
const blueIcon = new L.Icon.Default();

function MapUpdater({ selectedRide, pickup, dropoff }) {
  const map = useMap();
  
  useEffect(() => {
    if (selectedRide) {
      let bounds;
      // Use polyline coordinates if available, otherwise fallback to start/end points
      if (selectedRide.route_polyline?.coordinates?.length > 0) {
        const coords = selectedRide.route_polyline.coordinates.map(c => [c[1], c[0]]);
        bounds = L.latLngBounds(coords);
      } else {
        bounds = L.latLngBounds([
          [selectedRide.origin_lat, selectedRide.origin_lng],
          [selectedRide.destination_lat, selectedRide.destination_lng]
        ]);
      }
      
      // Include user's pickup/dropoff in the view if they exist
      if (pickup) bounds.extend([pickup.lat, pickup.lng]);
      if (dropoff) bounds.extend([dropoff.lat, dropoff.lng]);
      
      // Slight delay ensures the map container is fully sized before fitting bounds
      setTimeout(() => {
        map.fitBounds(bounds, { padding: [40, 40], animate: true, maxZoom: 15 });
      }, 50);

    } else if (pickup && dropoff) {
      const bounds = L.latLngBounds([[pickup.lat, pickup.lng], [dropoff.lat, dropoff.lng]]);
      map.fitBounds(bounds, { padding: [40, 40] });
    } else if (pickup) {
      map.setView([pickup.lat, pickup.lng], 13);
    } else if (dropoff) {
      map.setView([dropoff.lat, dropoff.lng], 13);
    }
  }, [selectedRide, pickup, dropoff, map]);
  
  return null;
}

function MapModal({ isOpen, onClose, onConfirm, initialPos }) {
  const [pos, setPos] = useState(initialPos);
  useEffect(() => { if (isOpen) setPos(initialPos); }, [isOpen, initialPos]);
  
  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
      <div style={{ background: 'var(--surface)', padding: '2rem', borderRadius: '1rem', width: '90%', maxWidth: '600px', border: '1px solid var(--border)', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
        <h3 style={{ marginBottom: '1rem', color: 'var(--text)' }}>Choose from Map</h3>
        <MapPicker value={pos} onChange={setPos} height={350} />
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => onConfirm(pos)} disabled={!pos}>Confirm</button>
        </div>
      </div>
    </div>
  );
}

export default function FindRidePage() {
  const { user } = useAuthStore();
  const [pickup, setPickup] = useState(null);
  const [dropoff, setDropoff] = useState(null);
  const [results, setResults] = useState([]);
  const [selectedRide, setSelectedRide] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bookingError, setBookingError] = useState('');

  const [mapModalOpen, setMapModalOpen] = useState(null); // 'pickup' | 'dropoff' | null

  const [bookedRideIds, setBookedRideIds] = useState(new Set());

  // Load all rides by default
  useEffect(() => {
    async function loadAll() {
      setLoading(true);
      try {
        const { data } = await api.post('/search', {});
        setResults(data);
      } catch (err) {
        setError('Failed to load rides');
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, []);

  async function handleSearch() {
    setLoading(true);
    setError('');
    setSelectedRide(null);

    const payload = (pickup && dropoff) ? {
      pickup_lat: pickup.lat, pickup_lng: pickup.lng,
      dropoff_lat: dropoff.lat, dropoff_lng: dropoff.lng
    } : {};

    try {
      const { data } = await api.post('/search', payload);
      setResults(data);
      if (data.length === 0 && payload.pickup_lat) {
        setError('No rides found near these locations.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Search failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleBook(ride) {
    setBookingError('');
    try {
      await api.post('/bookings', { ride_id: ride.id });
      setBookedRideIds(prev => new Set(prev).add(ride.id));
      setResults(prev => prev.map(r => 
        r.id === ride.id 
          ? { ...r, seats_remaining: r.seats_remaining - 1, status: r.seats_remaining - 1 === 0 ? 'full' : 'active' }
          : r
      ));

      // NEW: Send Emails from Frontend
      const emailParams = {
        service_id: import.meta.env.VITE_EMAILJS_SERVICE_ID,
        public_key: import.meta.env.VITE_EMAILJS_PUBLIC_KEY,
        rider_template: import.meta.env.VITE_EMAILJS_RIDER_TEMPLATE_ID,
        driver_template: import.meta.env.VITE_EMAILJS_DRIVER_TEMPLATE_ID,
      };

      if (emailParams.service_id && emailParams.public_key) {
        // 1. Send Confirmation to Rider
        emailjs.send(
          emailParams.service_id,
          emailParams.rider_template,
          {
            to_email: user.email,
            rider_name: profile?.name || 'Rider',
            driver_name: ride.poster.name,
            origin: ride.origin_address,
            destination: ride.destination_address,
            start_time: new Date(ride.start_time).toLocaleString('en-PK'),
            fare: ride.fare_per_seat
          },
          emailParams.public_key
        ).catch(e => console.error('Rider Email Error:', e));

        // 2. Send Notification to Driver
        if (ride.poster?.email) {
          emailjs.send(
            emailParams.service_id,
            emailParams.driver_template,
            {
              to_email: ride.poster.email,
              driver_name: ride.poster.name,
              rider_name: profile?.name || 'Rider',
              rider_phone: profile?.phone || 'Not provided',
              origin: ride.origin_address,
              destination: ride.destination_address,
              start_time: new Date(ride.start_time).toLocaleString('en-PK')
            },
            emailParams.public_key
          ).catch(e => console.error('Driver Email Error:', e));
        }
      }

    } catch (err) {
      const errorMsg = err.response?.data?.error || '';
      if (errorMsg.includes('bookings_ride_id_rider_id_key')) {
        setBookingError('You have already booked this ride.');
      } else {
        setBookingError(errorMsg || 'Booking failed');
      }
    }
  }

  const polylineCoords = selectedRide?.route_polyline?.coordinates
    ? selectedRide.route_polyline.coordinates.map(c => [c[1], c[0]])
    : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 65px)', overflow: 'hidden' }}>
      <MapModal 
        isOpen={!!mapModalOpen} 
        initialPos={mapModalOpen === 'pickup' ? pickup : dropoff}
        onClose={() => setMapModalOpen(null)}
        onConfirm={(pos) => {
          if (mapModalOpen === 'pickup') setPickup(pos);
          if (mapModalOpen === 'dropoff') setDropoff(pos);
          setMapModalOpen(null);
        }}
      />

      <div className="split-view" style={{ flex: 1, height: '100%', minHeight: 0, overflow: 'hidden' }}>
        
        {/* LEFT COLUMN: Search & Results */}
        <div className="split-left" style={{ width: '35%', height: '100%', display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border)', padding: '1rem' }}>
          
          {/* SEARCH SECTION (Fixed at top of left column) */}
          <div style={{ flexShrink: 0, paddingBottom: '1rem', borderBottom: '1px solid var(--border)', marginBottom: '1rem' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: 'bold' }}>Book a Ride</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ flex: 1 }}>
                  <AddressSearchBox placeholder="Enter Pickup" onSelect={setPickup} value={pickup?.address} />
                </div>
                <button className="btn btn-outline" style={{ whiteSpace: 'nowrap', padding: '0.4rem 0.75rem', fontSize: '0.875rem' }} onClick={() => setMapModalOpen('pickup')}>
                  🗺️ Map
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ flex: 1 }}>
                  <AddressSearchBox placeholder="Enter Dropoff" onSelect={setDropoff} value={dropoff?.address} />
                </div>
                <button className="btn btn-outline" style={{ whiteSpace: 'nowrap', padding: '0.4rem 0.75rem', fontSize: '0.875rem' }} onClick={() => setMapModalOpen('dropoff')}>
                  🗺️ Map
                </button>
              </div>
            </div>

            <button 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '0.6rem', fontWeight: 'bold', fontSize: '0.875rem' }}
              disabled={loading}
              onClick={handleSearch}
            >
              {loading ? 'Searching...' : 'FIND RIDE OFFERS'}
            </button>
            
            {error && <div className="form-error" style={{ marginTop: '0.5rem', textAlign: 'center', fontSize: '0.875rem' }}>{error}</div>}
          </div>

          {/* PLAYCARDS LIST (Scrollable) */}
          <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.25rem' }}>
            {bookingError && <div className="toast toast-error">{bookingError}</div>}

            <div className="results-list">
              {results.length === 0 && !loading && !error && (
                <div className="empty-state" style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.875rem' }}>No rides available right now.</div>
              )}
              
              {results.map(ride => (
                <RouteCard
                  key={ride.id}
                  ride={ride}
                  isSelected={selectedRide?.id === ride.id}
                  onSelect={setSelectedRide}
                  onBook={handleBook}
                  alreadyBooked={bookedRideIds.has(ride.id)}
                  isOwnRide={ride.poster_id === user?.id}
                />
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Map & Details */}
        <div className="split-right" style={{ width: '65%', height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--surface)' }}>
          <div style={{ flex: 1, position: 'relative', minHeight: '200px' }}>
            <MapContainer
              center={[24.8607, 67.0011]}
              zoom={11}
              style={{ width: '100%', height: '100%', borderRadius: 0 }}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
              <MapUpdater selectedRide={selectedRide} pickup={pickup} dropoff={dropoff} />
              
              {/* User's Desired Pickup/Dropoff (Red Markers) */}
              {pickup && <Marker position={[pickup.lat, pickup.lng]} icon={redIcon} />}
              {dropoff && <Marker position={[dropoff.lat, dropoff.lng]} icon={redIcon} />}

              {/* Ride's Actual Route Data */}
              {selectedRide && (
                <>
                  <Marker position={[selectedRide.origin_lat, selectedRide.origin_lng]} icon={blueIcon} />
                  <Marker position={[selectedRide.destination_lat, selectedRide.destination_lng]} icon={blueIcon} />
                  {polylineCoords.length > 0 && (
                    <Polyline positions={polylineCoords} color="#3b82f6" weight={5} opacity={0.8} />
                  )}
                </>
              )}
            </MapContainer>
          </div>

          <div style={{ flex: 'none', padding: '1rem 1.5rem', background: 'var(--bg-card)', borderTop: '1px solid var(--border)' }}>
            {!selectedRide ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1rem 0' }}>
                <p style={{ fontWeight: 500 }}>Set your route and find rides.</p>
                <p style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>Select an offer on the left to view details.</p>
              </div>
            ) : (
              <>
                <h3 style={{ marginBottom: '0.75rem', color: 'var(--text)', fontSize: '1.125rem' }}>Ride Details</h3>
                
                {/* Driver Info Section */}
                <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '1.25rem' }}>👤</span>
                    <span style={{ fontWeight: 600, color: 'var(--text)' }}>{selectedRide.poster?.name || 'Driver'}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', paddingLeft: '1.75rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    {selectedRide.poster?.phone && <div>📞 {selectedRide.poster.phone}</div>}
                    {selectedRide.poster?.email && <div>✉️ {selectedRide.poster.email}</div>}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '0.75rem' }}>
                  <div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Driver Start</p>
                    <p style={{ fontWeight: 500, color: 'var(--text)', fontSize: '0.875rem' }}>{selectedRide.origin_address.split(',')[0]}</p>
                  </div>
                  <div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Driver End</p>
                    <p style={{ fontWeight: 500, color: 'var(--text)', fontSize: '0.875rem' }}>{selectedRide.destination_address.split(',')[0]}</p>
                  </div>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                  <div>
                    <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)' }}>
                      PKR {selectedRide.fare_per_seat}
                    </span>
                    <span style={{ color: 'var(--text-muted)', marginLeft: '0.25rem', fontSize: '0.875rem' }}>/ seat</span>
                  </div>
                  
                  <button
                    className={`btn ${bookedRideIds.has(selectedRide.id) ? 'btn-booked' : 'btn-primary'}`}
                    disabled={bookedRideIds.has(selectedRide.id) || selectedRide.poster_id === user?.id || selectedRide.seats_remaining === 0}
                    onClick={() => handleBook(selectedRide)}
                    style={{ minWidth: '120px', padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                  >
                    {bookedRideIds.has(selectedRide.id) ? '✓ Booked' : selectedRide.poster_id === user?.id ? 'Your Ride' : selectedRide.seats_remaining === 0 ? 'Full' : 'Book Now'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

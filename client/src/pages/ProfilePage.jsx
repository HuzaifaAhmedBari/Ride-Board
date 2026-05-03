import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import api from '../api';
import RouteCard from '../components/RouteCard';
import { useAuthStore } from '../store/authStore';

const blueIcon = new L.Icon.Default();

function MapUpdater({ selectedRide }) {
  const map = useMap();
  useEffect(() => {
    if (selectedRide) {
      let bounds;
      if (selectedRide.route_polyline?.coordinates?.length > 0) {
        const coords = selectedRide.route_polyline.coordinates.map(c => [c[1], c[0]]);
        bounds = L.latLngBounds(coords);
      } else {
        bounds = L.latLngBounds([
          [selectedRide.origin_lat, selectedRide.origin_lng],
          [selectedRide.destination_lat, selectedRide.destination_lng]
        ]);
      }
      // Wait for the side-panel CSS transition to complete
      setTimeout(() => {
        map.invalidateSize();
        map.fitBounds(bounds, { padding: [40, 40], animate: true, maxZoom: 15 });
      }, 350);
    }
  }, [selectedRide, map]);
  return null;
}

export default function ProfilePage() {
  const { profile } = useAuthStore();
  const [data, setData] = useState({ posted_rides: [], booked_rides: [] });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', phone: '' });
  
  const [selectedRide, setSelectedRide] = useState(null);
  const [cancelConfirmRide, setCancelConfirmRide] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await api.get('/users/me');
        setData({
          posted_rides: res.data.posted_rides || [],
          booked_rides: res.data.booked_rides || []
        });
        if (res.data.profile) {
          setEditForm({
            name: res.data.profile.name || '',
            phone: res.data.profile.phone || ''
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  async function handleSaveProfile() {
    try {
      await api.patch('/users/me', editForm);
      setEditing(false);
      window.location.reload();
    } catch (err) {
      alert('Failed to update profile');
    }
  }

  async function confirmCancelBooking() {
    if (!cancelConfirmRide) return;
    const rideId = cancelConfirmRide.id;
    try {
      await api.delete(`/bookings/${rideId}`);
      setData(prev => ({
        ...prev,
        booked_rides: prev.booked_rides.filter(b => b.ride.id !== rideId)
      }));
      if (selectedRide?.id === rideId) {
        setSelectedRide(null);
      }
      setCancelConfirmRide(null);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to cancel booking');
      setCancelConfirmRide(null);
    }
  }

  if (loading) return <div className="container" style={{ padding: '2rem' }}>Loading profile...</div>;

  const polylineCoords = selectedRide?.route_polyline?.coordinates
    ? selectedRide.route_polyline.coordinates.map(c => [c[1], c[0]])
    : [];

  // Data to show in the sidebar
  const displayDriver = selectedRide?.poster || profile; 

  return (
    <div style={{ display: 'flex', flexDirection: 'row', height: 'calc(100vh - 65px)', overflow: 'hidden' }}>
      
      {/* LEFT COLUMN: Profile Content */}
      <div 
        style={{ 
          flex: selectedRide ? 'none' : 1, 
          width: selectedRide ? '45%' : '100%',
          overflowY: 'auto', 
          padding: '2rem',
          transition: 'width 0.3s ease',
          borderRight: selectedRide ? '1px solid var(--border)' : 'none',
          cursor: selectedRide ? 'pointer' : 'default' // indicate clicking outside closes sidebar
        }}
        onClick={() => { if (selectedRide) setSelectedRide(null); }}
      >
        <div style={{ maxWidth: selectedRide ? '100%' : '800px', margin: '0 auto', cursor: 'default' }} onClick={e => e.stopPropagation()}>
          
          <div className="profile-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h1 className="profile-name">{profile?.name}</h1>
                <p className="profile-meta">
                  Member since {new Date(profile?.created_at).toLocaleDateString('en-PK', { month: 'long', year: 'numeric' })}
                  {profile?.phone && ` • 📞 ${profile.phone}`}
                </p>
              </div>
              <button className="btn btn-outline-sm" onClick={() => setEditing(!editing)}>
                {editing ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>

            {editing && (
              <div style={{ marginTop: '1.5rem', background: 'var(--bg-card)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--border)', maxWidth: '400px' }}>
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label">Name</label>
                  <input className="form-input" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
                </div>
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label">Phone</label>
                  <input className="form-input" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} />
                </div>
                <button className="btn btn-primary-sm" onClick={handleSaveProfile}>Save Changes</button>
              </div>
            )}
          </div>

          <h2 className="section-title">My Posted Rides</h2>
          {data.posted_rides.filter(r => r.status === 'active').length === 0 ? (
            <p style={{ color: 'var(--text-muted)', marginBottom: '3rem' }}>You have no active posted rides.</p>
          ) : (
            <div className="rides-grid" style={selectedRide ? { gridTemplateColumns: '1fr' } : {}}>
              {data.posted_rides.filter(r => r.status === 'active').map(ride => (
                <RouteCard 
                  key={ride.id} 
                  ride={{...ride, poster: profile}} // inject own profile for posted rides
                  isSelected={selectedRide?.id === ride.id}
                  onSelect={setSelectedRide}
                  showBook={false} 
                />
              ))}
            </div>
          )}

          <h2 className="section-title" style={{ marginTop: '3rem' }}>My Booked Rides</h2>
          {data.booked_rides.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', marginBottom: '3rem' }}>You haven't booked any rides yet.</p>
          ) : (
            <div className="rides-grid" style={selectedRide ? { gridTemplateColumns: '1fr' } : {}}>
              {data.booked_rides.map(booking => (
                <RouteCard 
                  key={booking.id} 
                  ride={booking.ride} 
                  isSelected={selectedRide?.id === booking.ride.id}
                  onSelect={() => setSelectedRide(booking.ride)}
                  alreadyBooked={true}
                  onCancel={(ride) => setCancelConfirmRide(ride)}
                  showBook={false} // Don't show book button in ProfilePage
                />
              ))}
            </div>
          )}

          <h2 className="section-title" style={{ marginTop: '3rem' }}>Completed Rides</h2>
          {data.posted_rides.filter(r => r.status !== 'active').length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No completed rides yet.</p>
          ) : (
            <div className="rides-grid" style={selectedRide ? { gridTemplateColumns: '1fr' } : {}}>
              {data.posted_rides.filter(r => r.status !== 'active').map(ride => (
                <RouteCard 
                  key={ride.id} 
                  ride={{...ride, poster: profile}} 
                  isSelected={selectedRide?.id === ride.id}
                  onSelect={setSelectedRide}
                  showBook={false}
                  isCompleted={true}
                />
              ))}
            </div>
          )}

        </div>
      </div>

      {/* RIGHT COLUMN: Map Sidebar */}
      {selectedRide && (
        <div style={{ width: '55%', height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-main)', borderLeft: '1px solid var(--border)' }}>
          
          <div style={{ padding: '0.75rem 1.5rem', background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1.125rem', color: 'var(--text)' }}>Ride Details</h3>
            <button className="btn btn-outline-sm" onClick={() => setSelectedRide(null)} style={{ padding: '0.4rem 0.75rem' }}>
              ✕ Close
            </button>
          </div>

          <div style={{ flex: 1, position: 'relative' }}>
            <MapContainer center={[24.8607, 67.0011]} zoom={11} style={{ width: '100%', height: '100%', borderRadius: 0 }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
              <MapUpdater selectedRide={selectedRide} />

              <Marker position={[selectedRide.origin_lat, selectedRide.origin_lng]} icon={blueIcon} />
              <Marker position={[selectedRide.destination_lat, selectedRide.destination_lng]} icon={blueIcon} />
              
              {polylineCoords.length > 0 && (
                <Polyline positions={polylineCoords} color="#3b82f6" weight={5} opacity={0.8} />
              )}
            </MapContainer>
          </div>

          <div style={{ flex: 'none', padding: '1.5rem', background: 'var(--bg-card)', borderTop: '1px solid var(--border)' }}>
            
            <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <span style={{ fontSize: '1.25rem' }}>👤</span>
                <span style={{ fontWeight: 600, color: 'var(--text)' }}>{displayDriver?.name || 'Driver'}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', paddingLeft: '1.75rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                {displayDriver?.phone && <div>📞 {displayDriver.phone}</div>}
                {displayDriver?.email && <div>✉️ {displayDriver.email}</div>}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Driver Start</p>
                <p style={{ fontWeight: 500, color: 'var(--text)', fontSize: '0.875rem' }}>{selectedRide.origin_address.split(',')[0]}</p>
              </div>
              <div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Driver End</p>
                <p style={{ fontWeight: 500, color: 'var(--text)', fontSize: '0.875rem' }}>{selectedRide.destination_address.split(',')[0]}</p>
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
              <div>
                <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)' }}>
                  PKR {selectedRide.fare_per_seat}
                </span>
                <span style={{ color: 'var(--text-muted)', marginLeft: '0.25rem', fontSize: '0.875rem' }}> / seat</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  {selectedRide.status === 'active' ? (
                    `${selectedRide.seats_remaining} seats remaining`
                  ) : (
                    <span style={{ fontWeight: 600, color: 'var(--primary)' }}>
                      {selectedRide.total_seats - selectedRide.seats_remaining} riders taken
                    </span>
                  )}
                </div>
                {data.booked_rides.some(b => b.ride.id === selectedRide.id) && (
                  <button 
                    className="btn btn-primary-sm" 
                    style={{ background: '#ef4444', borderColor: '#ef4444', color: 'white' }}
                    onClick={(e) => { e.stopPropagation(); setCancelConfirmRide(selectedRide); }}
                  >
                    Cancel Booking
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Cancellation Confirmation Overlay */}
      {cancelConfirmRide && (
        <div 
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
          onClick={() => setCancelConfirmRide(null)}
        >
          <div 
            style={{
              background: 'var(--bg-card)', padding: '2rem', borderRadius: '12px',
              maxWidth: '400px', width: '90%', boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              border: '1px solid var(--border)'
            }}
            onClick={e => e.stopPropagation()} // Prevent clicking inside modal from closing it
          >
            <h3 style={{ marginTop: 0, fontSize: '1.25rem', color: 'var(--text)' }}>Cancel Booking?</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              Are you sure you want to cancel your ride with <strong>{cancelConfirmRide.poster?.name || 'this driver'}</strong>? 
              This will immediately free up your seat for someone else.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button 
                className="btn btn-outline"
                onClick={() => setCancelConfirmRide(null)}
              >
                No, Keep it
              </button>
              <button 
                className="btn btn-primary"
                style={{ background: '#ef4444', borderColor: '#ef4444', color: 'white' }}
                onClick={confirmCancelBooking}
              >
                Yes, Cancel Ride
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

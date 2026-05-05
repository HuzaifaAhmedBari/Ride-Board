import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import api from '../api';
import RouteCard from '../components/RouteCard';
import ChatWindow from '../components/ChatWindow';
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
  const [data, setData] = useState({ posted_rides: [], posted_active: [], posted_expired: [], booked_rides: [] });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', phone: '' });
  
  const [selectedRide, setSelectedRide] = useState(null);
  const [cancelConfirmRide, setCancelConfirmRide] = useState(null);
  const [chatRide, setChatRide] = useState(null);
  
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'completed'
  const [reviewModal, setReviewModal] = useState(null); // { ride_id, reviewee_id }
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const res = await api.get('/users/me');
      setData({
        posted_rides: res.data.posted_rides || [],
        posted_active: res.data.posted_active || [],
        posted_expired: res.data.posted_expired || [],
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

  useEffect(() => {
    loadData();
  }, []);

  async function handleSaveProfile() {
    try {
      await api.patch('/users/me', editForm);
      setEditing(false);
      loadData();
    } catch (err) {
      alert('Failed to update profile');
    }
  }

  async function confirmCancelBooking() {
    if (!cancelConfirmRide) return;
    const rideId = cancelConfirmRide.id;
    try {
      await api.delete(`/bookings/${rideId}`);
      loadData();
      if (selectedRide?.id === rideId) {
        setSelectedRide(null);
      }
      setCancelConfirmRide(null);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to cancel booking');
      setCancelConfirmRide(null);
    }
  }

  const handleSubmitReview = async () => {
    if (!reviewModal) return;
    setSubmittingReview(true);
    try {
      await api.post('/reviews', {
        ride_id: reviewModal.ride_id,
        reviewee_id: reviewModal.reviewee_id,
        rating: reviewRating,
        comment: reviewComment
      });
      setReviewModal(null);
      setReviewRating(5);
      setReviewComment('');
      // Immediately refresh data so the button disappears
      await loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

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
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.25rem' }}>
                  <p className="profile-meta" style={{ margin: 0 }}>
                    Member since {new Date(profile?.created_at).toLocaleDateString('en-PK', { month: 'long', year: 'numeric' })}
                    {profile?.phone && ` • 📞 ${profile.phone}`}
                  </p>
                  {profile?.rating && profile.rating[0] && (
                    <span style={{ 
                      background: 'rgba(245, 158, 11, 0.1)', color: '#d97706', 
                      padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 700,
                      border: '1px solid rgba(245, 158, 11, 0.2)'
                    }}>
                      ⭐ {Number(profile.rating[0].avg_rating).toFixed(1)} ({profile.rating[0].review_count})
                    </span>
                  )}
                </div>
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

          <div style={{ display: 'flex', gap: '2rem', borderBottom: '1px solid var(--border)', marginBottom: '2rem' }}>
            <button 
              onClick={() => setActiveTab('active')}
              style={{ 
                padding: '0.75rem 0', background: 'none', border: 'none', 
                borderBottom: activeTab === 'active' ? '2px solid var(--primary)' : '2px solid transparent',
                color: activeTab === 'active' ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: 600, cursor: 'pointer'
              }}
            >
              Active Rides
            </button>
            <button 
              onClick={() => setActiveTab('completed')}
              style={{ 
                padding: '0.75rem 0', background: 'none', border: 'none', 
                borderBottom: activeTab === 'completed' ? '2px solid var(--primary)' : '2px solid transparent',
                color: activeTab === 'completed' ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: 600, cursor: 'pointer'
              }}
            >
              Completed Rides
            </button>
          </div>

          {activeTab === 'active' ? (
            <>
              <h2 className="section-title">Driving</h2>
              {data.posted_active.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', marginBottom: '3rem' }}>You have no active posted rides.</p>
              ) : (
                <div className="rides-grid" style={selectedRide ? { gridTemplateColumns: '1fr' } : {}}>
                  {data.posted_active.map(ride => (
                    <RouteCard 
                      key={ride.id} ride={{...ride, poster: profile}} 
                      isSelected={selectedRide?.id === ride.id}
                      onSelect={setSelectedRide} showBook={false}
                      isOwnRide={true}
                      onChat={setChatRide}
                    />
                  ))}
                </div>
              )}
              <h2 className="section-title" style={{ marginTop: '3rem' }}>Booked</h2>
              {data.booked_rides.filter(b => (b.ride.status === 'active' || b.ride.status === 'full') && new Date(b.ride.start_time) > new Date()).length === 0 ? (
                <p style={{ color: 'var(--text-muted)', marginBottom: '3rem' }}>You haven't booked any active rides yet.</p>
              ) : (
                <div className="rides-grid" style={selectedRide ? { gridTemplateColumns: '1fr' } : {}}>
                  {data.booked_rides.filter(b => (b.ride.status === 'active' || b.ride.status === 'full') && new Date(b.ride.start_time) > new Date()).map(booking => (
                    <RouteCard 
                      key={booking.id} ride={booking.ride} 
                      isSelected={selectedRide?.id === booking.ride.id}
                      onSelect={() => setSelectedRide(booking.ride)}
                      alreadyBooked={true} onCancel={(ride) => setCancelConfirmRide(ride)}
                      showBook={false}
                      onChat={setChatRide}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <h2 className="section-title">Ride History</h2>
              {(() => {
                const completed = [
                  ...data.posted_expired.map(r => ({ ...r, role: 'driver', poster: profile })),
                  ...data.booked_rides.filter(b => b.ride.status === 'expired' || new Date(b.ride.start_time) <= new Date()).map(b => ({ ...b.ride, role: 'passenger', is_reviewed: b.is_reviewed }))
                ].sort((a, b) => new Date(b.start_time) - new Date(a.start_time));
                if (completed.length === 0) return <p style={{ color: 'var(--text-muted)' }}>No completed rides found.</p>;
                return (
                  <div className="rides-grid" style={selectedRide ? { gridTemplateColumns: '1fr' } : {}}>
                    {completed.map(ride => (
                      <div key={ride.id} style={{ position: 'relative' }}>
                        <RouteCard 
                          ride={ride} isSelected={selectedRide?.id === ride.id}
                          onSelect={setSelectedRide} isCompleted={true} showBook={false}
                          hideBadge={true}
                        />
                        <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                          <span style={{ 
                            fontSize: '0.65rem', padding: '0.2rem 0.5rem', borderRadius: '1rem', 
                            background: ride.role === 'driver' ? '#e0f2fe' : '#fef3c7',
                            color: ride.role === 'driver' ? '#0369a1' : '#92400e',
                            fontWeight: 700, textTransform: 'uppercase'
                          }}>
                            {ride.role}
                          </span>
                          {ride.role === 'passenger' && !ride.is_reviewed && (
                            <button 
                              className="btn btn-primary-sm" 
                              style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setReviewModal({ ride_id: ride.id, reviewee_id: ride.poster_id });
                              }}
                            >
                              ⭐ Rate Driver
                            </button>
                          )}
                          {ride.role === 'passenger' && ride.is_reviewed && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--green)', fontWeight: 600 }}>
                              ✓ Reviewed
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </>
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
                {selectedRide.status === 'active' && data.booked_rides.some(b => b.ride.id === selectedRide.id) && (
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

      {/* Chat Modal Overlay */}
      {chatRide && (
        <div 
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 11000,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
          onClick={() => setChatRide(null)}
        >
          <div 
            style={{
              background: 'var(--bg-card)', borderRadius: '16px',
              width: '95%', maxWidth: '500px', height: '600px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
              border: '1px solid var(--border)', display: 'flex', flexDirection: 'column',
              overflow: 'hidden', position: 'relative'
            }}
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={() => setChatRide(null)}
              style={{
                position: 'absolute', top: '1rem', right: '1rem',
                background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white',
                width: '30px', height: '30px', borderRadius: '50%', cursor: 'pointer',
                zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              ✕
            </button>
            <ChatWindow 
              rideId={chatRide.id} 
              rideTitle={`${chatRide.origin_address.split(',')[0]} to ${chatRide.destination_address.split(',')[0]}`} 
            />
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
            onClick={e => e.stopPropagation()} 
          >
            <h3 style={{ marginTop: 0, fontSize: '1.25rem', color: 'var(--text)' }}>Cancel Booking?</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              Are you sure you want to cancel your ride with <strong>{cancelConfirmRide.poster?.name || 'this driver'}</strong>? 
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-outline-sm" onClick={() => setCancelConfirmRide(null)}>No, Keep it</button>
              <button 
                className="btn btn-primary-sm" 
                style={{ background: '#ef4444', borderColor: '#ef4444', color: 'white' }}
                onClick={() => confirmCancelBooking(cancelConfirmRide.id)}
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewModal && (
        <div 
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 10000,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
          onClick={() => setReviewModal(null)}
        >
          <div 
            style={{
              background: 'var(--bg-card)', padding: '2rem', borderRadius: '16px',
              maxWidth: '450px', width: '90%', boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
              border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1.5rem'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem', color: 'var(--text)' }}>How was your ride?</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Share your experience to help others.</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
              {[1, 2, 3, 4, 5].map(num => (
                <button
                  key={num}
                  onClick={() => setReviewRating(num)}
                  style={{
                    background: 'none', border: 'none', fontSize: '2rem', cursor: 'pointer',
                    filter: num <= reviewRating ? 'none' : 'grayscale(100%) opacity(0.3)',
                    transition: 'transform 0.2s'
                  }}
                >
                  ⭐
                </button>
              ))}
            </div>

            <div className="form-group">
              <label className="form-label">Comments (Optional)</label>
              <textarea 
                className="form-input" 
                rows="3" 
                placeholder="Was the driver on time?"
                value={reviewComment}
                onChange={e => setReviewComment(e.target.value)}
                style={{ resize: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn btn-outline-sm" style={{ flex: 1 }} onClick={() => setReviewModal(null)}>Cancel</button>
              <button 
                className="btn btn-primary-sm" 
                style={{ flex: 2 }} 
                disabled={submittingReview}
                onClick={handleSubmitReview}
              >
                {submittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

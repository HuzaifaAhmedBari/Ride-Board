import { useState, useEffect } from 'react';
import api from '../api';
import RouteCard from '../components/RouteCard';
import { useAuthStore } from '../store/authStore';

export default function ProfilePage() {
  const { profile } = useAuthStore();
  const [data, setData] = useState({ posted_rides: [], booked_rides: [] });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', phone: '' });

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
      window.location.reload(); // Quick refresh to update global profile state
    } catch (err) {
      alert('Failed to update profile');
    }
  }

  if (loading) return <div className="container">Loading profile...</div>;

  return (
    <div className="container">
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
              <input
                className="form-input"
                value={editForm.name}
                onChange={e => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label">Phone</label>
              <input
                className="form-input"
                value={editForm.phone}
                onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
              />
            </div>
            <button className="btn btn-primary-sm" onClick={handleSaveProfile}>Save Changes</button>
          </div>
        )}
      </div>

      <h2 className="section-title">My Posted Rides</h2>
      {data.posted_rides.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', marginBottom: '3rem' }}>You haven't posted any rides yet.</p>
      ) : (
        <div className="rides-grid">
          {data.posted_rides.map(ride => (
            <RouteCard key={ride.id} ride={ride} showBook={false} />
          ))}
        </div>
      )}

      <h2 className="section-title">My Booked Rides</h2>
      {data.booked_rides.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>You haven't booked any rides yet.</p>
      ) : (
        <div className="rides-grid">
          {data.booked_rides.map(booking => (
            <RouteCard 
              key={booking.id} 
              ride={booking.ride} 
              alreadyBooked={true}
              showBook={true}
            />
          ))}
        </div>
      )}
    </div>
  );
}

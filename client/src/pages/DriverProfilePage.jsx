import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';
import RouteCard from '../components/RouteCard';

export default function DriverProfilePage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadDriver() {
      try {
        const res = await api.get(`/users/${id}`);
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Driver not found');
      } finally {
        setLoading(false);
      }
    }
    loadDriver();
  }, [id]);

  if (loading) return <div className="container">Loading driver profile...</div>;
  if (error) return <div className="container" style={{ color: 'var(--red)' }}>{error}</div>;
  if (!data) return null;

  return (
    <div className="container">
      <div className="profile-header">
        <h1 className="profile-name">🧑‍✈️ {data.profile.name}</h1>
        <p className="profile-meta" style={{ marginBottom: '1.5rem' }}>
          Member since {new Date(data.profile.created_at).toLocaleDateString('en-PK', { month: 'long', year: 'numeric' })}
        </p>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '1rem 2rem', borderRadius: '0.5rem', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--green)', textAlign: 'center' }}>
              {data.completed_rides}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Rides Completed
            </div>
          </div>

          {data.profile.rating && data.profile.rating[0] && (
            <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '1rem 2rem', borderRadius: '0.5rem', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: '#d97706', textAlign: 'center' }}>
                ⭐ {Number(data.profile.rating[0].avg_rating).toFixed(1)}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                From {data.profile.rating[0].review_count} reviews
              </div>
            </div>
          )}
        </div>
      </div>

      <h2 className="section-title">Currently Active Rides</h2>
      {data.active_rides.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>This driver has no active rides at the moment.</p>
      ) : (
        <div className="rides-grid">
          {data.active_rides.map(ride => (
            <RouteCard 
              key={ride.id} 
              ride={{ ...ride, poster: data.profile }} 
              showBook={false} 
            />
          ))}
        </div>
      )}
      <h2 className="section-title" style={{ marginTop: '3rem' }}>Reviews & Feedback</h2>
      {data.reviews.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>No reviews yet for this driver.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {data.reviews.map(review => (
            <div 
              key={review.id} 
              style={{ 
                background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '12px', 
                border: '1px solid var(--border)', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' 
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <div>
                  <span style={{ fontWeight: 700, color: 'var(--text)' }}>{review.reviewer.name}</span>
                  <div style={{ color: 'var(--yellow)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
                    {'⭐'.repeat(review.rating)}
                  </div>
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {new Date(review.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
              <p style={{ color: 'var(--text)', lineHeight: 1.5, margin: 0 }}>
                {review.comment || <i>No comment left.</i>}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

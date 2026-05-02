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
        
        <div style={{ display: 'inline-block', background: 'rgba(16, 185, 129, 0.1)', padding: '1rem 2rem', borderRadius: '0.5rem', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--green)', textAlign: 'center' }}>
            {data.completed_rides}
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Rides Completed
          </div>
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
    </div>
  );
}

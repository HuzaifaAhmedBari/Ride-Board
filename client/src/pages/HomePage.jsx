import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../api/supabase';

export default function HomePage() {
  const [stats, setStats] = useState({ activeRides: 0, totalSeats: 0 });

  useEffect(() => {
    async function loadStats() {
      const { data } = await supabase
        .from('rides')
        .select('id, seats_remaining')
        .eq('status', 'active');
      
      if (data) {
        setStats({
          activeRides: data.length,
          totalSeats: data.reduce((sum, r) => sum + r.seats_remaining, 0)
        });
      }
    }
    loadStats();
  }, []);

  return (
    <div>
      <div className="hero">
        <h1 className="hero-title">RideBoard</h1>
        <p className="hero-subtitle">Scheduled carpooling, simplified. Find a ride or post an empty seat to share the cost of your commute.</p>
        
        <div className="hero-cta">
          <Link to="/find" className="btn btn-primary">🔍 Find a Ride</Link>
          <Link to="/post" className="btn btn-outline">🚗 Post a Ride</Link>
        </div>

        <div className="stats-row">
          <div className="stat-item">
            <div className="stat-value">{stats.activeRides}</div>
            <div className="stat-label">Active Rides</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{stats.totalSeats}</div>
            <div className="stat-label">Available Seats</div>
          </div>
        </div>
      </div>
    </div>
  );
}

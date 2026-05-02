import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function Navbar() {
  const { user, profile, signOut } = useAuthStore();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate('/');
  }

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <span className="navbar-logo">🚗</span>
        RideBoard
      </Link>
      <div className="navbar-links">
        {user ? (
          <>
            <Link to="/find" className="nav-link">Find a Ride</Link>
            <Link to="/post" className="nav-link">Post a Ride</Link>
            <Link to="/profile" className="nav-link nav-link-profile">
              👤 {profile?.name ? profile.name.split(' ')[0] : 'Profile'}
            </Link>
            <button onClick={handleSignOut} className="btn btn-outline-sm">Sign Out</button>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-link">Login</Link>
            <Link to="/register" className="btn btn-primary-sm">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}

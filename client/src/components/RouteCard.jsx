import { Link } from 'react-router-dom';

function getStatusBadge(ride) {
  if (ride.status === 'expired') return { label: 'Expired', cls: 'badge-grey' };
  if (ride.status === 'full')    return { label: 'Full',    cls: 'badge-blue' };
  const minsUntil = (new Date(ride.start_time) - Date.now()) / 60000;
  if (minsUntil > 120) return { label: 'Active',  cls: 'badge-green' };
  if (minsUntil > 30)  return { label: 'Soon',    cls: 'badge-amber' };
  return                        { label: 'Urgent', cls: 'badge-red' };
}

function SeatDots({ total, remaining }) {
  return (
    <span className="seat-dots">
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} className={i < remaining ? 'dot dot-filled' : 'dot dot-empty'} />
      ))}
    </span>
  );
}

// Props: { ride, onSelect, isSelected, onBook, onCancel, onChat, alreadyBooked, isOwnRide, showBook, isCompleted, hideBadge }
export default function RouteCard({ ride, onSelect, isSelected, onBook, onCancel, onChat, alreadyBooked, isOwnRide, showBook = true, isCompleted, hideBadge }) {
  const badge = getStatusBadge(ride);
  const canBook = !alreadyBooked && !isOwnRide && ride.status === 'active' && ride.seats_remaining > 0;

  const departure = new Date(ride.start_time);
  const dateStr = departure.toLocaleDateString('en-PK', { weekday: 'short', month: 'short', day: 'numeric' });
  const timeStr = departure.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' });

  const ridersTaken = ride.total_seats - ride.seats_remaining;

  return (
    <div
      className={`route-card ${isSelected ? 'route-card-selected' : ''}`}
      onClick={() => onSelect && onSelect(ride)}
    >
      <div className="route-card-header">
        <div className="route-card-route">
          <span className="route-origin">{ride.origin_address.split(',')[0]}</span>
          <span className="route-arrow">→</span>
          <span className="route-dest">{ride.destination_address.split(',')[0]}</span>
        </div>
        {!hideBadge && (
          <span className={`badge ${isCompleted ? 'badge-grey' : badge.cls}`}>{isCompleted ? 'Completed' : badge.label}</span>
        )}
      </div>

      <div className="route-card-meta">
        <span className="meta-item">
          🧑‍✈️{' '}
          {ride.poster ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <Link
                to={`/driver/${ride.poster.id}`}
                className="driver-link"
                onClick={e => e.stopPropagation()}
                target="_blank"
                rel="noopener noreferrer"
              >
                {ride.poster.name}
              </Link>
              {ride.poster.rating && ride.poster.rating[0] && (
                <span style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 700 }}>
                  ⭐ {Number(ride.poster.rating[0].avg_rating).toFixed(1)} 
                  <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}> ({ride.poster.rating[0].review_count})</span>
                </span>
              )}
            </span>
          ) : 'Unknown'}
        </span>
        {ride.pickup_distance_km != null && (
          <span className="meta-item">📍 {ride.pickup_distance_km} km away</span>
        )}
      </div>

      <div className="route-card-details">
        <span className="meta-item">🗓 {dateStr}, {timeStr}</span>
        {isCompleted ? (
          <span className="meta-item" style={{ fontWeight: 600, color: 'var(--primary)' }}>
            {ridersTaken} rider{ridersTaken !== 1 ? 's' : ''} taken
          </span>
        ) : (
          <span className="meta-item">
            <SeatDots total={ride.total_seats} remaining={ride.seats_remaining} />
            {ride.seats_remaining} seat{ride.seats_remaining !== 1 ? 's' : ''} left
          </span>
        )}
      </div>

      <div className="route-card-footer">
        <span className="fare">PKR {Number(ride.fare_per_seat).toLocaleString()} / seat</span>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {showBook && (
            <button
              className={`btn ${alreadyBooked ? 'btn-booked' : 'btn-primary-sm'}`}
              disabled={!canBook && !alreadyBooked}
              onClick={e => { e.stopPropagation(); onBook && onBook(ride); }}
            >
              {alreadyBooked ? '✓ Booked' : isOwnRide ? 'Your Ride' : 'Book'}
            </button>
          )}
          {alreadyBooked && onCancel && (
            <button
              className="btn btn-primary-sm"
              style={{ background: '#ef4444', borderColor: '#ef4444', color: 'white' }}
              onClick={e => { e.stopPropagation(); onCancel(ride); }}
            >
              Cancel
            </button>
          )}
          {(alreadyBooked || isOwnRide) && !isCompleted && (
            <button
              className="btn btn-primary-sm"
              style={{ background: 'var(--amber)', borderColor: 'var(--amber)', color: 'white' }}
              onClick={e => { e.stopPropagation(); onSelect(ride); /* This ensures the card is selected */ if (typeof onChat === 'function') onChat(ride); }}
            >
              💬 Chat
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

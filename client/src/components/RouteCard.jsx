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

// Props: { ride, onSelect, isSelected, onBook, alreadyBooked, isOwnRide, showBook }
export default function RouteCard({ ride, onSelect, isSelected, onBook, alreadyBooked, isOwnRide, showBook = true }) {
  const badge = getStatusBadge(ride);
  const canBook = !alreadyBooked && !isOwnRide && ride.status === 'active' && ride.seats_remaining > 0;

  const departure = new Date(ride.start_time);
  const dateStr = departure.toLocaleDateString('en-PK', { weekday: 'short', month: 'short', day: 'numeric' });
  const timeStr = departure.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' });

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
        <span className={`badge ${badge.cls}`}>{badge.label}</span>
      </div>

      <div className="route-card-meta">
        <span className="meta-item">
          🧑‍✈️{' '}
          {ride.poster ? (
            <Link
              to={`/driver/${ride.poster.id}`}
              className="driver-link"
              onClick={e => e.stopPropagation()}
              target="_blank"
              rel="noopener noreferrer"
            >
              {ride.poster.name}
            </Link>
          ) : 'Unknown'}
        </span>
        {ride.pickup_distance_km != null && (
          <span className="meta-item">📍 {ride.pickup_distance_km} km away</span>
        )}
      </div>

      <div className="route-card-details">
        <span className="meta-item">🗓 {dateStr}, {timeStr}</span>
        <span className="meta-item">
          <SeatDots total={ride.total_seats} remaining={ride.seats_remaining} />
          {ride.seats_remaining} seat{ride.seats_remaining !== 1 ? 's' : ''} left
        </span>
      </div>

      <div className="route-card-footer">
        <span className="fare">PKR {Number(ride.fare_per_seat).toLocaleString()} / seat</span>
        {showBook && (
          <button
            className={`btn ${alreadyBooked ? 'btn-booked' : 'btn-primary-sm'}`}
            disabled={!canBook}
            onClick={e => { e.stopPropagation(); onBook && onBook(ride); }}
          >
            {alreadyBooked ? '✓ Booked' : isOwnRide ? 'Your Ride' : 'Book'}
          </button>
        )}
      </div>
    </div>
  );
}

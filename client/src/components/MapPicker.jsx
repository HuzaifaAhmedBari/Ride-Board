import { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet default icon paths broken by bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Inner component: listens for map clicks and calls onPick(lat, lng)
function ClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

// Props:
//   label    — string shown above the map, e.g. "Pick origin"
//   value    — { lat, lng, address } | null
//   onChange — called with { lat, lng, address } when pin is placed or dragged
export default function MapPicker({ label, value, onChange, height = 220 }) {
  const [loading, setLoading] = useState(false);

  async function reverseGeocode(lat, lng) {
    setLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        { headers: { 'User-Agent': 'RideBoard/1.0' } }
      );
      const data = await res.json();
      onChange({ lat, lng, address: data.display_name });
    } catch {
      onChange({ lat, lng, address: `${lat.toFixed(5)}, ${lng.toFixed(5)}` });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="map-picker">
      {label && <label className="map-picker-label">{label}</label>}
      <MapContainer
        center={[24.8607, 67.0011]}
        zoom={12}
        style={{ height, borderRadius: 10, border: '2px solid var(--border)' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <ClickHandler onPick={reverseGeocode} />
        {value && (
          <Marker
            position={[value.lat, value.lng]}
            draggable
            eventHandlers={{
              dragend(e) {
                const { lat, lng } = e.target.getLatLng();
                reverseGeocode(lat, lng);
              }
            }}
          />
        )}
      </MapContainer>
      <p className="map-picker-hint">
        {loading
          ? '⏳ Resolving address...'
          : value
            ? `📍 ${value.address}`
            : 'Click the map to place a pin'}
      </p>
    </div>
  );
}

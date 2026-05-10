import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Button } from "@/components/ui/button";
import { Check, MapPin, Loader2, X } from 'lucide-react';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

function ClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

export default function MapPicker({ label, value, onChange, onCancel, height = 400, confirmRequired = true }) {
  const [tempValue, setTempValue] = useState(value);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setTempValue(value);
  }, [value]);

  async function reverseGeocode(lat, lng) {
    setLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        { headers: { 'User-Agent': 'RideBoard/1.0' } }
      );
      const data = await res.json();
      const newVal = { lat, lng, address: data.display_name };
      setTempValue(newVal);
      if (!confirmRequired) {
        onChange(newVal);
      }
    } catch {
      const newVal = { lat, lng, address: `${lat.toFixed(5)}, ${lng.toFixed(5)}` };
      setTempValue(newVal);
      if (!confirmRequired) {
        onChange(newVal);
      }
    } finally {
      setLoading(false);
    }
  }

  function handleConfirm() {
    if (tempValue) {
      onChange(tempValue);
    }
  }

  return (
    <div className="flex flex-col h-full bg-card overflow-hidden relative">
      {label && <div className="px-4 py-2 bg-muted text-xs font-bold uppercase tracking-widest text-muted-foreground border-b border-border">{label}</div>}
      
      <div className="flex-1 relative">
        <MapContainer
          center={[24.8607, 67.0011]}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
          className="z-10"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap'
          />
          <ClickHandler onPick={reverseGeocode} />
          {tempValue && (
            <Marker
              position={[tempValue.lat, tempValue.lng]}
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

        <div className="absolute bottom-4 left-4 right-4 z-[1000] space-y-2">
          {tempValue && (
            <div className="bg-card/90 backdrop-blur-md border border-border p-4 rounded-xl shadow-2xl flex items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] uppercase font-bold text-primary flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> Selected Location
                </p>
                <p className="text-sm text-white font-medium truncate mt-0.5">
                  {loading ? 'Resolving address...' : tempValue.address}
                </p>
              </div>
              {confirmRequired && (
                <Button 
                  onClick={handleConfirm} 
                  disabled={loading}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-10 px-6 shrink-0 shadow-lg shadow-emerald-900/20"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                  Confirm
                </Button>
              )}
            </div>
          )}

          {!tempValue && (
            <div className="bg-primary/20 backdrop-blur-md border border-primary/30 p-3 rounded-lg text-center animate-pulse">
              <p className="text-xs font-bold text-primary">Click anywhere on the map to select a point</p>
            </div>
          )}
        </div>

        {onCancel && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onCancel}
            className="absolute top-4 right-4 z-[1000] bg-card/50 hover:bg-muted text-white rounded-full h-8 w-8"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
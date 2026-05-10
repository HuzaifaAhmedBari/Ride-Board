import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Polyline, useMap, useMapEvents } from 'react-leaflet';
import api from '../api';
import AddressSearchBox from '../components/AddressSearchBox';
import MapPicker from '../components/MapPicker';
import RouteCard from '../components/RouteCard';
import { useAuthStore } from '../store/authStore';
import L from 'leaflet';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Map as MapIcon, Info, User, Phone, Mail, Navigation2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  shadowSize: [41, 41]
});
const blueIcon = new L.Icon.Default();

function MapEvents({ onMapClick }) {
  useMapEvents({
    click: () => onMapClick(),
  });
  return null;
}

function MapUpdater({ selectedRide, pickup, dropoff }) {
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
      if (pickup)  bounds.extend([pickup.lat,  pickup.lng]);
      if (dropoff) bounds.extend([dropoff.lat, dropoff.lng]);
      setTimeout(() => {
        map.fitBounds(bounds, { paddingTopLeft: [40, 40], paddingBottomRight: [40, 100], animate: true, maxZoom: 15 });
      }, 50);
    } else if (pickup && dropoff) {
      map.fitBounds(L.latLngBounds([[pickup.lat, pickup.lng], [dropoff.lat, dropoff.lng]]), { padding: [40, 40] });
    } else if (pickup) {
      map.setView([pickup.lat, pickup.lng], 13);
    } else if (dropoff) {
      map.setView([dropoff.lat, dropoff.lng], 13);
    }
  }, [selectedRide, pickup, dropoff, map]);
  return null;
}

export default function FindRidePage() {
  const { user } = useAuthStore();
  const [pickup,       setPickup]       = useState(null);
  const [dropoff,      setDropoff]      = useState(null);
  const [results,      setResults]      = useState([]);
  const [selectedRide, setSelectedRide] = useState(null);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState('');
  const [bookingError, setBookingError] = useState('');
  const [mapModalOpen, setMapModalOpen] = useState(null); 
  const [bookedRideIds, setBookedRideIds] = useState(new Set());

  useEffect(() => {
    async function loadAll() {
      setLoading(true);
      try {
        const { data: ridesData } = await api.post('/search', {});
        setResults(ridesData);
        if (user) {
          const { data: userData } = await api.get('/users/me');
          if (userData?.booked_rides) setBookedRideIds(new Set(userData.booked_rides.map(b => b.ride_id)));
        }
      } catch {
        setError('Failed to load rides');
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, [user]);

  useEffect(() => {
    handleSearch();
  }, [pickup, dropoff]);

  async function handleSearch() {
    setLoading(true);
    setError('');
    setSelectedRide(null);
    
    const payload = {};
    if (pickup) { payload.pickup_lat = pickup.lat; payload.pickup_lng = pickup.lng; }
    if (dropoff) { payload.dropoff_lat = dropoff.lat; payload.dropoff_lng = dropoff.lng; }

    try {
      const { data } = await api.post('/search', payload);
      setResults(data);
      if (data.length === 0 && (pickup || dropoff)) setError('No rides found near these locations.');
    } catch (err) {
      setError(err.response?.data?.error || 'Search failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleBook(ride) {
    setBookingError('');
    try {
      await api.post('/bookings', { ride_id: ride.id });
      setBookedRideIds(prev => new Set(prev).add(ride.id));
      setResults(prev => prev.map(r => r.id === ride.id ? { ...r, seats_remaining: r.seats_remaining - 1, status: r.seats_remaining - 1 === 0 ? 'full' : 'active' } : r));
    } catch (err) {
      const errorMsg = err.response?.data?.error || '';
      setBookingError(errorMsg.includes('bookings_ride_id_rider_id_key') ? 'You have already booked this ride.' : (errorMsg || 'Booking failed'));
    }
  }

  const polylineCoords = selectedRide?.route_polyline?.coordinates?.map(c => [c[1], c[0]]) || [];

  return (
    <div className="flex flex-col h-[calc(100vh-65px)] bg-background overflow-hidden">
      <Dialog open={!!mapModalOpen} onOpenChange={() => setMapModalOpen(null)}>
        <DialogContent showCloseButton={false} className="max-w-4xl h-[80vh] p-0 bg-card border-border text-white overflow-hidden">
          <MapPicker 
            label={`Select ${mapModalOpen === 'pickup' ? 'Pickup' : 'Dropoff'} Location`}
            value={mapModalOpen === 'pickup' ? pickup : dropoff} 
            onChange={(pos) => {
              if (mapModalOpen === 'pickup')  setPickup(pos);
              if (mapModalOpen === 'dropoff') setDropoff(pos);
              setMapModalOpen(null);
            }} 
            onCancel={() => setMapModalOpen(null)}
          />
        </DialogContent>
      </Dialog>

      <div className="flex flex-1 overflow-hidden">
        
        <aside className="w-full md:w-[400px] border-r border-border flex flex-col bg-card/50 backdrop-blur-sm z-20">
          <div className="p-4 space-y-4 border-b border-border">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Search className="w-5 h-5 text-primary" />
                Find a Ride
              </h2>
            </div>
            
            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="flex-1">
                  <AddressSearchBox placeholder="Pickup Location" onSelect={setPickup} value={pickup?.address} />
                </div>
                <Button variant="outline" size="icon" onClick={() => setMapModalOpen('pickup')} className="border-border hover:bg-muted">
                  <MapIcon className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <AddressSearchBox placeholder="Dropoff Location" onSelect={setDropoff} value={dropoff?.address} />
                </div>
                <Button variant="outline" size="icon" onClick={() => setMapModalOpen('dropoff')} className="border-border hover:bg-muted">
                  <MapIcon className="w-4 h-4" />
                </Button>
              </div>
              <Button onClick={handleSearch} disabled={loading} className="w-full bg-primary hover:bg-primary font-bold">
                {loading ? 'Searching...' : 'Search Rides'}
              </Button>
            </div>
            {error && <p className="text-xs text-red-400 text-center font-medium animate-pulse">{error}</p>}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            <AnimatePresence mode="popLayout">
              {loading ? (
                [1,2,3].map(i => <Skeleton key={i} className="h-[180px] w-full rounded-xl bg-muted" />)
              ) : results.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground space-y-2 text-center">
                  <Info className="w-12 h-12 opacity-20" />
                  <p className="font-medium text-muted-foreground">No rides available right now</p>
                  <p className="text-sm">Try adjusting your search or check back later</p>
                </div>
              ) : (
                results.map((ride) => (
                  <RouteCard
                    key={ride.id}
                    ride={ride}
                    isSelected={selectedRide?.id === ride.id}
                    onSelect={setSelectedRide}
                    onBook={handleBook}
                    alreadyBooked={bookedRideIds.has(ride.id)}
                    isOwnRide={ride.poster_id === user?.id}
                  />
                ))
              )}
            </AnimatePresence>
          </div>
        </aside>

        <main className="flex-1 relative bg-card">
          <MapContainer center={[24.8607, 67.0011]} zoom={11} className="h-full w-full grayscale-[0.2] contrast-[1.1]">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
            <MapUpdater selectedRide={selectedRide} pickup={pickup} dropoff={dropoff} />
            <MapEvents onMapClick={() => setSelectedRide(null)} />
            
            {pickup  && <Marker position={[pickup.lat,  pickup.lng]}  icon={redIcon} />}
            {dropoff && <Marker position={[dropoff.lat, dropoff.lng]} icon={redIcon} />}

            {selectedRide && (
              <>
                <Marker position={[selectedRide.origin_lat,      selectedRide.origin_lng]}      icon={blueIcon} />
                <Marker position={[selectedRide.destination_lat, selectedRide.destination_lng]} icon={blueIcon} />
                {polylineCoords.length > 0 && <Polyline positions={polylineCoords} color="#00D084" weight={5} opacity={0.8} />}
              </>
            )}
          </MapContainer>

          <AnimatePresence>
            {selectedRide && (
              <motion.div 
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="absolute bottom-6 left-6 right-6 z-[1000] md:left-auto md:w-[400px]"
              >
                <Card className="bg-card/90 border-border backdrop-blur-lg shadow-2xl">
                  <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <CardTitle className="text-white text-lg">Selected Ride</CardTitle>
                    <Button variant="ghost" size="icon" onClick={() => setSelectedRide(null)} className="h-8 w-8 text-muted-foreground hover:text-white">×</Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
                      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                        <User className="text-white w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link 
                          to={`/driver/${selectedRide.poster?.id}`} 
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary font-bold hover:underline block truncate"
                        >
                          {selectedRide.poster?.name || 'Driver'}
                        </Link>
                        <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                          {selectedRide.poster?.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3"/> {selectedRide.poster.phone}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">From</p>
                        <p className="text-sm text-muted-foreground font-medium truncate">{selectedRide.origin_address.split(',')[0]}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">To</p>
                        <p className="text-sm text-muted-foreground font-medium truncate">{selectedRide.destination_address.split(',')[0]}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <div className="text-2xl font-black text-primary">
                        PKR {selectedRide.fare_per_seat}
                        <span className="text-xs text-muted-foreground font-normal ml-1">/ seat</span>
                      </div>
                      <Button
                        disabled={bookedRideIds.has(selectedRide.id) || selectedRide.poster_id === user?.id || selectedRide.seats_remaining === 0}
                        onClick={() => handleBook(selectedRide)}
                        className={`font-bold ${bookedRideIds.has(selectedRide.id) ? 'bg-emerald-600' : 'bg-primary hover:bg-primary'}`}
                      >
                        {bookedRideIds.has(selectedRide.id) ? '✓ Booked' : 'Book Now'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
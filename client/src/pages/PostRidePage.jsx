import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import AddressSearchBox from '../components/AddressSearchBox';
import MapPicker from '../components/MapPicker';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Car, MapPin, Calendar, Users, Banknote, ArrowRight, Loader2, Navigation2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PostRidePage() {
  const navigate = useNavigate();
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [activePicking, setActivePicking] = useState('origin'); // 'origin' or 'destination'
  const [startTime, setStartTime] = useState('');
  const [seats, setSeats] = useState(1);
  const [fare, setFare] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!origin || !destination) {
      setError('Please select both origin and destination.');
      return;
    }
    
    setLoading(true);
    setError('');

    const fifteenMinsFromNow = new Date(Date.now() + 15 * 60 * 1000);
    if (new Date(startTime) < fifteenMinsFromNow) {
      setError('Departure must be at least 15 minutes from now.');
      setLoading(false);
      return;
    }

    try {
      await api.post('/rides', {
        origin_address: origin.address,
        origin_lat: origin.lat,
        origin_lng: origin.lng,
        destination_address: destination.address,
        destination_lat: destination.lat,
        destination_lng: destination.lng,
        start_time: new Date(startTime).toISOString(),
        total_seats: parseInt(seats, 10),
        fare_per_seat: parseFloat(fare)
      });
      navigate('/find');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to post ride');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-65px)] bg-background p-6 md:p-12 overflow-y-auto">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Form (5 columns) */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-5"
        >
          <Card className="bg-card border-border shadow-2xl sticky top-4">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-white flex items-center gap-2">
                <Car className="text-primary w-6 h-6" />
                Post a New Ride
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className={`p-4 rounded-xl border transition-all ${activePicking === 'origin' ? 'bg-primary/5 border-primary/30 ring-1 ring-primary/20' : 'bg-muted/50 border-border'}`} onClick={() => setActivePicking('origin')}>
                    <Label className="text-muted-foreground mb-2 block flex items-center justify-between">
                      Origin Location
                      {activePicking === 'origin' && <span className="text-[10px] bg-primary text-white px-2 py-0.5 rounded-full uppercase">Picking on Map</span>}
                    </Label>
                    <AddressSearchBox placeholder="Where are you starting?" onSelect={setOrigin} value={origin?.address} />
                  </div>

                  <div className={`p-4 rounded-xl border transition-all ${activePicking === 'destination' ? 'bg-primary/5 border-primary/30 ring-1 ring-primary/20' : 'bg-muted/50 border-border'}`} onClick={() => setActivePicking('destination')}>
                    <Label className="text-muted-foreground mb-2 block flex items-center justify-between">
                      Destination Location
                      {activePicking === 'destination' && <span className="text-[10px] bg-primary text-white px-2 py-0.5 rounded-full uppercase">Picking on Map</span>}
                    </Label>
                    <AddressSearchBox placeholder="Where are you going?" onSelect={setDestination} value={destination?.address} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" /> Departure
                    </Label>
                    <Input
                      type="datetime-local"
                      required
                      className="bg-muted border-border text-white"
                      value={startTime}
                      onChange={e => setStartTime(e.target.value)}
                      min={new Date(Date.now() + 15 * 60000).toISOString().slice(0, 16)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground flex items-center gap-2">
                      <Users className="w-4 h-4 text-primary" /> Available Seats
                    </Label>
                    <Input
                      type="number"
                      required
                      min="1"
                      max="6"
                      className="bg-muted border-border text-white"
                      value={seats}
                      onChange={e => {
                        const val = parseInt(e.target.value, 10);
                        if (val > 6) setSeats(6);
                        else if (val < 1) setSeats(1);
                        else setSeats(e.target.value);
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground flex items-center gap-2">
                    <Banknote className="w-4 h-4 text-emerald-500" /> Fare per Seat (PKR)
                  </Label>
                  <Input
                    type="number"
                    required
                    min="0"
                    step="10"
                    className="bg-muted border-border text-white text-lg font-bold"
                    value={fare}
                    onChange={e => {
                      const val = parseFloat(e.target.value);
                      if (val < 0) setFare(0);
                      else setFare(e.target.value);
                    }}
                  />
                </div>

                {error && <p className="text-sm text-red-400 font-medium">{error}</p>}

                <Button 
                  type="submit" 
                  className="w-full h-12 bg-primary hover:bg-primary text-lg font-bold shadow-lg shadow-primary/20"
                  disabled={loading}
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm & Post Ride'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Right: Map Picker (7 columns) */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-7 space-y-4"
        >
          <div className="h-full flex flex-col gap-4">
            <Card className="bg-card border-border overflow-hidden flex-1 min-h-[500px] flex flex-col">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <Navigation2 className="w-4 h-4 text-primary" />
                    Interactive Map Selection
                  </CardTitle>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant={activePicking === 'origin' ? 'default' : 'outline'} 
                    size="sm" 
                    onClick={() => setActivePicking('origin')}
                    className={activePicking === 'origin' ? 'bg-primary' : 'border-border text-muted-foreground'}
                  >
                    Set Origin
                  </Button>
                  <Button 
                    variant={activePicking === 'destination' ? 'default' : 'outline'} 
                    size="sm" 
                    onClick={() => setActivePicking('destination')}
                    className={activePicking === 'destination' ? 'bg-primary' : 'border-border text-muted-foreground'}
                  >
                    Set Destination
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0 flex-1 relative border-t border-border">
                <MapPicker 
                  key={activePicking} // Remount map when switching mode to reset temp selection
                  label={activePicking === 'origin' ? "Select Starting Point" : "Select Destination Point"}
                  value={activePicking === 'origin' ? origin : destination} 
                  onChange={(val) => {
                    if (activePicking === 'origin') {
                      setOrigin(val);
                      if (!destination) setActivePicking('destination');
                    } else {
                      setDestination(val);
                    }
                  }} 
                  height="100%" 
                  confirmRequired={false}
                />
              </CardContent>
            </Card>

            {origin && destination && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                <Card className="bg-primary/10 border-primary/20">
                  <CardContent className="p-4 flex items-center justify-between text-white">
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] uppercase font-bold text-primary">Planned Route</p>
                      <div className="flex items-center gap-2 text-sm mt-1">
                        <span className="truncate">{origin.address.split(',')[0]}</span>
                        <ArrowRight className="w-4 h-4 shrink-0 text-muted-foreground" />
                        <span className="truncate">{destination.address.split(',')[0]}</span>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-[10px] uppercase font-bold text-primary">Est. Total</p>
                      <p className="text-lg font-black text-white">PKR {fare * seats}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        </motion.div>

      </div>
    </div>
  );
}

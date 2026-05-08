import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import api from '../api';
import RouteCard from '../components/RouteCard';
import ChatWindow from '../components/ChatWindow';
import { useAuthStore } from '../store/authStore';
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  User, Phone, Mail, Calendar, Star, MessageSquare, XCircle, 
  Map as MapIcon, Settings, CheckCircle2, History, Car, Users, Info 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const blueIcon = new L.Icon.Default();

function MapUpdater({ selectedRide }) {
  const map = useMap();
  useEffect(() => {
    if (selectedRide) {
      let bounds;
      if (selectedRide.route_polyline?.coordinates?.length > 0) {
        const coords = selectedRide.route_polyline.coordinates.map(c => [c[1], c[0]]);
        bounds = L.latLngBounds(coords);
      } else {
        bounds = L.latLngBounds([[selectedRide.origin_lat, selectedRide.origin_lng], [selectedRide.destination_lat, selectedRide.destination_lng]]);
      }
      setTimeout(() => {
        if (!map) return;
        map.invalidateSize();
        map.fitBounds(bounds, { padding: [40, 40], animate: true, maxZoom: 15 });
      }, 350);
    }
  }, [selectedRide, map]);
  return null;
}

export default function ProfilePage() {
  const { profile } = useAuthStore();
  const [data, setData] = useState({ posted_rides: [], posted_active: [], posted_expired: [], booked_rides: [] });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', phone: '' });
  const [selectedRide, setSelectedRide] = useState(null);
  const [cancelConfirmRide, setCancelConfirmRide] = useState(null);
  const [chatRide, setChatRide] = useState(null);
  const [reviewModal, setReviewModal] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const res = await api.get('/users/me');
      setData({
        posted_rides: res.data.posted_rides || [],
        posted_active: res.data.posted_active || [],
        posted_expired: res.data.posted_expired || [],
        booked_rides: res.data.booked_rides || []
      });
      if (res.data.profile) setEditForm({ name: res.data.profile.name || '', phone: res.data.profile.phone || '' });
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }

  useEffect(() => { loadData(); }, []);

  async function handleSaveProfile() {
    const name = editForm.name.trim();
    const phone = editForm.phone.trim();
    
    if (name.length < 3) {
      alert('Name must be at least 3 characters long');
      return;
    }
    if (!/^\d{11}$/.test(phone)) {
      alert('Please enter a valid 11-digit phone number');
      return;
    }

    try {
      await api.patch('/users/me', editForm);
      setEditing(false);
      loadData();
    } catch (err) { alert('Failed to update profile'); }
  }

  async function confirmCancelBooking() {
    if (!cancelConfirmRide) return;
    const isDriver = cancelConfirmRide.poster_id === profile.id;
    try {
      if (isDriver) {
        await api.patch(`/rides/${cancelConfirmRide.id}/cancel`);
      } else {
        await api.delete(`/bookings/${cancelConfirmRide.id}`);
      }
      loadData();
      if (selectedRide?.id === cancelConfirmRide.id) setSelectedRide(null);
      setCancelConfirmRide(null);
    } catch (err) {
      alert(err.response?.data?.error || `Failed to cancel ${isDriver ? 'ride' : 'booking'}`);
      setCancelConfirmRide(null);
    }
  }

  // Auto-scroll selected card to center
  useEffect(() => {
    if (selectedRide) {
      const element = document.getElementById(`ride-card-${selectedRide.id}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [selectedRide]);

  const handleSubmitReview = async () => {
    if (!reviewModal) return;
    setSubmittingReview(true);
    try {
      await api.post('/reviews', { ride_id: reviewModal.ride_id, reviewee_id: reviewModal.reviewee_id, rating: reviewRating, comment: reviewComment });
      setReviewModal(null);
      setReviewRating(5);
      setReviewComment('');
      await loadData();
    } catch (err) { alert(err.response?.data?.error || 'Failed to submit review'); } finally { setSubmittingReview(false); }
  };

  const polylineCoords = selectedRide?.route_polyline?.coordinates?.map(c => [c[1], c[0]]) || [];
  const displayDriver = selectedRide?.poster || profile;

  if (loading) return (
    <div className="flex items-center justify-center h-[calc(100vh-65px)] text-white bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground font-medium">Loading your profile...</p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-65px)] bg-background overflow-hidden text-white">
      
      {/* LEFT COLUMN */}
      <div className={`flex-1 overflow-y-auto p-6 transition-all duration-500 custom-scrollbar ${selectedRide ? 'md:w-[45%]' : 'w-full'}`}>
        <div className="max-w-5xl mx-auto space-y-8">
          
          {/* PROFILE CARD */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="bg-card border-border overflow-hidden relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[80px] -mr-32 -mt-32" />
              <CardContent className="pt-8 pb-8 relative">
                <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-8">
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="relative group">
                      <div className="w-24 h-24 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center text-4xl font-black shadow-2xl shadow-primary/20 transform group-hover:scale-105 transition-transform">
                        {profile?.name?.charAt(0)}
                      </div>
                    </div>
                    <div className="text-center md:text-left space-y-2">
                      <h1 className="text-3xl font-black tracking-tight">{profile?.name}</h1>
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-muted-foreground text-xs font-medium uppercase tracking-wider">
                        <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-primary"/> Joined {new Date(profile?.created_at).toLocaleDateString('en-PK', { month: 'short', year: 'numeric' })}</span>
                        {profile?.phone && <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-primary"/> {profile.phone}</span>}
                        {profile?.rating?.[0] && (
                          <span className="flex items-center gap-1.5 text-amber-500 font-bold bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                            <Star className="w-3.5 h-3.5 fill-amber-500" /> {Number(profile.rating[0].avg_rating).toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setEditing(!editing)} className="border-border bg-muted/50 hover:bg-muted text-foreground font-bold">
                    <Settings className="w-4 h-4 mr-2" />
                    {editing ? 'Cancel' : 'Edit Profile'}
                  </Button>
                </div>

                <AnimatePresence>
                  {editing && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-8 pt-8 border-t border-border overflow-hidden"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
                        <div className="space-y-2">
                          <Label className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">Full Name</Label>
                          <Input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="bg-background border-border h-12 focus:ring-primary" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">Phone Number</Label>
                          <Input 
                            value={editForm.phone} 
                            maxLength={11}
                            placeholder="03XXXXXXXXX"
                            onChange={e => setEditForm({ ...editForm, phone: e.target.value.replace(/\D/g, '') })} 
                            className={`bg-background border-border h-12 focus:ring-primary transition-colors ${editForm.phone && editForm.phone.length !== 11 ? 'border-red-500/50 bg-red-500/5' : ''}`} 
                          />
                        </div>
                      </div>
                      <div className="flex gap-3 mt-6">
                        <Button onClick={handleSaveProfile} className="bg-primary hover:bg-primary font-black px-8">Save Changes</Button>
                        <Button variant="ghost" onClick={() => setEditing(false)} className="text-muted-foreground hover:text-white">Discard</Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>

          <Tabs defaultValue="active" className="w-full flex flex-col">
            <TabsList className="bg-card border border-border p-1 mb-6 h-12 rounded-xl w-full max-w-md mx-auto">
              <TabsTrigger value="active" className="flex-1 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white font-bold transition-all">Active Rides</TabsTrigger>
              <TabsTrigger value="history" className="flex-1 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white font-bold transition-all">Journey History</TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="outline-none space-y-12">
              <div className={`grid grid-cols-1 ${selectedRide ? '' : 'xl:grid-cols-2'} gap-8 items-start`}>
                
                {/* POSTED RIDES (DRIVING) */}
                <section className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-black text-white flex items-center gap-3">
                      <div className="p-2 bg-primary/20 rounded-lg">
                        <Car className="w-5 h-5 text-primary" />
                      </div>
                      Driving (Posted)
                    </h2>
                    <Badge variant="outline" className="border-border text-muted-foreground">
                      {data.posted_active.length} ACTIVE
                    </Badge>
                  </div>
                  
                  {data.posted_active.length === 0 ? (
                    <div className="bg-card/30 border-2 border-dashed border-border rounded-2xl p-10 text-center space-y-3">
                      <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto opacity-50">
                        <Car className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground font-medium">You haven't posted any rides.</p>
                      <Link to="/post" className={cn(buttonVariants({ variant: 'link' }), "text-primary p-0 h-auto")}>
                        Post a Ride Now
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {data.posted_active.map(ride => (
                        <RouteCard key={ride.id} ride={{...ride, poster: profile}} isSelected={selectedRide?.id === ride.id} onSelect={setSelectedRide} showBook={false} isOwnRide={true} onChat={setChatRide} onCancel={setCancelConfirmRide} showLabels={true} />
                      ))}
                    </div>
                  )}
                </section>

                {/* BOOKED RIDES (PASSENGER) */}
                <section className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-black text-white flex items-center gap-3">
                      <div className="p-2 bg-secondary/20 rounded-lg">
                        <Users className="w-5 h-5 text-secondary" />
                      </div>
                      Passenger (Booked)
                    </h2>
                    <Badge variant="outline" className="border-border text-muted-foreground">
                      {data.booked_rides.filter(b => b.status !== 'cancelled' && (b.ride.status === 'active' || b.ride.status === 'full') && new Date(b.ride.start_time) > new Date()).length} UPCOMING
                    </Badge>
                  </div>
                  
                  {data.booked_rides.filter(b => b.status !== 'cancelled' && (b.ride.status === 'active' || b.ride.status === 'full') && new Date(b.ride.start_time) > new Date()).length === 0 ? (
                    <div className="bg-card/30 border-2 border-dashed border-border rounded-2xl p-10 text-center space-y-3">
                      <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto opacity-50">
                        <Users className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground font-medium">No upcoming bookings found.</p>
                      <Link to="/find" className={cn(buttonVariants({ variant: 'link' }), "text-primary p-0 h-auto")}>
                        Find a Ride
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {data.booked_rides.filter(b => b.status !== 'cancelled' && (b.ride.status === 'active' || b.ride.status === 'full') && new Date(b.ride.start_time) > new Date()).map(booking => (
                        <RouteCard key={booking.id} ride={booking.ride} isSelected={selectedRide?.id === booking.ride.id} onSelect={() => setSelectedRide(booking.ride)} alreadyBooked={true} onCancel={setCancelConfirmRide} showBook={false} onChat={setChatRide} showLabels={true} />
                      ))}
                    </div>
                  )}
                </section>
              </div>
            </TabsContent>

            <TabsContent value="history" className="outline-none">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-muted rounded-lg">
                    <History className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <h2 className="text-xl font-black text-white">Journey History</h2>
                </div>
                
                {(() => {
                  const completed = [
                    ...data.posted_expired.map(r => ({ ...r, role: 'driver', poster: profile })),
                    ...data.booked_rides.filter(b => b.ride.status === 'expired' || new Date(b.ride.start_time) <= new Date()).map(b => ({ ...b.ride, role: 'passenger', is_reviewed: b.is_reviewed, booking_id: b.id }))
                  ].sort((a, b) => new Date(b.start_time) - new Date(a.start_time));
                  
                  if (completed.length === 0) return (
                    <div className="p-20 text-center bg-card/20 border border-border rounded-3xl">
                      <Info className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground font-medium italic">No past journeys on record.</p>
                    </div>
                  );
                  
                  return (
                    <div className={`grid grid-cols-1 ${selectedRide ? '' : 'xl:grid-cols-2'} gap-6 items-start`}>
                      {completed.map(ride => (
                        <div key={ride.id} id={`ride-card-${ride.id}`} className="group relative">
                          <RouteCard 
                            ride={ride} 
                            isSelected={selectedRide?.id === ride.id} 
                            onSelect={setSelectedRide} 
                            isCompleted={true} 
                            showBook={false} 
                            hideBadge={true} 
                            extraFooterAction={
                              ride.role === 'passenger' && !reviewModal && !ride.is_reviewed ? (
                                <Button 
                                  size="sm" 
                                  className="h-7 bg-amber-500 hover:bg-amber-600 text-black font-black text-[10px] px-3 rounded-full shadow-lg shadow-amber-500/20" 
                                  onClick={(e) => { e.stopPropagation(); setReviewModal({ ride_id: ride.id, reviewee_id: ride.poster_id }); }}
                                >
                                  RATE DRIVER
                                </Button>
                              ) : ride.role === 'passenger' && ride.is_reviewed ? (
                                <div className="flex items-center gap-1 text-[10px] text-emerald-500 font-black uppercase bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">
                                  <CheckCircle2 className="w-3 h-3"/> Reviewed
                                </div>
                              ) : null
                            }
                          />
                          <div className="absolute top-4 left-4">
                            <Badge className={`${ride.role === 'driver' ? 'bg-primary/20 text-primary border-primary/30' : 'bg-secondary/20 text-secondary border-secondary/30'} backdrop-blur-md`}>
                              {ride.role.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* RIGHT COLUMN (MAP SIDEBAR) */}
      <AnimatePresence>
        {selectedRide && (
          <motion.aside 
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="w-full md:w-[55%] border-l border-border bg-card flex flex-col z-30 shadow-2xl"
          >
            <div className="p-6 border-b border-border flex items-center justify-between bg-card/80 backdrop-blur-md">
              <div>
                <h3 className="font-black text-lg text-white">Ride Details</h3>
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Trip Overview & Map</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelectedRide(null)} className="h-10 w-10 bg-muted/50 rounded-full text-muted-foreground hover:text-white">✕</Button>
            </div>
            
            <div className="flex-1 relative overflow-hidden">
              <MapContainer center={[24.8607, 67.0011]} zoom={11} className="h-full w-full grayscale-[0.2]">
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <MapUpdater selectedRide={selectedRide} />
                <Marker position={[selectedRide.origin_lat, selectedRide.origin_lng]} icon={blueIcon} />
                <Marker position={[selectedRide.destination_lat, selectedRide.destination_lng]} icon={blueIcon} />
                {polylineCoords.length > 0 && <Polyline positions={polylineCoords} color="#00D084" weight={6} opacity={0.8} lineCap="round" />}
              </MapContainer>

            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* CHAT DIALOG */}
      <Dialog open={!!chatRide} onOpenChange={() => setChatRide(null)}>
        <DialogContent className="max-w-lg p-0 bg-card border-border h-[600px] flex flex-col rounded-3xl overflow-hidden shadow-2xl">
          {chatRide && (
            <ChatWindow 
              rideId={chatRide.id} 
              rideTitle={`${chatRide.origin_address.split(',')[0]} to ${chatRide.destination_address.split(',')[0]}`} 
            />
          )}
        </DialogContent>
      </Dialog>

      {/* CANCEL DIALOG */}
      <Dialog open={!!cancelConfirmRide} onOpenChange={() => setCancelConfirmRide(null)}>
        <DialogContent className="bg-card border-border text-white rounded-3xl p-8">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-red-500 text-2xl font-black">
              <XCircle className="w-8 h-8" />
              {cancelConfirmRide?.poster_id === profile.id ? 'Cancel Your Ride?' : 'Cancel Booking?'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-lg pt-4 leading-relaxed">
              {cancelConfirmRide?.poster_id === profile.id 
                ? <>Are you sure you want to cancel your trip to <strong className="text-white">{cancelConfirmRide?.destination_address?.split(',')[0]}</strong>?</>
                : <>Are you sure you want to cancel your booking for the trip to <strong className="text-white">{cancelConfirmRide?.destination_address?.split(',')[0]}</strong>?</>
              }
            </DialogDescription>
          </DialogHeader>
          <div className="bg-red-500/5 border border-red-500/10 p-4 rounded-xl mt-6">
            <p className="text-xs text-red-400 font-bold flex items-center gap-2 tracking-wide uppercase">
              <Info className="w-4 h-4" /> This action cannot be undone.
            </p>
          </div>
          <DialogFooter className="mt-8 gap-3 sm:flex-row flex-col">
            <Button variant="outline" onClick={() => setCancelConfirmRide(null)} className="flex-1 border-border bg-muted/50 hover:bg-muted h-12 font-bold rounded-xl">
              {cancelConfirmRide?.poster_id === profile.id ? 'Keep Ride' : 'Keep My Seat'}
            </Button>
            <Button onClick={confirmCancelBooking} className="flex-1 bg-red-950/30 text-red-500 border border-red-500/20 hover:bg-red-950/50 hover:text-red-400 h-12 font-black rounded-xl transition-all shadow-none">Yes, Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* REVIEW DIALOG */}
      <Dialog open={!!reviewModal} onOpenChange={() => setReviewModal(null)}>
        <DialogContent className="bg-card border-border text-white text-center rounded-3xl p-8 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-3xl font-black tracking-tight">How was your trip?</DialogTitle>
            <DialogDescription className="text-muted-foreground pt-2 text-base">Your feedback helps keep the RideBoard community safe and reliable for everyone.</DialogDescription>
          </DialogHeader>
          <div className="py-8 flex flex-col items-center gap-8">
            <div className="flex gap-3">
              {[1, 2, 3, 4, 5].map(num => (
                <button 
                  key={num} 
                  onClick={() => setReviewRating(num)} 
                  className={`transition-all duration-300 transform hover:scale-125 ${num <= reviewRating ? 'text-amber-500' : 'text-muted-foreground'}`}
                >
                  <Star className={`w-12 h-12 ${num <= reviewRating ? 'fill-amber-500' : ''}`} />
                </button>
              ))}
            </div>
            <div className="w-full space-y-3 text-left">
              <Label className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest ml-1">Share your experience (Optional)</Label>
              <textarea 
                className="w-full bg-background border-2 border-border rounded-2xl p-4 text-sm focus:border-primary outline-none transition-all resize-none min-h-[120px]" 
                placeholder="Was the driver punctual? How was the vehicle?" 
                value={reviewComment}
                onChange={e => setReviewComment(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="gap-3 sm:flex-row flex-col">
            <Button variant="ghost" onClick={() => setReviewModal(null)} className="flex-1 text-muted-foreground hover:text-white h-12">Skip</Button>
            <Button onClick={handleSubmitReview} disabled={submittingReview} className="flex-1 bg-primary hover:bg-primary font-black h-12 rounded-xl shadow-lg shadow-primary/20">
              {submittingReview ? 'Submitting...' : 'Submit Review'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

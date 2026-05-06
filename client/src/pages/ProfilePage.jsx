import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import api from '../api';
import RouteCard from '../components/RouteCard';
import ChatWindow from '../components/ChatWindow';
import { useAuthStore } from '../store/authStore';
import { Button } from "@/components/ui/button";
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
    if (!/^\d{10,12}$/.test(phone)) {
      alert('Please enter a valid phone number (10-12 digits)');
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
    try {
      await api.delete(`/bookings/${cancelConfirmRide.id}`);
      loadData();
      if (selectedRide?.id === cancelConfirmRide.id) setSelectedRide(null);
      setCancelConfirmRide(null);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to cancel booking');
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
    <div className="flex items-center justify-center h-[calc(100vh-65px)] text-white bg-slate-950">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 font-medium">Loading your profile...</p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-65px)] bg-slate-950 overflow-hidden text-white">
      
      {/* LEFT COLUMN */}
      <div className={`flex-1 overflow-y-auto p-6 transition-all duration-500 custom-scrollbar ${selectedRide ? 'md:w-[45%]' : 'w-full'}`}>
        <div className="max-w-5xl mx-auto space-y-8">
          
          {/* PROFILE CARD */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="bg-slate-900 border-slate-800 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/5 blur-[80px] -mr-32 -mt-32" />
              <CardContent className="pt-8 pb-8 relative">
                <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-8">
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="relative group">
                      <div className="w-24 h-24 bg-gradient-to-br from-violet-600 to-indigo-700 rounded-2xl flex items-center justify-center text-4xl font-black shadow-2xl shadow-violet-500/20 transform group-hover:scale-105 transition-transform">
                        {profile?.name?.charAt(0)}
                      </div>
                    </div>
                    <div className="text-center md:text-left space-y-2">
                      <h1 className="text-3xl font-black tracking-tight">{profile?.name}</h1>
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-slate-400 text-xs font-medium uppercase tracking-wider">
                        <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-violet-500"/> Joined {new Date(profile?.created_at).toLocaleDateString('en-PK', { month: 'short', year: 'numeric' })}</span>
                        {profile?.phone && <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-violet-500"/> {profile.phone}</span>}
                        {profile?.rating?.[0] && (
                          <span className="flex items-center gap-1.5 text-amber-500 font-bold bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                            <Star className="w-3.5 h-3.5 fill-amber-500" /> {Number(profile.rating[0].avg_rating).toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setEditing(!editing)} className="border-slate-800 bg-slate-800/50 hover:bg-slate-800 text-slate-300 font-bold">
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
                      className="mt-8 pt-8 border-t border-slate-800 overflow-hidden"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
                        <div className="space-y-2">
                          <Label className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Full Name</Label>
                          <Input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="bg-slate-950 border-slate-800 h-12 focus:ring-violet-500" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Phone Number</Label>
                          <Input value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} className="bg-slate-950 border-slate-800 h-12 focus:ring-violet-500" />
                        </div>
                      </div>
                      <div className="flex gap-3 mt-6">
                        <Button onClick={handleSaveProfile} className="bg-violet-600 hover:bg-violet-500 font-black px-8">Save Changes</Button>
                        <Button variant="ghost" onClick={() => setEditing(false)} className="text-slate-400 hover:text-white">Discard</Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>

          <Tabs defaultValue="active" className="w-full flex flex-col">
            <TabsList className="bg-slate-900 border border-slate-800 p-1 mb-6 h-12 rounded-xl w-full max-w-md mx-auto">
              <TabsTrigger value="active" className="flex-1 rounded-lg data-[state=active]:bg-violet-600 data-[state=active]:text-white font-bold transition-all">Active Rides</TabsTrigger>
              <TabsTrigger value="history" className="flex-1 rounded-lg data-[state=active]:bg-violet-600 data-[state=active]:text-white font-bold transition-all">Journey History</TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="outline-none space-y-12">
              <div className={`grid grid-cols-1 ${selectedRide ? '' : 'xl:grid-cols-2'} gap-8 items-start`}>
                
                {/* POSTED RIDES (DRIVING) */}
                <section className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-black text-white flex items-center gap-3">
                      <div className="p-2 bg-violet-600/20 rounded-lg">
                        <Car className="w-5 h-5 text-violet-500" />
                      </div>
                      Driving (Posted)
                    </h2>
                    <Badge variant="outline" className="border-slate-800 text-slate-500">
                      {data.posted_active.length} ACTIVE
                    </Badge>
                  </div>
                  
                  {data.posted_active.length === 0 ? (
                    <div className="bg-slate-900/30 border-2 border-dashed border-slate-800 rounded-2xl p-10 text-center space-y-3">
                      <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mx-auto opacity-50">
                        <Car className="w-6 h-6 text-slate-500" />
                      </div>
                      <p className="text-slate-500 font-medium">You haven't posted any rides.</p>
                      <Button asChild variant="link" className="text-violet-500 p-0 h-auto">
                        <Link to="/post">Post a Ride Now</Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {data.posted_active.map(ride => (
                        <RouteCard key={ride.id} ride={{...ride, poster: profile}} isSelected={selectedRide?.id === ride.id} onSelect={setSelectedRide} showBook={false} isOwnRide={true} onChat={setChatRide} />
                      ))}
                    </div>
                  )}
                </section>

                {/* BOOKED RIDES (PASSENGER) */}
                <section className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-black text-white flex items-center gap-3">
                      <div className="p-2 bg-indigo-600/20 rounded-lg">
                        <Users className="w-5 h-5 text-indigo-500" />
                      </div>
                      Passenger (Booked)
                    </h2>
                    <Badge variant="outline" className="border-slate-800 text-slate-500">
                      {data.booked_rides.filter(b => (b.ride.status === 'active' || b.ride.status === 'full') && new Date(b.ride.start_time) > new Date()).length} UPCOMING
                    </Badge>
                  </div>
                  
                  {data.booked_rides.filter(b => (b.ride.status === 'active' || b.ride.status === 'full') && new Date(b.ride.start_time) > new Date()).length === 0 ? (
                    <div className="bg-slate-900/30 border-2 border-dashed border-slate-800 rounded-2xl p-10 text-center space-y-3">
                      <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mx-auto opacity-50">
                        <Users className="w-6 h-6 text-slate-500" />
                      </div>
                      <p className="text-slate-500 font-medium">No upcoming bookings found.</p>
                      <Button asChild variant="link" className="text-violet-500 p-0 h-auto">
                        <Link to="/find">Find a Ride</Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {data.booked_rides.filter(b => (b.ride.status === 'active' || b.ride.status === 'full') && new Date(b.ride.start_time) > new Date()).map(booking => (
                        <RouteCard key={booking.id} ride={booking.ride} isSelected={selectedRide?.id === booking.ride.id} onSelect={() => setSelectedRide(booking.ride)} alreadyBooked={true} onCancel={setCancelConfirmRide} showBook={false} onChat={setChatRide} />
                      ))}
                    </div>
                  )}
                </section>
              </div>
            </TabsContent>

            <TabsContent value="history" className="outline-none">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-slate-800 rounded-lg">
                    <History className="w-5 h-5 text-slate-400" />
                  </div>
                  <h2 className="text-xl font-black text-white">Journey History</h2>
                </div>
                
                {(() => {
                  const completed = [
                    ...data.posted_expired.map(r => ({ ...r, role: 'driver', poster: profile })),
                    ...data.booked_rides.filter(b => b.ride.status === 'expired' || new Date(b.ride.start_time) <= new Date()).map(b => ({ ...b.ride, role: 'passenger', is_reviewed: b.is_reviewed, booking_id: b.id }))
                  ].sort((a, b) => new Date(b.start_time) - new Date(a.start_time));
                  
                  if (completed.length === 0) return (
                    <div className="p-20 text-center bg-slate-900/20 border border-slate-800 rounded-3xl">
                      <Info className="w-12 h-12 text-slate-800 mx-auto mb-4" />
                      <p className="text-slate-500 font-medium italic">No past journeys on record.</p>
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
                            <Badge className={`${ride.role === 'driver' ? 'bg-violet-600/20 text-violet-400 border-violet-600/30' : 'bg-indigo-600/20 text-indigo-400 border-indigo-600/30'} backdrop-blur-md`}>
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
            className="w-full md:w-[55%] border-l border-slate-800 bg-slate-900 flex flex-col z-30 shadow-2xl"
          >
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/80 backdrop-blur-md">
              <div>
                <h3 className="font-black text-lg text-white">Ride Details</h3>
                <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Trip Overview & Map</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelectedRide(null)} className="h-10 w-10 bg-slate-800/50 rounded-full text-slate-400 hover:text-white">✕</Button>
            </div>
            
            <div className="flex-1 relative overflow-hidden">
              <MapContainer center={[24.8607, 67.0011]} zoom={11} className="h-full w-full grayscale-[0.2]">
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <MapUpdater selectedRide={selectedRide} />
                <Marker position={[selectedRide.origin_lat, selectedRide.origin_lng]} icon={blueIcon} />
                <Marker position={[selectedRide.destination_lat, selectedRide.destination_lng]} icon={blueIcon} />
                {polylineCoords.length > 0 && <Polyline positions={polylineCoords} color="#3b82f6" weight={6} opacity={0.8} lineCap="round" />}
              </MapContainer>

            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* CHAT DIALOG */}
      <Dialog open={!!chatRide} onOpenChange={() => setChatRide(null)}>
        <DialogContent className="max-w-lg p-0 bg-slate-900 border-slate-800 h-[600px] flex flex-col rounded-3xl overflow-hidden shadow-2xl">
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
        <DialogContent className="bg-slate-900 border-slate-800 text-white rounded-3xl p-8">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-red-500 text-2xl font-black">
              <XCircle className="w-8 h-8" />
              Cancel Booking?
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-lg pt-4 leading-relaxed">
              Are you sure you want to cancel your booking for the trip to <strong className="text-white">{cancelConfirmRide?.destination_address?.split(',')[0]}</strong>?
            </DialogDescription>
          </DialogHeader>
          <div className="bg-red-500/5 border border-red-500/10 p-4 rounded-xl mt-6">
            <p className="text-xs text-red-400 font-bold flex items-center gap-2 tracking-wide uppercase">
              <Info className="w-4 h-4" /> This will notify the driver immediately.
            </p>
          </div>
          <DialogFooter className="mt-8 gap-3 sm:flex-row flex-col">
            <Button variant="outline" onClick={() => setCancelConfirmRide(null)} className="flex-1 border-slate-800 bg-slate-800/50 hover:bg-slate-800 h-12 font-bold rounded-xl">Keep My Seat</Button>
            <Button variant="destructive" onClick={confirmCancelBooking} className="flex-1 h-12 font-black rounded-xl shadow-lg shadow-red-500/20">Yes, Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* REVIEW DIALOG */}
      <Dialog open={!!reviewModal} onOpenChange={() => setReviewModal(null)}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white text-center rounded-3xl p-8 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-3xl font-black tracking-tight">How was your trip?</DialogTitle>
            <DialogDescription className="text-slate-400 pt-2 text-base">Your feedback helps keep the RideBoard community safe and reliable for everyone.</DialogDescription>
          </DialogHeader>
          <div className="py-8 flex flex-col items-center gap-8">
            <div className="flex gap-3">
              {[1, 2, 3, 4, 5].map(num => (
                <button 
                  key={num} 
                  onClick={() => setReviewRating(num)} 
                  className={`transition-all duration-300 transform hover:scale-125 ${num <= reviewRating ? 'text-amber-500' : 'text-slate-800'}`}
                >
                  <Star className={`w-12 h-12 ${num <= reviewRating ? 'fill-amber-500' : ''}`} />
                </button>
              ))}
            </div>
            <div className="w-full space-y-3 text-left">
              <Label className="text-slate-500 font-bold uppercase text-[10px] tracking-widest ml-1">Share your experience (Optional)</Label>
              <textarea 
                className="w-full bg-slate-950 border-2 border-slate-800 rounded-2xl p-4 text-sm focus:border-violet-600 outline-none transition-all resize-none min-h-[120px]" 
                placeholder="Was the driver punctual? How was the vehicle?" 
                value={reviewComment}
                onChange={e => setReviewComment(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="gap-3 sm:flex-row flex-col">
            <Button variant="ghost" onClick={() => setReviewModal(null)} className="flex-1 text-slate-500 hover:text-white h-12">Skip</Button>
            <Button onClick={handleSubmitReview} disabled={submittingReview} className="flex-1 bg-violet-600 hover:bg-violet-500 font-black h-12 rounded-xl shadow-lg shadow-violet-500/20">
              {submittingReview ? 'Submitting...' : 'Submit Review'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

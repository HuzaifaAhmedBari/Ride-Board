import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import RouteCard from '../components/RouteCard';
import ChatWindow from '../components/ChatWindow';
import { useAuthStore } from '../store/authStore';
import { User, Calendar, Star, CheckCircle2, MessageSquare, Phone, Mail, Award, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function DriverProfilePage() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [chatRide, setChatRide] = useState(null);

  useEffect(() => {
    async function loadDriver() {
      try {
        const res = await api.get(`/users/${id}`);
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Driver not found');
      } finally {
        setLoading(false);
      }
    }
    loadDriver();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 p-6 space-y-8">
        <div className="max-w-5xl mx-auto space-y-8">
          <Skeleton className="h-48 w-full rounded-2xl bg-slate-900" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-32 bg-slate-900" />
            <Skeleton className="h-32 bg-slate-900" />
            <Skeleton className="h-32 bg-slate-900" />
          </div>
          <Skeleton className="h-64 w-full bg-slate-900" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-center">
        <div className="space-y-4">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
            <User className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-white">{error}</h1>
          <Button asChild variant="outline" className="border-slate-800 text-slate-400">
            <Link to="/find">Back to Search</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const ratingInfo = data.profile.rating?.[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 pb-20">
      <div className="max-w-5xl mx-auto p-6 space-y-8">
        
        {/* HEADER SECTION */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 p-8 md:p-12"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/10 blur-[100px] -mr-32 -mt-32" />
          
          <div className="relative flex flex-col md:flex-row items-center md:items-start gap-8">
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-violet-600 to-indigo-700 p-1">
                <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden">
                  <User className="w-16 h-16 text-violet-500" />
                </div>
              </div>
            </div>

            <div className="flex-1 text-center md:text-left space-y-4">
              <div className="space-y-1">
                <h1 className="text-4xl font-black text-white tracking-tight">{data.profile.name}</h1>
                <p className="text-slate-500 flex items-center justify-center md:justify-start gap-2">
                  <Calendar className="w-4 h-4" />
                  Member since {new Date(data.profile.created_at).toLocaleDateString('en-PK', { month: 'long', year: 'numeric' })}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                {data.completed_rides >= 10 && (
                  <Badge variant="secondary" className="bg-amber-500/10 text-amber-500 border-amber-500/20 px-3 py-1">
                    Top Rated
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex flex-col items-center md:items-end gap-2">
               <div className="flex items-center gap-1.5 text-3xl font-black text-amber-500">
                 <Star className="w-8 h-8 fill-amber-500" />
                 {ratingInfo ? Number(ratingInfo.avg_rating).toFixed(1) : "N/A"}
               </div>
               <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">
                 {ratingInfo?.review_count || 0} Total Reviews
               </p>
            </div>
          </div>
        </motion.div>

        {/* STATS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 rounded-2xl">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-black text-white">{data.completed_rides}</p>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-tight">Rides Completed</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-violet-500/10 rounded-2xl">
                <Clock className="w-8 h-8 text-violet-500" />
              </div>
              <div>
                <p className="text-2xl font-black text-white">{data.active_rides.length}</p>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-tight">Currently Active</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-indigo-500/10 rounded-2xl">
                <Award className="w-8 h-8 text-indigo-500" />
              </div>
              <div>
                <p className="text-2xl font-black text-white">{data.profile.rating?.[0]?.review_count || 0}</p>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-tight">Reviews Received</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ACTIVE RIDES */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-8 w-1 bg-violet-600 rounded-full" />
              <h2 className="text-2xl font-black text-white tracking-tight">Current Offers</h2>
            </div>

            {data.active_rides.length === 0 ? (
              <div className="bg-slate-900/30 border border-slate-800 rounded-3xl p-12 text-center space-y-4">
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto opacity-50">
                  <Calendar className="w-8 h-8 text-slate-500" />
                </div>
                <p className="text-slate-400 font-medium">No active rides at the moment</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.active_rides.map(ride => (
                  <RouteCard 
                    key={ride.id} 
                    ride={{ ...ride, poster: data.profile }} 
                    showBook={false}
                    alreadyBooked={data.my_bookings?.some(b => b.ride_id === ride.id)}
                    onChat={setChatRide}
                    onSelect={() => {}} 
                  />
                ))}
              </div>
            )}
          </div>

          {/* REVIEWS */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-8 w-1 bg-amber-500 rounded-full" />
              <h2 className="text-2xl font-black text-white tracking-tight">Recent Reviews</h2>
            </div>

            <div className="space-y-4">
              {data.reviews.length === 0 ? (
                <div className="p-8 text-center text-slate-500 bg-slate-900/30 rounded-3xl border border-slate-800 italic">
                  No feedback yet
                </div>
              ) : (
                data.reviews.map(review => (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={review.id} 
                    className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-white text-sm">{review.reviewer.name}</p>
                        <div className="flex items-center gap-0.5 mt-1">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`w-3 h-3 ${i < review.rating ? 'text-amber-500 fill-amber-500' : 'text-slate-700'}`} 
                            />
                          ))}
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase">
                        {new Date(review.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                    <p className="text-sm text-slate-400 leading-relaxed italic">
                      "{review.comment || 'No comment left.'}"
                    </p>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CHAT MODAL */}
      <AnimatePresence>
        {chatRide && (
          <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
              onClick={() => setChatRide(null)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg h-[600px] bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="absolute top-4 right-4 z-10">
                <Button variant="ghost" size="icon" onClick={() => setChatRide(null)} className="h-10 w-10 bg-slate-800/50 rounded-full text-white hover:bg-slate-700">
                  ✕
                </Button>
              </div>
              <ChatWindow 
                rideId={chatRide.id} 
                rideTitle={`${chatRide.origin_address.split(',')[0]} to ${chatRide.destination_address.split(',')[0]}`} 
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, PlusCircle, TrendingUp, Users } from 'lucide-react';
import api from '../api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function HomePage() {
  const [stats, setStats] = useState({ activeRides: 0, totalSeats: 0 });

  useEffect(() => {
    async function loadStats() {
      try {
        const { data } = await api.get('/rides/stats');
        if (data) setStats(data);
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      }
    }
    loadStats();
  }, []);

  return (
    <div className="min-h-[calc(100vh-65px)] bg-slate-950 text-white overflow-hidden relative">
      {/* Background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-violet-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-6 py-20 flex flex-col items-center text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-6xl md:text-8xl font-extrabold tracking-tighter mb-6 bg-gradient-to-r from-violet-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
            RideBoard
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-xl md:text-2xl text-slate-400 max-w-2xl mb-12 leading-relaxed"
        >
          Scheduled carpooling, simplified. Find a ride or post an empty seat to share the cost of your commute.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-4 mb-20 w-full max-w-md"
        >
          <Link to="/find" className="flex-1">
            <Button className="w-full h-14 text-lg bg-violet-600 hover:bg-violet-500 shadow-lg shadow-violet-600/20">
              <Search className="w-5 h-5 mr-2" />
              Find a Ride
            </Button>
          </Link>
          <Link to="/post" className="flex-1">
            <Button variant="outline" className="w-full h-14 text-lg border-slate-700 hover:bg-slate-800">
              <PlusCircle className="w-5 h-5 mr-2" />
              Post a Ride
            </Button>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl"
        >
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center mb-4 text-violet-400">
                <TrendingUp className="w-8 h-8" />
              </div>
              <div className="text-4xl font-bold mb-1">{stats.activeRides}</div>
              <div className="text-slate-400 text-sm uppercase tracking-wider font-semibold">Active Rides</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center mb-4 text-indigo-400">
                <Users className="w-8 h-8" />
              </div>
              <div className="text-4xl font-bold mb-1">{stats.totalSeats}</div>
              <div className="text-slate-400 text-sm uppercase tracking-wider font-semibold">Available Seats</div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

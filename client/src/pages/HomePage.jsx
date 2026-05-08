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
    <div className="min-h-screen bg-[#121212] relative overflow-x-hidden">
      {/* Global Grid Background */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="global-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M40 0L0 0L0 40" fill="none" stroke="#1e1e1e" strokeWidth="0.8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#global-grid)" />
        </svg>
      </div>

      <div className="relative z-10 pt-4 pb-12">
        <div className="container mx-auto px-6">
        <div className="flex flex-col items-center text-center pt-12 pb-24 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="font-heading text-6xl md:text-8xl font-extrabold tracking-tighter mb-8 bg-gradient-to-r from-[#00D084] via-[#00D084]/80 to-[#2EC4B6] bg-clip-text text-transparent">
              RideBoard
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-xl md:text-2xl text-[#555555] max-w-2xl mb-12 leading-relaxed font-sans"
          >
            Scheduled carpooling, simplified. Find a ride or post an empty seat to share the cost of your commute.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 mb-20 w-full max-w-md"
          >
            <Link to="/find" className="flex-1">
              <Button className="w-full h-14 text-lg bg-[#00D084] text-[#051a0d] hover:bg-[#00D084]/90 shadow-lg shadow-[#00D084]/20 font-bold uppercase tracking-wide">
                Find a Ride
              </Button>
            </Link>
            <Link to="/post" className="flex-1">
              <Button variant="outline" className="w-full h-14 text-lg bg-[#1c1c1c] text-[#888888] border-[#2a2a2a] hover:bg-[#2a2a2a] hover:text-white font-bold uppercase tracking-wide">
                Post a Ride
              </Button>
            </Link>
          </motion.div>

          {/* Stats Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl mx-auto"
          >
            <Card className="bg-[#1e1e1e]/40 border-[#2a2a2a] backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center mb-4 text-[#00D084]">
                  <TrendingUp className="w-8 h-8" />
                </div>
                <div className="text-4xl font-bold mb-1 text-white">{stats.activeRides}</div>
                <div className="text-[#555555] text-sm uppercase tracking-wider font-semibold">Active Rides</div>
              </CardContent>
            </Card>

            <Card className="bg-[#1e1e1e]/40 border-[#2a2a2a] backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center mb-4 text-[#2EC4B6]">
                  <Users className="w-8 h-8" />
                </div>
                <div className="text-4xl font-bold mb-1 text-white">{stats.totalSeats}</div>
                <div className="text-[#555555] text-sm uppercase tracking-wider font-semibold">Available Seats</div>
              </CardContent>
            </Card>
          </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

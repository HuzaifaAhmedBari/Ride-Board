import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../api/supabase';
import api from '../api';
import { useAuthStore } from '../store/authStore';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Car, User, Mail, Lock, Phone, Loader2, Sparkles } from 'lucide-react';

export default function RegisterPage() {
  const navigate = useNavigate();
  const refreshProfile = useAuthStore(state => state.refreshProfile);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRegister(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    if (formData.name.trim().length < 3) {
      setError('Name must be at least 3 characters long');
      setLoading(false);
      return;
    }

    const cleanPhone = formData.phone.replace(/\D/g, '');
    if (cleanPhone.length !== 11) {
      setError('Please enter a valid 11-digit phone number');
      setLoading(false);
      return;
    }

    const { error: signUpError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    try {
      await api.post('/auth/profile', { name: formData.name, email: formData.email, phone: formData.phone });
      await refreshProfile();
      navigate('/find');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create profile');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-65px)] bg-background flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg relative z-10"
      >
        <Card className="bg-card border-border shadow-2xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-primary rounded-2xl shadow-xl shadow-primary/20">
                <Car className="w-8 h-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold text-white tracking-tight">Join RideBoard</CardTitle>
            <p className="text-muted-foreground text-sm mt-1">Start sharing rides and saving costs today</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="text"
                      required
                      className="pl-10 bg-muted border-border text-white"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Phone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="tel"
                      required
                      maxLength={11}
                      pattern="\d{11}"
                      className={`pl-10 bg-muted border-border text-white focus:ring-primary transition-colors ${formData.phone && formData.phone.replace(/\D/g, '').length !== 11 ? 'border-red-500/50 bg-red-500/5' : ''}`}
                      placeholder="03XXXXXXXXX"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="email"
                    required
                    className="pl-10 bg-muted border-border text-white"
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="password"
                    required
                    className="pl-10 bg-muted border-border text-white"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm font-medium">
                  {error}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full h-12 bg-primary hover:bg-primary/90 text-[#051a0d] font-bold transition-all shadow-lg shadow-primary/20 mt-2" 
                disabled={loading}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Create Account
                  </>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 border-t border-border pt-6">
            <p className="text-muted-foreground text-sm text-center w-full">
              Already have an account? {' '}
              <Link to="/login" className="text-primary font-semibold hover:text-primary/80 transition-colors">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}

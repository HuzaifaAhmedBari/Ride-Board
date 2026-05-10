-- 008_rls.sql: Row Level Security Policies

-- 1. ENABLE RLS ON ALL TABLES
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- 2. POLICIES FOR 'users'
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.users FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" 
ON public.users FOR UPDATE 
TO authenticated 
USING (auth.uid() = id);

-- 3. POLICIES FOR 'rides'
CREATE POLICY "Rides are viewable by everyone" 
ON public.rides FOR SELECT USING (true);

CREATE POLICY "Authenticated users can post rides" 
ON public.rides FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = poster_id);

CREATE POLICY "Users can update own rides" 
ON public.rides FOR UPDATE 
TO authenticated 
USING (auth.uid() = poster_id);

-- 4. POLICIES FOR 'bookings'
CREATE POLICY "Users can view own bookings" 
ON public.bookings FOR SELECT 
USING (
  auth.uid() = rider_id OR 
  EXISTS (
    SELECT 1 FROM public.rides 
    WHERE id = public.bookings.ride_id AND poster_id = auth.uid()
  )
);

CREATE POLICY "Users can book rides" 
ON public.bookings FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = rider_id);

CREATE POLICY "Users can cancel own bookings" 
ON public.bookings FOR UPDATE 
TO authenticated 
USING (auth.uid() = rider_id);

-- 5. POLICIES FOR 'messages'
CREATE POLICY "Ride participants can view messages" 
ON public.messages FOR SELECT 
USING (
  auth.uid() = sender_id OR 
  EXISTS (
    SELECT 1 FROM public.bookings 
    WHERE ride_id = public.messages.ride_id AND rider_id = auth.uid()
  ) OR 
  EXISTS (
    SELECT 1 FROM public.rides 
    WHERE id = public.messages.ride_id AND poster_id = auth.uid()
  )
);

CREATE POLICY "Ride participants can send messages" 
ON public.messages FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = sender_id);

-- 6. POLICIES FOR 'reviews'
CREATE POLICY "Reviews are viewable by everyone" 
ON public.reviews FOR SELECT USING (true);

CREATE POLICY "Participants can leave reviews" 
ON public.reviews FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = reviewer_id);

CREATE TABLE public.bookings (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ride_id     UUID NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
  rider_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status      TEXT NOT NULL DEFAULT 'confirmed'
              CHECK (status IN ('confirmed', 'cancelled')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (ride_id, rider_id)   
);

CREATE INDEX idx_bookings_rider ON public.bookings (rider_id);
CREATE INDEX idx_bookings_ride  ON public.bookings (ride_id);
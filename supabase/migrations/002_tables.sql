-- Public user profiles, linked to Supabase auth
CREATE TABLE public.users (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  phone         TEXT,
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Rides posted by any user
CREATE TABLE public.rides (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  poster_id             UUID NOT NULL REFERENCES public.users(id),
  origin_address        TEXT NOT NULL,
  origin_lat            DOUBLE PRECISION NOT NULL,
  origin_lng            DOUBLE PRECISION NOT NULL,
  destination_address   TEXT NOT NULL,
  destination_lat       DOUBLE PRECISION NOT NULL,
  destination_lng       DOUBLE PRECISION NOT NULL,
  start_time            TIMESTAMPTZ NOT NULL,
  total_seats           INTEGER NOT NULL CHECK (total_seats BETWEEN 1 AND 8),
  seats_remaining       INTEGER NOT NULL,
  fare_per_seat         NUMERIC(10,2) NOT NULL CHECK (fare_per_seat >= 0),
  route_polyline        JSONB,       -- GeoJSON LineString from OSRM, may be null
  status                TEXT NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active', 'expired', 'full')),
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rides_status     ON public.rides (status);
CREATE INDEX idx_rides_start_time ON public.rides (start_time);
CREATE INDEX idx_rides_poster     ON public.rides (poster_id);

-- Bookings: any user may book any ride they did not post
CREATE TABLE public.bookings (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ride_id     UUID NOT NULL REFERENCES public.rides(id),
  rider_id    UUID NOT NULL REFERENCES public.users(id),
  status      TEXT NOT NULL DEFAULT 'confirmed'
              CHECK (status IN ('confirmed', 'cancelled')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (ride_id, rider_id)      -- one booking per user per ride
);

CREATE INDEX idx_bookings_rider ON public.bookings (rider_id);
CREATE INDEX idx_bookings_ride  ON public.bookings (ride_id);

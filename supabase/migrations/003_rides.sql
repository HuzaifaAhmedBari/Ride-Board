CREATE TABLE public.rides (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  poster_id             UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  origin_address        TEXT NOT NULL,
  origin_lat            DOUBLE PRECISION NOT NULL,
  origin_lng            DOUBLE PRECISION NOT NULL,
  destination_address   TEXT NOT NULL,
  destination_lat       DOUBLE PRECISION NOT NULL,
  destination_lng       DOUBLE PRECISION NOT NULL,
  start_time            TIMESTAMPTZ NOT NULL,
  total_seats           INTEGER NOT NULL CHECK (total_seats >= 1 AND total_seats <= 8),
  seats_remaining       INTEGER NOT NULL,
  fare_per_seat         NUMERIC NOT NULL CHECK (fare_per_seat >= 0),
  route_polyline        JSONB,
  status                TEXT NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active', 'expired', 'full', 'cancelled')),
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rides_status     ON public.rides (status);
CREATE INDEX idx_rides_start_time ON public.rides (start_time);
CREATE INDEX idx_rides_poster     ON public.rides (poster_id);
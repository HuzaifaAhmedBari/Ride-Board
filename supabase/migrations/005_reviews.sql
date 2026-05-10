CREATE TABLE public.reviews (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ride_id       UUID NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
  reviewer_id   UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reviewee_id   UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rating        INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment       TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE (ride_id, reviewer_id)
);

CREATE INDEX idx_reviews_reviewee ON public.reviews (reviewee_id);
CREATE INDEX idx_reviews_ride     ON public.reviews (ride_id);

CREATE VIEW public.user_ratings AS
SELECT 
  reviewee_id,
  AVG(rating) as avg_rating,
  COUNT(id) as review_count
FROM public.reviews
GROUP BY reviewee_id;


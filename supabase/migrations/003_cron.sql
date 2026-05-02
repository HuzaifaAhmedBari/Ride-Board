-- Expire rides every minute once start_time has passed
SELECT cron.schedule(
  'expire-rides',
  '* * * * *',
  $$
    UPDATE public.rides
    SET status = 'expired'
    WHERE status = 'active'
      AND start_time < NOW();
  $$
);

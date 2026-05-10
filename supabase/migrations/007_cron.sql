SELECT cron.schedule(
  'expire-rides',
  '* * * * *',
  $$
    UPDATE public.rides
    SET status = 'expired'
    WHERE status IN ('active', 'full')
      AND start_time < NOW();
  $$
);

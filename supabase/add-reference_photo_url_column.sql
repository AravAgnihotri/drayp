-- If Body Lab upload says reference_photo_url is missing, run this alone in
-- Supabase → SQL Editor → Run (safe to run more than once).

ALTER TABLE public.body_measurements
  ADD COLUMN IF NOT EXISTS reference_photo_url TEXT;

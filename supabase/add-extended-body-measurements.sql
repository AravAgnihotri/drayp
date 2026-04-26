-- Extra Body Lab columns (neck, limbs, weight, shoe). Safe to run repeatedly.
-- Supabase → SQL Editor → Run.

ALTER TABLE public.body_measurements ADD COLUMN IF NOT EXISTS neck_in NUMERIC(5,1);
ALTER TABLE public.body_measurements ADD COLUMN IF NOT EXISTS sleeve_in NUMERIC(5,1);
ALTER TABLE public.body_measurements ADD COLUMN IF NOT EXISTS bicep_in NUMERIC(5,1);
ALTER TABLE public.body_measurements ADD COLUMN IF NOT EXISTS thigh_in NUMERIC(5,1);
ALTER TABLE public.body_measurements ADD COLUMN IF NOT EXISTS calf_in NUMERIC(5,1);
ALTER TABLE public.body_measurements ADD COLUMN IF NOT EXISTS weight_lbs NUMERIC(6,1);
ALTER TABLE public.body_measurements ADD COLUMN IF NOT EXISTS shoe_size_us NUMERIC(4,1);

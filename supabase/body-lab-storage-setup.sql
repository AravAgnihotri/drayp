-- Body Lab reference photos: run once in Supabase → SQL Editor → Run
-- (Or add SUPABASE_SERVICE_ROLE_KEY to .env.local so the app can create the bucket automatically.)

CREATE TABLE IF NOT EXISTS public.body_measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  chest_in NUMERIC(5,1),
  waist_in NUMERIC(5,1),
  hips_in NUMERIC(5,1),
  inseam_in NUMERIC(5,1),
  shoulders_in NUMERIC(5,1),
  neck_in NUMERIC(5,1),
  sleeve_in NUMERIC(5,1),
  bicep_in NUMERIC(5,1),
  thigh_in NUMERIC(5,1),
  calf_in NUMERIC(5,1),
  weight_lbs NUMERIC(6,1),
  shoe_size_us NUMERIC(4,1),
  height_text TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.body_measurements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_own_measurements" ON public.body_measurements;
CREATE POLICY "users_own_measurements" ON public.body_measurements
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.body_measurements
  ADD COLUMN IF NOT EXISTS reference_photo_url TEXT;
ALTER TABLE public.body_measurements ADD COLUMN IF NOT EXISTS neck_in NUMERIC(5,1);
ALTER TABLE public.body_measurements ADD COLUMN IF NOT EXISTS sleeve_in NUMERIC(5,1);
ALTER TABLE public.body_measurements ADD COLUMN IF NOT EXISTS bicep_in NUMERIC(5,1);
ALTER TABLE public.body_measurements ADD COLUMN IF NOT EXISTS thigh_in NUMERIC(5,1);
ALTER TABLE public.body_measurements ADD COLUMN IF NOT EXISTS calf_in NUMERIC(5,1);
ALTER TABLE public.body_measurements ADD COLUMN IF NOT EXISTS weight_lbs NUMERIC(6,1);
ALTER TABLE public.body_measurements ADD COLUMN IF NOT EXISTS shoe_size_us NUMERIC(4,1);

INSERT INTO storage.buckets (id, name, public)
VALUES ('body-reference-photos', 'body-reference-photos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "body_photos_insert_own" ON storage.objects;
DROP POLICY IF EXISTS "body_photos_update_own" ON storage.objects;
DROP POLICY IF EXISTS "body_photos_delete_own" ON storage.objects;

CREATE POLICY "body_photos_insert_own"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'body-reference-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "body_photos_update_own"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'body-reference-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "body_photos_delete_own"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'body-reference-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

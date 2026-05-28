-- Run this in your Supabase project → SQL Editor

-- ── Orders ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  order_number TEXT        NOT NULL,
  item_name    TEXT        NOT NULL,
  ordered_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status       TEXT        NOT NULL DEFAULT 'pending'
                           CHECK (status IN ('pending', 'in-transit', 'delivered', 'returned')),
  fit_score    INTEGER     CHECK (fit_score BETWEEN 0 AND 100),
  category     TEXT        CHECK (category IN ('tops', 'bottoms', 'outerwear', 'footwear', 'accessories'))
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_orders" ON orders
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── Saved Items ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS saved_items (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  item_name    TEXT        NOT NULL,
  brand        TEXT,
  fit_score    INTEGER     CHECK (fit_score BETWEEN 0 AND 100),
  is_new_match BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE saved_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_saved_items" ON saved_items
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── Body Measurements ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS body_measurements (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  chest_in     NUMERIC(5,1),
  waist_in     NUMERIC(5,1),
  hips_in      NUMERIC(5,1),
  inseam_in    NUMERIC(5,1),
  shoulders_in NUMERIC(5,1),
  neck_in      NUMERIC(5,1),
  sleeve_in    NUMERIC(5,1),
  bicep_in     NUMERIC(5,1),
  thigh_in     NUMERIC(5,1),
  calf_in      NUMERIC(5,1),
  weight_lbs   NUMERIC(6,1),
  shoe_size_us NUMERIC(4,1),
  height_text  TEXT,
  reference_photo_url TEXT,
  meshy_task_id TEXT,
  avatar_model_glb_url TEXT,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE body_measurements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_measurements" ON body_measurements
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.body_measurements ADD COLUMN IF NOT EXISTS reference_photo_url TEXT;
ALTER TABLE public.body_measurements ADD COLUMN IF NOT EXISTS meshy_task_id TEXT;
ALTER TABLE public.body_measurements ADD COLUMN IF NOT EXISTS avatar_model_glb_url TEXT;
ALTER TABLE public.body_measurements ADD COLUMN IF NOT EXISTS neck_in NUMERIC(5,1);
ALTER TABLE public.body_measurements ADD COLUMN IF NOT EXISTS sleeve_in NUMERIC(5,1);
ALTER TABLE public.body_measurements ADD COLUMN IF NOT EXISTS bicep_in NUMERIC(5,1);
ALTER TABLE public.body_measurements ADD COLUMN IF NOT EXISTS thigh_in NUMERIC(5,1);
ALTER TABLE public.body_measurements ADD COLUMN IF NOT EXISTS calf_in NUMERIC(5,1);
ALTER TABLE public.body_measurements ADD COLUMN IF NOT EXISTS weight_lbs NUMERIC(6,1);
ALTER TABLE public.body_measurements ADD COLUMN IF NOT EXISTS shoe_size_us NUMERIC(4,1);

-- ── Storage: reference photos for Body Lab (run once per project) ────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('body-reference-photos', 'body-reference-photos', true)
ON CONFLICT (id) DO NOTHING;

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

CREATE POLICY "body_photos_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'body-reference-photos');

-- ── Profiles (if not already created) ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id        UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  plan      TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_profile" ON profiles
  FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

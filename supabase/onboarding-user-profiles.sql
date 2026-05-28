-- Run this in your Supabase project → SQL Editor
-- Creates user_profiles table for onboarding data and profile-photos storage bucket

CREATE TABLE IF NOT EXISTS user_profiles (
  id                      uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 uuid        NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name               text,
  photo_url               text,
  model_task_id           text,
  model_status            text        DEFAULT 'idle',
  model_started_at        timestamptz,
  model_output_url        text,
  height_cm               integer,
  weight_kg               integer,
  chest_cm                integer,
  waist_cm                integer,
  hips_cm                 integer,
  inseam_cm               integer,
  gender                  text,
  favorite_brands         text[],
  favorite_colors         text[],
  style_tags              text[],
  size_top                text,
  size_bottom             text,
  shoe_size               text,
  budget_range            text,
  onboarding_completed_at timestamptz DEFAULT now(),
  created_at              timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_profiles"
  ON user_profiles FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── Storage: profile photos for onboarding ────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-photos', 'profile-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "profile_photos_insert_own"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'profile-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "profile_photos_update_own"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'profile-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "profile_photos_delete_own"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'profile-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "profile_photos_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-photos');

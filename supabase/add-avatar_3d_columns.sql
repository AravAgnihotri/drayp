-- Body Lab: persist Meshy 3D avatar generation (run once in Supabase SQL Editor)
ALTER TABLE public.body_measurements
  ADD COLUMN IF NOT EXISTS meshy_task_id TEXT,
  ADD COLUMN IF NOT EXISTS avatar_model_glb_url TEXT;

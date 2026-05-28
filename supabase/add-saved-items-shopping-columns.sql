-- Migration: extend saved_items table for full shopping product data
-- Run in Supabase → SQL Editor

-- Add new columns to store full product details from Serper shopping results
ALTER TABLE public.saved_items
  ADD COLUMN IF NOT EXISTS product_id  TEXT,
  ADD COLUMN IF NOT EXISTS title        TEXT,
  ADD COLUMN IF NOT EXISTS price        NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS price_formatted TEXT,
  ADD COLUMN IF NOT EXISTS source       TEXT,
  ADD COLUMN IF NOT EXISTS link         TEXT,
  ADD COLUMN IF NOT EXISTS image_url    TEXT,
  ADD COLUMN IF NOT EXISTS rating       NUMERIC(3, 1),
  ADD COLUMN IF NOT EXISTS saved_at     TIMESTAMPTZ DEFAULT NOW();

-- Unique constraint: one save per user per product
ALTER TABLE public.saved_items
  DROP CONSTRAINT IF EXISTS saved_items_user_id_product_id_key;

-- Only add the unique constraint when product_id is not null (partial index)
CREATE UNIQUE INDEX IF NOT EXISTS saved_items_user_product_unique
  ON public.saved_items (user_id, product_id)
  WHERE product_id IS NOT NULL;

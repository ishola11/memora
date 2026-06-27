-- Phase 2: add plain_text for cross-device content restore + enable Realtime

ALTER TABLE public.items ADD COLUMN IF NOT EXISTS plain_text TEXT;

-- Run once in Supabase SQL editor after creating tables:
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.items;

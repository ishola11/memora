-- Memora cloud schema (Supabase / PostgreSQL)
-- Run in Supabase SQL editor when enabling cloud sync

CREATE TABLE IF NOT EXISTS public.devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('macos', 'windows')),
  device_key_pub BYTEA,
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.items (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL DEFAULT 'history' CHECK (kind IN ('history', 'snippet')),
  content_type TEXT NOT NULL,
  display_title TEXT,
  preview_text TEXT,
  char_count INT,
  url TEXT,
  url_title TEXT,
  url_domain TEXT,
  code_language TEXT,
  line_count INT,
  blob_path TEXT,
  blob_size BIGINT,
  content_hash TEXT NOT NULL,
  plain_text TEXT,
  trigger TEXT,
  source_device_id UUID REFERENCES public.devices(id),
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  is_favorited BOOLEAN NOT NULL DEFAULT false,
  encrypted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_items_user_created ON public.items(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_items_user_pinned ON public.items(user_id) WHERE is_pinned;

CREATE TABLE IF NOT EXISTS public.collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6366f1',
  icon TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.item_collections (
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  PRIMARY KEY (item_id, collection_id)
);

CREATE TABLE IF NOT EXISTS public.sync_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id UUID NOT NULL REFERENCES public.devices(id),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  op TEXT NOT NULL,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY devices_own ON public.devices FOR ALL USING (auth.uid() = user_id);
CREATE POLICY items_own ON public.items FOR ALL USING (auth.uid() = user_id);
CREATE POLICY collections_own ON public.collections FOR ALL USING (auth.uid() = user_id);
CREATE POLICY item_collections_own ON public.item_collections FOR ALL
  USING (EXISTS (SELECT 1 FROM public.items i WHERE i.id = item_id AND i.user_id = auth.uid()));
CREATE POLICY sync_events_own ON public.sync_events FOR ALL USING (auth.uid() = user_id);

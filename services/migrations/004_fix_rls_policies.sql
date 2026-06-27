-- Fix RLS policies so INSERT/UPSERT works for authenticated clients.
-- Run once in Supabase → SQL Editor (safe to re-run).

-- Default user_id from JWT so clients don't have to send it.
ALTER TABLE public.devices ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.items ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.collections ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.sync_events ALTER COLUMN user_id SET DEFAULT auth.uid();

-- Ensure authenticated role can access tables (Supabase usually grants this; explicit is safe).
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.devices TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.collections TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.item_collections TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sync_events TO authenticated;

-- devices
DROP POLICY IF EXISTS devices_own ON public.devices;
DROP POLICY IF EXISTS devices_select_own ON public.devices;
DROP POLICY IF EXISTS devices_insert_own ON public.devices;
DROP POLICY IF EXISTS devices_update_own ON public.devices;
DROP POLICY IF EXISTS devices_delete_own ON public.devices;

CREATE POLICY devices_select_own ON public.devices
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY devices_insert_own ON public.devices
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY devices_update_own ON public.devices
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY devices_delete_own ON public.devices
  FOR DELETE USING (auth.uid() = user_id);

-- items
DROP POLICY IF EXISTS items_own ON public.items;
DROP POLICY IF EXISTS items_select_own ON public.items;
DROP POLICY IF EXISTS items_insert_own ON public.items;
DROP POLICY IF EXISTS items_update_own ON public.items;
DROP POLICY IF EXISTS items_delete_own ON public.items;

CREATE POLICY items_select_own ON public.items
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY items_insert_own ON public.items
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY items_update_own ON public.items
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY items_delete_own ON public.items
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- collections
DROP POLICY IF EXISTS collections_own ON public.collections;
DROP POLICY IF EXISTS collections_select_own ON public.collections;
DROP POLICY IF EXISTS collections_insert_own ON public.collections;
DROP POLICY IF EXISTS collections_update_own ON public.collections;
DROP POLICY IF EXISTS collections_delete_own ON public.collections;

CREATE POLICY collections_select_own ON public.collections
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY collections_insert_own ON public.collections
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY collections_update_own ON public.collections
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY collections_delete_own ON public.collections
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- item_collections (join table — must own both item and collection)
DROP POLICY IF EXISTS item_collections_own ON public.item_collections;
DROP POLICY IF EXISTS item_collections_select_own ON public.item_collections;
DROP POLICY IF EXISTS item_collections_insert_own ON public.item_collections;
DROP POLICY IF EXISTS item_collections_delete_own ON public.item_collections;

CREATE POLICY item_collections_select_own ON public.item_collections
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.items i WHERE i.id = item_id AND i.user_id = auth.uid())
  );

CREATE POLICY item_collections_insert_own ON public.item_collections
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.items i WHERE i.id = item_id AND i.user_id = auth.uid())
    AND EXISTS (SELECT 1 FROM public.collections c WHERE c.id = collection_id AND c.user_id = auth.uid())
  );

CREATE POLICY item_collections_delete_own ON public.item_collections
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.items i WHERE i.id = item_id AND i.user_id = auth.uid())
  );

-- sync_events
DROP POLICY IF EXISTS sync_events_own ON public.sync_events;
DROP POLICY IF EXISTS sync_events_select_own ON public.sync_events;
DROP POLICY IF EXISTS sync_events_insert_own ON public.sync_events;

CREATE POLICY sync_events_select_own ON public.sync_events
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY sync_events_insert_own ON public.sync_events
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

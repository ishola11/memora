-- Device registration via RPC (bypasses RLS edge cases during upsert).
-- Also clears conflicting test data. Run in Supabase SQL Editor.

-- ── 1. DIAGNOSTIC (run SELECT first to inspect) ─────────────────────────────
-- SELECT policyname, cmd, roles, qual, with_check
-- FROM pg_policies WHERE schemaname = 'public' AND tablename = 'devices';
--
-- SELECT d.id, d.user_id, d.name, d.platform, u.email
-- FROM public.devices d
-- LEFT JOIN auth.users u ON u.id = d.user_id;

-- ── 2. OPTIONAL: wipe test devices (uncomment if you had failed sign-in tests) ─
-- DELETE FROM public.sync_events;
-- DELETE FROM public.item_collections;
-- DELETE FROM public.items;
-- DELETE FROM public.collections;
-- DELETE FROM public.devices;

-- ── 3. RPC: register / refresh device (SECURITY DEFINER, validates auth.uid()) ─
CREATE OR REPLACE FUNCTION public.register_device(
  device_id uuid,
  device_name text,
  device_platform text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated — sign in again'
      USING ERRCODE = '42501';
  END IF;

  IF device_platform NOT IN ('macos', 'windows') THEN
    RAISE EXCEPTION 'Invalid platform: %', device_platform
      USING ERRCODE = '22023';
  END IF;

  -- Reject if this device id belongs to another account.
  IF EXISTS (
    SELECT 1 FROM public.devices d
    WHERE d.id = device_id AND d.user_id <> uid
  ) THEN
    RAISE EXCEPTION 'This device id is linked to another account. Reset local data or use a fresh install.'
      USING ERRCODE = '23505';
  END IF;

  INSERT INTO public.devices (id, user_id, name, platform, last_seen_at)
  VALUES (device_id, uid, device_name, device_platform, now())
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    platform = EXCLUDED.platform,
    last_seen_at = now();
END;
$$;

REVOKE ALL ON FUNCTION public.register_device(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.register_device(uuid, text, text) TO anon, authenticated;

-- ── 4. Re-apply device policies WITHOUT "TO authenticated" (applies to JWT callers) ─
DROP POLICY IF EXISTS devices_own ON public.devices;
DROP POLICY IF EXISTS devices_select_own ON public.devices;
DROP POLICY IF EXISTS devices_insert_own ON public.devices;
DROP POLICY IF EXISTS devices_update_own ON public.devices;
DROP POLICY IF EXISTS devices_delete_own ON public.devices;

ALTER TABLE public.devices ALTER COLUMN user_id SET DEFAULT auth.uid();

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

-- Run in Supabase SQL Editor if collections realtime is missing
-- (safe to run on projects that already ran SETUP_ALL.sql before this update)

ALTER PUBLICATION supabase_realtime ADD TABLE public.collections;
ALTER PUBLICATION supabase_realtime ADD TABLE public.item_collections;

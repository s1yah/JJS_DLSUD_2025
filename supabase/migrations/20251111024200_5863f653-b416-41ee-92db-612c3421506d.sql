-- Fix search path for get_user_id_text function
CREATE OR REPLACE FUNCTION public.get_user_id_text()
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid()::text
$$;
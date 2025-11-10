-- Fix function search path security warning by dropping trigger first
DROP TRIGGER IF EXISTS update_user_locations_timestamp ON public.user_locations;
DROP FUNCTION IF EXISTS public.update_user_locations_updated_at();

CREATE OR REPLACE FUNCTION public.update_user_locations_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_user_locations_timestamp
BEFORE UPDATE ON public.user_locations
FOR EACH ROW
EXECUTE FUNCTION public.update_user_locations_updated_at();
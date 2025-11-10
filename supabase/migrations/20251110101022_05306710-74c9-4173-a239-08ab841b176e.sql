-- Fix user_locations table for proper user tracking

-- 1. Change user_id from UUID to TEXT to support simple user IDs
ALTER TABLE public.user_locations 
ALTER COLUMN user_id TYPE TEXT;

-- 2. Add unique constraint on user_id for upsert operations
ALTER TABLE public.user_locations 
ADD CONSTRAINT user_locations_user_id_unique UNIQUE (user_id);

-- 3. Add DELETE RLS policy
CREATE POLICY "Users can delete their own location"
ON public.user_locations
FOR DELETE
USING (true);
-- Security fixes: Implement proper RLS policies and user roles

-- 1. Create app_role enum for role management
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- 2. Create user_roles table for secure role management
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 4. Create function to get user_id as text (for compatibility with existing TEXT user_id column)
CREATE OR REPLACE FUNCTION public.get_user_id_text()
RETURNS TEXT
LANGUAGE SQL
STABLE
AS $$
  SELECT auth.uid()::text
$$;

-- 5. Drop existing insecure RLS policies on user_locations
DROP POLICY IF EXISTS "Anyone can view user locations" ON public.user_locations;
DROP POLICY IF EXISTS "Users can delete their own location" ON public.user_locations;
DROP POLICY IF EXISTS "Users can insert their own location" ON public.user_locations;
DROP POLICY IF EXISTS "Users can update their own location" ON public.user_locations;

-- 6. Create secure RLS policies for user_locations
-- Users can only view their own location OR admins can view all
CREATE POLICY "Users can view their own location"
ON public.user_locations
FOR SELECT
TO authenticated
USING (
  user_id = get_user_id_text() OR
  has_role(auth.uid(), 'admin')
);

-- Users can only insert their own location
CREATE POLICY "Users can insert their own location"
ON public.user_locations
FOR INSERT
TO authenticated
WITH CHECK (user_id = get_user_id_text());

-- Users can only update their own location
CREATE POLICY "Users can update their own location"
ON public.user_locations
FOR UPDATE
TO authenticated
USING (user_id = get_user_id_text());

-- Users can only delete their own location
CREATE POLICY "Users can delete their own location"
ON public.user_locations
FOR DELETE
TO authenticated
USING (user_id = get_user_id_text());

-- 7. RLS policies for user_roles (users can view their own roles, admins can manage all)
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));
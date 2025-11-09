-- Create user_locations table for tracking passenger locations
CREATE TABLE public.user_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_locations ENABLE ROW LEVEL SECURITY;

-- Create policies: Users can insert/update their own location
CREATE POLICY "Users can insert their own location"
ON public.user_locations
FOR INSERT
WITH CHECK (true); -- Allow anyone to add location (no auth required for now)

CREATE POLICY "Users can update their own location"
ON public.user_locations
FOR UPDATE
USING (true); -- Allow anyone to update

-- Admins/drivers can view all user locations
CREATE POLICY "Anyone can view user locations"
ON public.user_locations
FOR SELECT
USING (true); -- Allow everyone to see locations

-- Create index for performance
CREATE INDEX idx_user_locations_user_id ON public.user_locations(user_id);
CREATE INDEX idx_user_locations_updated_at ON public.user_locations(updated_at);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_user_locations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_locations_timestamp
BEFORE UPDATE ON public.user_locations
FOR EACH ROW
EXECUTE FUNCTION public.update_user_locations_updated_at();

-- Enable realtime for user locations
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_locations;
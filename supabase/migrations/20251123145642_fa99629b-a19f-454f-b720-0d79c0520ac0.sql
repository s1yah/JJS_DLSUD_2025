-- Create bus_configurations table
CREATE TABLE public.bus_configurations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bus_name text NOT NULL UNIQUE,
  max_passengers integer NOT NULL CHECK (max_passengers > 0),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bus_configurations ENABLE ROW LEVEL SECURITY;

-- Create policies - only admins can manage bus configurations
CREATE POLICY "Admins can view all bus configurations"
ON public.bus_configurations
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert bus configurations"
ON public.bus_configurations
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update bus configurations"
ON public.bus_configurations
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete bus configurations"
ON public.bus_configurations
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_bus_configurations_updated_at
BEFORE UPDATE ON public.bus_configurations
FOR EACH ROW
EXECUTE FUNCTION public.update_user_locations_updated_at();
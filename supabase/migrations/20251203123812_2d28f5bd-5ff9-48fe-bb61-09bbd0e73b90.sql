-- Create app_settings table for storing global settings
CREATE TABLE public.app_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Admins can view all settings
CREATE POLICY "Admins can view all settings" 
ON public.app_settings 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can view settings (for checking if dashboard is enabled)
CREATE POLICY "Anyone can view settings" 
ON public.app_settings 
FOR SELECT 
USING (true);

-- Admins can insert settings
CREATE POLICY "Admins can insert settings" 
ON public.app_settings 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update settings
CREATE POLICY "Admins can update settings" 
ON public.app_settings 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete settings
CREATE POLICY "Admins can delete settings" 
ON public.app_settings 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default setting for user dashboard
INSERT INTO public.app_settings (key, value) VALUES ('user_dashboard_enabled', '"true"');

-- Also allow regular users to view bus_configurations for capacity checks
CREATE POLICY "Users can view bus configurations" 
ON public.bus_configurations 
FOR SELECT 
USING (true);
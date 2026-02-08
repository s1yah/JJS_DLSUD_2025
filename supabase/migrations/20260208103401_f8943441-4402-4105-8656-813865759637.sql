-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create table to track real-time passenger counts from Camlytics
CREATE TABLE public.passenger_counts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id TEXT NOT NULL UNIQUE,
  channel_name TEXT,
  current_count INTEGER NOT NULL DEFAULT 0,
  total_enters INTEGER NOT NULL DEFAULT 0,
  total_exits INTEGER NOT NULL DEFAULT 0,
  last_event_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.passenger_counts ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read passenger counts (needed for dashboard)
CREATE POLICY "Anyone can read passenger counts"
ON public.passenger_counts
FOR SELECT
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_passenger_counts_updated_at
BEFORE UPDATE ON public.passenger_counts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
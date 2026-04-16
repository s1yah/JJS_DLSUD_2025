
CREATE TABLE public.passenger_count_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bus_name TEXT NOT NULL,
  channel_id TEXT,
  current_count INTEGER NOT NULL DEFAULT 0,
  total_enters INTEGER NOT NULL DEFAULT 0,
  total_exits INTEGER NOT NULL DEFAULT 0,
  logged_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.passenger_count_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all logs"
ON public.passenger_count_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert logs"
ON public.passenger_count_logs
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete logs"
ON public.passenger_count_logs
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_passenger_count_logs_bus_name ON public.passenger_count_logs(bus_name);
CREATE INDEX idx_passenger_count_logs_logged_at ON public.passenger_count_logs(logged_at);

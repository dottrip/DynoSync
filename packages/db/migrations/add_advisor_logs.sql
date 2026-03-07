-- Clean install: Drop existing table to resolve type mismatches and policy conflicts
DROP TABLE IF EXISTS public.advisor_logs;

-- Create advisor_logs table with TEXT IDs to match existing schema
CREATE TABLE public.advisor_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
    vehicle_id TEXT NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
    whp INTEGER NOT NULL,
    torque INTEGER NOT NULL,
    torque_unit TEXT NOT NULL,
    advice TEXT NOT NULL,
    suggestion JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.advisor_logs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own advisor logs" 
ON public.advisor_logs FOR SELECT 
TO authenticated 
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own advisor logs" 
ON public.advisor_logs FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid()::text = user_id);

-- Index
CREATE INDEX IF NOT EXISTS advisor_logs_vehicle_id_idx ON public.advisor_logs(vehicle_id);

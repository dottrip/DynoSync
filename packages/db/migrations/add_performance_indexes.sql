-- Migration: Performance Indexes + Thumbnail Support
-- Date: 2026-03-06
-- Description: Add missing indexes for high-frequency queries and image_thumb_url column

-- 1. Add thumbnail URL to vehicles table
ALTER TABLE public.vehicles
ADD COLUMN IF NOT EXISTS image_thumb_url TEXT;

-- 2. Ensure ai_credit_logs table exists (may not have been created yet)
CREATE TABLE IF NOT EXISTS public.ai_credit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    feature TEXT NOT NULL,
    credits INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Performance indexes for advisor_logs
-- Used by: GET /ai/advisor/history/:vehicleId (filtered by user_id)
CREATE INDEX IF NOT EXISTS advisor_logs_user_id_idx
  ON public.advisor_logs(user_id);

-- 4. Indexes for ai_credit_logs
CREATE INDEX IF NOT EXISTS ai_credit_logs_user_id_idx
  ON public.ai_credit_logs(user_id);
CREATE INDEX IF NOT EXISTS ai_credit_logs_created_at_idx
  ON public.ai_credit_logs(created_at);
-- Composite index for monthly credit calculation
CREATE INDEX IF NOT EXISTS ai_credit_logs_user_created_idx
  ON public.ai_credit_logs(user_id, created_at);

-- 5. Verification
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN ('advisor_logs', 'ai_credit_logs', 'vehicles')
  AND schemaname = 'public'
ORDER BY tablename, indexname;

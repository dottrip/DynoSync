-- Migration: Sync Prisma Schema with Supabase
-- Date: 2026-03-05
-- Description: Add missing fields and tables to match Prisma schema

-- 1. Add advisor cache fields to vehicles table
ALTER TABLE public.vehicles
ADD COLUMN IF NOT EXISTS advisor_cache_key TEXT,
ADD COLUMN IF NOT EXISTS last_advisor_result JSONB;

-- 2. Create ai_credit_logs table (if not exists)
CREATE TABLE IF NOT EXISTS public.ai_credit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    feature TEXT NOT NULL,
    credits INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on ai_credit_logs
ALTER TABLE public.ai_credit_logs ENABLE ROW LEVEL SECURITY;

-- Policies for ai_credit_logs
CREATE POLICY "Users can view their own credit logs"
ON public.ai_credit_logs FOR SELECT
TO authenticated
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own credit logs"
ON public.ai_credit_logs FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = user_id);

-- Index for ai_credit_logs
CREATE INDEX IF NOT EXISTS ai_credit_logs_user_id_idx ON public.ai_credit_logs(user_id);
CREATE INDEX IF NOT EXISTS ai_credit_logs_created_at_idx ON public.ai_credit_logs(created_at);

-- 3. Verify all tables exist
DO $$
BEGIN
    -- Check advisor_logs
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'advisor_logs') THEN
        RAISE NOTICE 'WARNING: advisor_logs table does not exist. Run add_advisor_logs.sql first.';
    END IF;

    -- Check ai_credits fields on users
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'ai_credits_used') THEN
        RAISE NOTICE 'WARNING: ai_credits_used column does not exist on users table. Run add_ai_credits.sql first.';
    END IF;
END $$;

-- 4. Verification query
SELECT
    'vehicles' as table_name,
    COUNT(*) FILTER (WHERE advisor_cache_key IS NOT NULL) as with_cache,
    COUNT(*) FILTER (WHERE last_advisor_result IS NOT NULL) as with_result,
    COUNT(*) as total
FROM public.vehicles
UNION ALL
SELECT
    'ai_credit_logs' as table_name,
    COUNT(*) as with_cache,
    COUNT(DISTINCT user_id) as with_result,
    COUNT(*) as total
FROM public.ai_credit_logs;

-- Migration: Add AI Credits System
-- Date: 2026-03-03
-- Description: Replace ai_suggestions_this_month with credit-based system

-- 1. Add new credit fields
ALTER TABLE users
ADD COLUMN IF NOT EXISTS ai_credits_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ai_credits_reset_at TIMESTAMP DEFAULT NOW();

-- 2. Migrate existing data (if ai_suggestions_this_month exists)
-- Copy current usage to new field, preserve reset date
UPDATE users
SET
  ai_credits_used = COALESCE(ai_suggestions_this_month, 0),
  ai_credits_reset_at = COALESCE(last_suggestion_reset, created_at)
WHERE ai_suggestions_this_month IS NOT NULL OR last_suggestion_reset IS NOT NULL;

-- 3. Drop old columns (optional - uncomment after verifying migration)
-- ALTER TABLE users DROP COLUMN IF EXISTS ai_suggestions_this_month;
-- ALTER TABLE users DROP COLUMN IF EXISTS last_suggestion_reset;

-- 4. Update tier enum to remove 'elite' (if using enum type)
-- Note: If tier is just a TEXT field, no action needed
-- If you have a tier enum, you'll need to:
-- ALTER TYPE tier_type RENAME TO tier_type_old;
-- CREATE TYPE tier_type AS ENUM ('free', 'pro');
-- ALTER TABLE users ALTER COLUMN tier TYPE tier_type USING tier::text::tier_type;
-- DROP TYPE tier_type_old;

-- 5. Verify migration
SELECT
  tier,
  COUNT(*) as user_count,
  AVG(ai_credits_used) as avg_credits_used
FROM users
GROUP BY tier;

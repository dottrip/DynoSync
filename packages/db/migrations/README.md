# Database Migrations

This directory contains SQL migration files for Supabase.

## How to Run Migrations

1. Go to your Supabase project dashboard: https://supabase.com/dashboard/project/YOUR_PROJECT_ID
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the contents of the migration file
5. Click **Run** to execute

## Migration Order

Run migrations in this order:

1. `add_ai_credits.sql` — Adds AI credit system to users table
2. `add_advisor_logs.sql` — Creates advisor_logs table for AI analysis history
3. `sync_prisma_schema.sql` — Syncs remaining fields (advisor_cache_key, last_advisor_result, ai_credit_logs table)

## Verification

After running all migrations, verify with this query:

```sql
-- Check if all tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('users', 'vehicles', 'dyno_records', 'mod_logs', 'advisor_logs', 'ai_credit_logs', 'build_follows', 'feedback')
ORDER BY table_name;

-- Check if advisor fields exist on vehicles
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'vehicles'
  AND column_name IN ('advisor_cache_key', 'last_advisor_result');

-- Check if AI credit fields exist on users
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users'
  AND column_name IN ('ai_credits_used', 'ai_credits_reset_at');
```

Expected output: All tables and columns should be present.

## Troubleshooting

### "relation does not exist" error
- The table hasn't been created yet. Run the corresponding migration file.

### "column does not exist" error
- The column hasn't been added yet. Run `sync_prisma_schema.sql`.

### RLS policy errors
- Service role key should bypass RLS. Check that your API is using `SUPABASE_SERVICE_ROLE_KEY` (not `SUPABASE_ANON_KEY`).

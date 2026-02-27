# Supabase Setup Guide

This guide walks you through setting up the Supabase database for DynoSync.

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Fill in:
   - **Name**: `dynosync` (or your preferred name)
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free tier is fine for development
4. Click "Create new project" and wait ~2 minutes for provisioning

## 2. Get Database Connection String

1. In your Supabase project dashboard, go to **Settings** → **Database**
2. Scroll to **Connection string** section
3. Select **URI** tab
4. Copy the connection string (format: `postgresql://postgres:[YOUR-PASSWORD]@[HOST]:[PORT]/postgres`)
5. Replace `[YOUR-PASSWORD]` with the password you set in step 1

## 3. Configure Environment Variables

### API Package (`packages/api/.env`)

```bash
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@[HOST]:[PORT]/postgres"
SUPABASE_URL="https://[PROJECT-REF].supabase.co"
SUPABASE_ANON_KEY="[YOUR-ANON-KEY]"
SUPABASE_SERVICE_ROLE_KEY="[YOUR-SERVICE-ROLE-KEY]"
```

**Get Supabase keys:**
- Go to **Settings** → **API**
- Copy `URL` → use as `SUPABASE_URL`
- Copy `anon public` key → use as `SUPABASE_ANON_KEY`
- Copy `service_role` key → use as `SUPABASE_SERVICE_ROLE_KEY`

### Web Package (`apps/web/.env.local`)

```bash
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[YOUR-ANON-KEY]"
```

### Mobile Package (`apps/mobile/.env`)

```bash
EXPO_PUBLIC_SUPABASE_URL="https://[PROJECT-REF].supabase.co"
EXPO_PUBLIC_SUPABASE_ANON_KEY="[YOUR-ANON-KEY]"
EXPO_PUBLIC_API_URL="http://localhost:8787"  # Change to production URL when deployed
```

## 4. Run Database Migrations

```bash
# From project root
cd packages/db

# Generate Prisma Client (if not already done)
pnpm prisma generate

# Push schema to Supabase
pnpm prisma db push
```

This will create all tables (`User`, `Vehicle`, `DynoRecord`, `ModLog`) with proper indexes and constraints.

## 5. Verify Setup

### Check Tables in Supabase

1. Go to **Table Editor** in Supabase dashboard
2. You should see 4 tables:
   - `User`
   - `Vehicle`
   - `DynoRecord`
   - `ModLog`

### Test API Connection

```bash
# Start API dev server
cd packages/api
pnpm dev

# In another terminal, test health endpoint
curl http://localhost:8787/health
```

### Test Mobile App

```bash
# Start mobile dev server
cd apps/mobile
pnpm start

# Press 'i' for iOS simulator or 'a' for Android emulator
# Try signing up with a test account
```

## 6. Enable Row Level Security (RLS) - Optional but Recommended

For production, enable RLS policies in Supabase:

1. Go to **Authentication** → **Policies**
2. For each table, add policies:
   - **SELECT**: `auth.uid() = user_id`
   - **INSERT**: `auth.uid() = user_id`
   - **UPDATE**: `auth.uid() = user_id`
   - **DELETE**: `auth.uid() = user_id`

**Note**: The API uses `service_role_key` which bypasses RLS, so this is mainly for direct database access security.

## Troubleshooting

### "Connection refused" error
- Check that `DATABASE_URL` is correct
- Ensure Supabase project is active (not paused)
- Verify your IP is not blocked by Supabase firewall

### "Relation does not exist" error
- Run `pnpm prisma db push` again
- Check that migrations completed successfully

### Auth not working
- Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` are correct
- Check that Supabase Auth is enabled (Settings → Authentication)
- For Google OAuth, configure provider in Supabase dashboard

## Next Steps

After setup is complete:
- Test all CRUD operations (vehicles, dyno records, mod logs)
- Verify tier limits are enforced
- Test authentication flows (signup, login, OAuth)
- Deploy API to Cloudflare Workers (see deployment guide)

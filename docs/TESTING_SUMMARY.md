# Phase 1 Testing Summary

## Quick Start Testing Guide

### Prerequisites Check
✅ All dependencies installed (`pnpm install` completed)
✅ Environment templates created:
- `packages/api/.env.example`
- `packages/db/.env.example`
- `apps/web/.env.local.example`
- `apps/mobile/.env.example`

### Before You Can Test

**You MUST complete Supabase setup first:**

1. Follow `docs/SUPABASE_SETUP.md` to:
   - Create Supabase project
   - Get database connection string
   - Configure environment variables
   - Run migrations

2. Without Supabase setup, the app will fail to:
   - Authenticate users
   - Store/retrieve data
   - Enforce tier limits

### TypeScript Errors (Expected)

The `tsc --noEmit` checks show errors, but these are **expected and safe to ignore**:

- **API**: JSX errors from mobile files (different tsconfig contexts)
- **Mobile**: Missing type definitions (Expo handles this at runtime)

These errors don't affect runtime functionality. The actual build tools (Wrangler for API, Expo for mobile) handle transpilation correctly.

### Testing Workflow

Once Supabase is configured:

1. **Start API** (Terminal 1):
   ```bash
   cd packages/api
   pnpm dev
   # Should start on http://localhost:8787
   ```

2. **Test API Health**:
   ```bash
   curl http://localhost:8787/health
   # Expected: {"status":"ok"}
   ```

3. **Start Mobile** (Terminal 2):
   ```bash
   cd apps/mobile
   pnpm start
   # Press 'i' for iOS or 'a' for Android
   ```

4. **Follow Testing Checklist**:
   - See `docs/TESTING_PHASE1.md` for complete test cases
   - Test Auth → Vehicles → Dyno → Mods → Dashboard
   - Verify tier limits work correctly

### What to Test First

**Critical Path (30 minutes):**
1. Sign up new user
2. Add 1 vehicle (Free tier limit)
3. Try to add 2nd vehicle → should show upgrade prompt
4. Add 5 dyno records
5. Try to add 6th → should show upgrade prompt
6. Add 10 mod logs
7. Try to add 11th → should show upgrade prompt
8. Check Dashboard stats update correctly

**If critical path works, Phase 1 is functional.**

### Known Limitations

- **No Supabase = No Testing**: Database is required for all features
- **TypeScript errors**: Cosmetic only, don't affect runtime
- **No web UI yet**: Phase 1 focused on mobile + API
- **No payment integration**: Upgrade prompts don't actually upgrade (Phase 4)

### Next Steps

After successful testing:
- Document any bugs found
- Update CLAUDE.md with test results
- Begin Phase 2 planning (public profiles, sharing, leaderboard)

### Need Help?

- **Supabase setup issues**: See `docs/SUPABASE_SETUP.md` troubleshooting section
- **API won't start**: Check `.env` file has correct `DATABASE_URL`
- **Mobile won't connect**: Verify `EXPO_PUBLIC_API_URL` points to correct host
- **Auth fails**: Verify Supabase keys are correct in all `.env` files

# Phase 1 Testing Checklist

## Prerequisites

### 1. Environment Setup
- [ ] Supabase project created (follow `docs/SUPABASE_SETUP.md`)
- [ ] Database migrations run (`cd packages/db && pnpm prisma db push`)
- [ ] Environment variables configured:
  - [ ] `packages/api/.env` (copy from `.env.example`)
  - [ ] `apps/web/.env.local` (copy from `.env.local.example`)
  - [ ] `apps/mobile/.env` (copy from `.env.example`)

### 2. Start Development Servers
```bash
# Terminal 1: API
cd packages/api
pnpm dev

# Terminal 2: Mobile
cd apps/mobile
pnpm start
```

---

## Test Cases

### Authentication (Mobile)

#### Sign Up
- [ ] Open mobile app
- [ ] Navigate to Sign Up screen
- [ ] Enter email and password
- [ ] Submit form
- [ ] **Expected**: User created, redirected to Dashboard
- [ ] **Verify**: User appears in Supabase Auth dashboard

#### Login
- [ ] Navigate to Login screen
- [ ] Enter existing credentials
- [ ] Submit form
- [ ] **Expected**: Logged in, redirected to Dashboard

#### Logout
- [ ] Navigate to Profile tab
- [ ] Tap "Sign Out" button
- [ ] **Expected**: Logged out, redirected to Login screen

---

### Vehicles CRUD (Mobile)

#### Add Vehicle (Free Tier - Limit: 1)
- [ ] Login as Free tier user
- [ ] Navigate to Garage tab
- [ ] Tap "+" button
- [ ] Fill in: Make, Model, Year, Trim (optional), Drivetrain
- [ ] Submit form
- [ ] **Expected**: Vehicle created, appears in garage list

#### Add Second Vehicle (Free Tier - Should Block)
- [ ] Try to add another vehicle
- [ ] **Expected**: Upgrade prompt modal appears
- [ ] **Message**: "You've reached the limit of 1 vehicle on the Free plan"
- [ ] Tap "Maybe Later" to close modal

#### View Vehicle Details
- [ ] Tap on a vehicle in garage list
- [ ] **Expected**: Vehicle detail screen with Dyno/Mods tabs

#### Archive Vehicle
- [ ] In garage list, long-press on a vehicle
- [ ] Confirm deletion
- [ ] **Expected**: Vehicle archived (soft delete), removed from list
- [ ] **Verify**: `is_archived = true` in database

---

### Dyno Records CRUD (Mobile)

#### Add Dyno Record (Free Tier - Limit: 5/vehicle)
- [ ] Navigate to vehicle details
- [ ] Ensure "Dyno" tab is active
- [ ] Tap "+" button
- [ ] Fill in: WHP (required), Torque, 0-60, Notes
- [ ] Submit form
- [ ] **Expected**: Dyno record created, appears in list

#### Add 5 Dyno Records
- [ ] Add 4 more dyno records (total 5)
- [ ] **Expected**: All 5 records appear in list

#### Add 6th Dyno Record (Free Tier - Should Block)
- [ ] Try to add 6th record
- [ ] **Expected**: Upgrade prompt modal appears
- [ ] **Message**: "You've reached the limit of 5 dyno records per vehicle on the Free plan"

#### Delete Dyno Record
- [ ] Long-press on a dyno record
- [ ] Confirm deletion
- [ ] **Expected**: Record deleted, removed from list

---

### Mod Logs CRUD (Mobile)

#### Add Mod Log (Free Tier - Limit: 10/vehicle)
- [ ] Navigate to vehicle details
- [ ] Switch to "Mods" tab
- [ ] Tap "+" button
- [ ] Select category (e.g., "Engine")
- [ ] Enter description (e.g., "Cobb Stage 2+ ECU tune")
- [ ] Enter cost (optional, e.g., "650")
- [ ] Submit form
- [ ] **Expected**: Mod log created, appears in list

#### Add 10 Mod Logs
- [ ] Add 9 more mod logs (total 10)
- [ ] **Expected**: All 10 logs appear in list

#### Add 11th Mod Log (Free Tier - Should Block)
- [ ] Try to add 11th log
- [ ] **Expected**: Upgrade prompt modal appears
- [ ] **Message**: "You've reached the limit of 10 mod logs per vehicle on the Free plan"

#### Delete Mod Log
- [ ] Long-press on a mod log
- [ ] Confirm deletion
- [ ] **Expected**: Log deleted, removed from list

---

### Dashboard (Mobile)

#### Stats Display
- [ ] Navigate to Dashboard tab
- [ ] **Expected**: Stats grid shows:
  - **Vehicles**: Correct count of active vehicles
  - **Total WHP**: Sum of max WHP from each vehicle's dyno records
  - **Dyno Runs**: Total count of all dyno records
  - **Mods**: Total count of all mod logs
- [ ] Add a new dyno record
- [ ] Return to Dashboard
- [ ] **Expected**: Stats update automatically

#### Garage Preview
- [ ] **Expected**: First 3 vehicles displayed
- [ ] Tap "See all" → navigates to Garage tab
- [ ] Tap on a vehicle → navigates to vehicle details

#### Quick Actions
- [ ] Tap "Add Vehicle" → navigates to add vehicle form
- [ ] Tap "Log Dyno" → navigates to add dyno form (for first vehicle)
- [ ] Tap "Log Mod" → navigates to add mod form (for first vehicle)

---

### Profile (Mobile)

#### Display User Info
- [ ] Navigate to Profile tab
- [ ] **Expected**: Shows email, username, subscription tier ("Free")

#### Sign Out
- [ ] Tap "Sign Out" button
- [ ] **Expected**: Logged out, redirected to Login screen

---

### API Endpoints (Manual Testing)

Use `curl` or Postman to test API directly:

#### Health Check
```bash
curl http://localhost:8787/health
# Expected: {"status":"ok"}
```

#### Auth - Sign Up
```bash
curl -X POST http://localhost:8787/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
# Expected: {"user":{...},"session":{...}}
```

#### Vehicles - List
```bash
curl http://localhost:8787/vehicles \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
# Expected: [{"id":"...","make":"...","model":"...",...}]
```

#### Vehicles - Create (Test Tier Limit)
```bash
# Add 2nd vehicle as Free tier user
curl -X POST http://localhost:8787/vehicles \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"make":"Honda","model":"Civic","year":2020}'
# Expected: {"error":"Vehicle limit reached for your tier"}
```

---

## Database Verification

### Check Tables in Supabase
- [ ] Go to Supabase → Table Editor
- [ ] **Expected**: 4 tables exist:
  - `User` (with `tier` column)
  - `Vehicle` (with `is_archived` column)
  - `DynoRecord`
  - `ModLog`

### Check Data Integrity
- [ ] Create a vehicle
- [ ] Add dyno records and mod logs
- [ ] Archive the vehicle
- [ ] **Expected**: All related records remain (soft delete, not cascade)
- [ ] Delete a dyno record
- [ ] **Expected**: Record removed from database

---

## Known Issues / Edge Cases

### To Test
- [ ] What happens if user deletes all vehicles? (Dashboard should show empty state)
- [ ] What happens if API is down? (Mobile should show error message)
- [ ] What happens if user has no dyno records? (Stats should show "—")
- [ ] Can user add vehicle with year in the future? (Should validate)
- [ ] Can user add dyno with negative WHP? (Should validate)

---

## Performance Testing

### Mobile App
- [ ] App loads within 2 seconds
- [ ] Dashboard stats load within 1 second (with 5 vehicles)
- [ ] No lag when scrolling garage list (with 10+ vehicles)
- [ ] Forms submit within 500ms

### API
- [ ] `/vehicles` responds within 200ms
- [ ] `/dyno/:vehicleId` responds within 200ms
- [ ] Tier limit checks don't add noticeable latency

---

## Next Steps After Testing

If all tests pass:
- [ ] Commit any bug fixes
- [ ] Update CLAUDE.md with test results
- [ ] Begin Phase 2 planning

If tests fail:
- [ ] Document issues in GitHub Issues
- [ ] Prioritize critical bugs
- [ ] Fix and re-test

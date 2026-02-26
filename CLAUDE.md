# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DynoSync is an AI-powered car modification archive SaaS targeting hardcore overseas car enthusiasts. The core value proposition: convert casual "plain language" mod inputs into high-quality personalized performance dashboards — solving the pain of fragmented, hard-to-track tuning and dyno data, while delivering a "digital garage" with strong social sharing appeal.

The current repo is a mobile-first UI mockup. It consists of standalone HTML screens — there is no build system, framework, or backend.

## Architecture

Each `.html` file is a self-contained screen mockup representing one view of the mobile app. They share no code between files — all styling, config, and markup is inline per file.

**Tech stack per file:**
- **Tailwind CSS** via CDN (`https://cdn.tailwindcss.com?plugins=forms,container-queries`) with an inline `tailwind.config` script block
- **Google Fonts**: primarily `Space Grotesk` (most screens), `Chakra Petch` + `Roboto Mono` (telemetry dashboard)
- **Material Symbols Outlined** icon font from Google Fonts
- No JavaScript frameworks, no bundler, no npm

## Design System

All screens share these Tailwind theme tokens (defined inline per file):

| Token | Value |
|---|---|
| `primary` | `#258cf4` |
| `background-light` | `#f5f7f8` |
| `background-dark` | `#101922` |
| `surface-dark` | `#1c2a38` or `#182634` (varies) |

- Dark mode is enabled via the `class` strategy; all screens default to `<html class="dark">`
- Mobile-first layout: `max-w-md mx-auto` container, `min-height: max(884px, 100dvh)`
- Bottom navigation bar is a recurring pattern across screens (fixed/sticky, 4-5 tabs)
- PRO tier is visually distinguished with a gold gradient badge (`from-yellow-400 to-orange-500`)

## Screen Inventory

| File | Screen |
|---|---|
| `telemetry_dashboard_overview.html` | Main dashboard — WHP/torque stats, perf growth chart, mod logs |
| `garage_vehicle_management_list.html` | Multi-car garage list with swipe actions |
| `ai_tuning_advisor_dashboard.html` | AI "Neural Advisor" with dyno graph and mod recommendations |
| `global_model_leaderboard.html` | WHP leaderboard filtered by car model |
| `scan_dyno_sheet_capture.html` | Camera scan UI for importing dyno sheets |
| `dynosync_pro_subscription_upgrade.html` | Pro paywall — $9.99/mo or $79.99/yr via Stripe (UI shows old pricing, needs update) |
| `add_new_build_*.html` | Build creation flow (basic specs, performance baseline) |
| `performance_comparison_before_vs_after.html` | Before/after dyno comparison |
| `ai_mod_*.html` | AI mod log input and comparison analysis |
| `social_share_export_engine.html` | Share/export build cards |
| `public_build_*.html` | Public-facing build profile and history |
| `achievements_*.html` | Achievement system and tuner hall of fame |
| `leaderboard_filters_ranking_types.html` | Leaderboard filter UI |
| `car_build_timeline_history.html` | Build timeline view |
| `profile_settings_social_sync.html` | User profile and social settings |
| `stripe_payment_success_pro_welcome.html` | Post-payment confirmation |
| `pro_membership_onboarding_guide.html` | Pro onboarding flow |
| `brand_identity_visual_system.html` | Brand/design system reference |
| `app_icon_concept_variations.html` | App icon concepts |

## Platform Strategy

**Mobile app is the primary product.** Core usage is field-first — recording at the dyno shop, track day, or car show. Camera-based dyno sheet scanning, photo capture, and social sharing (9:16 cards → Instagram Stories/Reels) are all native mobile workflows.

**Web is for acquisition and public content**, not a full product experience. Two exceptions where Web must be fully functional (not just marketing pages):
- **Public Build Profiles** (`dynosync.app/u/{username}`) — shareable links posted to Reddit/forums must render complete build data without requiring app install. This is the primary no-friction acquisition hook.
- **Leaderboards** — publicly indexable pages capture SEO traffic from "[car model] dyno results" and "[car model] stage 2 tune" searches, which are high-intent queries from the exact target audience.

The share card QR code (visible in `social_share_export_engine.html`) links to the public build profile URL, closing the loop between in-app sharing and web-based acquisition.

## Subscription Tiers & Feature Entitlements

Three tiers: Free / Pro ($9.99/mo or $79.99/yr) / Elite ($24.99/mo or $199/yr).

| Feature | Free | Pro | Elite |
|---|---|---|---|
| Garage vehicles | 1 | 5 | Unlimited |
| Dyno records per vehicle | 5 | Unlimited | Unlimited |
| Mod log entries per vehicle | 10 | Unlimited | Unlimited |
| Scan paper dyno sheet | ✗ | ✓ | ✓ |
| AI mod suggestions | 3/month | Unlimited | Unlimited + priority queue |
| AI mod comparison analysis | ✗ | ✓ | ✓ |
| Before/after performance comparison | ✗ | ✓ | ✓ |
| Social share card | With watermark | No watermark | No watermark + custom branding |
| Export formats | Image only | Image + PDF | Image + PDF + raw CSV |
| Leaderboard | View only | Participate | Participate |
| Public build profile | ✗ | ✓ | ✓ |
| Build timeline | ✗ | ✓ | ✓ |
| Achievements | Basic badges | All badges | All badges + exclusive Elite badge |
| Parts recommendations | Generic | Personalized | Personalized |
| Tuner verified badge | ✗ | ✗ | ✓ |
| Private build mode | ✗ | ✗ | ✓ |
| Data export API | ✗ | ✗ | ✓ |
| Multi-device sync | ✗ | ✓ | ✓ |
| Ads | Yes | No | No |

**Key design rationale:**
- Free dyno record cap (5) is the primary conversion trigger — users hit the wall after they've already invested data, making upgrade intent high
- AI limited to 3/month on Free so users experience value before hitting the limit
- Leaderboard is publicly visible but Free users can't rank — drives both acquisition and conversion
- Tuner badge + API are Elite-only, targeting professional tuners and shops who justify the higher price

## Tech Stack

### Mobile (primary product)
- **React Native + Expo** — iOS + Android from one codebase; Expo SDK covers camera/image needs for Phase 3 dyno scanning

### Web (public pages + marketing)
- **Next.js** — SSR/SSG for SEO-critical public Build Profiles and leaderboards; deployed on Vercel

### Backend
- **Node.js + Hono** — lightweight, TypeScript-native, deployed on Cloudflare Workers; shares types with frontend via monorepo

### Database & Auth
- **Supabase** (PostgreSQL) — handles Auth (email + Google OAuth), Storage (vehicle images), and database; JSONB fields for flexible mod log data

### Monorepo
- **Turborepo + pnpm workspaces**

```
dynosync/
├── apps/
│   ├── mobile/        # React Native + Expo
│   └── web/           # Next.js
├── packages/
│   ├── api/           # Hono backend
│   ├── db/            # Prisma schema + migrations
│   └── types/         # shared TypeScript types
```

### Deferred decisions
- AI model selection (Phase 3)
- Push notification service (Phase 2+)
- Image CDN / processing (Supabase Storage sufficient for MVP)
- Payments (Stripe, Phase 4)

## Development Roadmap

### Phase 1 — Core Loop (8-10 weeks)
Goal: users can complete the full "record → view" flow.

- Auth (email + Google OAuth)
- Add vehicle (make/model/year)
- Manual dyno data entry (WHP, torque, 0-60)
- Mod log entry (plain text)
- Basic dashboard (`telemetry_dashboard_overview.html`)
- Garage list (`garage_vehicle_management_list.html`)
- Free tier limits hardcoded (1 vehicle, 5 dyno records)

Not in scope: AI, social, scanning, payments.
Validation: do users actually input their data?

### Phase 2 — Social & Growth Hooks (6-8 weeks)
Goal: product acquires new users on its own.

- Public Build Profile (Web, no login required)
- Share card generation (watermarked, `social_share_export_engine.html`)
- Basic leaderboard (by car model, read-only, SEO-indexable)
- Before/after performance comparison (`performance_comparison_before_vs_after.html`)
- Build timeline (`car_build_timeline_history.html`)

Validation: do shared links drive organic signups?

### Phase 3 — AI Differentiation (6-8 weeks)
Goal: establish the core moat vs. competitors.

- Plain-language mod log parsing (NLP → structured data)
- AI mod suggestions (based on car model + current stage)
- AI mod comparison analysis (`ai_mod_comparison_analysis.html`)
- Paper dyno sheet scanning (`scan_dyno_sheet_capture.html`)
- Free tier AI cap enforced (3/month)

Validation: AI suggestion accuracy and user satisfaction.

### Phase 4 — Monetization (4-6 weeks)
Goal: generate first revenue.

- Stripe subscription integration (Pro: $9.99/mo or $79.99/yr)
- Pro feature gates (no watermark, 5 vehicles, unlimited records, leaderboard participation)
- Payment success + onboarding screens (`stripe_payment_success_pro_welcome.html`, `pro_membership_onboarding_guide.html`)
- Subscription management

Validation: Free → Pro conversion rate of 3-5%.

### Phase 5 — Elite & Growth Flywheel (ongoing)
Goal: increase ARPU and build community moat.

- Elite tier ($24.99/mo or $199/yr): tuner badge, private builds, data export API
- Achievements system (`achievements_*.html`)
- Parts affiliate integration (eBay Motors / Amazon)
- Leaderboard participation (Pro+ only)
- Multi-device sync

### Sequencing Rationale
- AI is intentionally Phase 3 — validate that users will input data before investing in AI infrastructure
- Web public pages (Phase 2) ship before payments (Phase 4) — zero-cost growth engine should run first
- Don't wait for feature completeness to charge; once AI differentiation exists, monetization is justified

## Working with These Files

Since there is no build step, open any `.html` file directly in a browser to preview it. Each file is fully independent — editing one does not affect others.

When adding a new screen, copy the Tailwind config block and font imports from an existing screen to maintain consistency. The telemetry dashboard uses a different font stack (`Chakra Petch`/`Roboto Mono`) intentionally for its "HUD" aesthetic — other screens use `Space Grotesk`.

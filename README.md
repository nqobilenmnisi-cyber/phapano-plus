# Phapano+

The digital home of psychology in South Africa. A real, production-structured
Next.js + TypeScript + Tailwind + Supabase application.

This repository contains both:

- the **public website** (the face of Phapano+), and
- the **authenticated web application** (the logged-in experience).

---

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.local.example .env.local
# Add real Supabase values, or explicitly enable local demo mode below.

# 3. Run
npm run dev
# open http://localhost:3000
```

### Development-only demo mode

To preview UI without Supabase, add this to `.env.local`:

```bash
NEXT_PUBLIC_ENABLE_DEMO_MODE=true
```

Demo mode is accepted only while running the development server. A production
deployment with missing or placeholder Supabase values returns a configuration
error and never relaxes authentication or administrative route protection.

---

## Connecting Supabase (when ready)

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL editor, run the numbered files in **`supabase/migrations/`** in
   ascending order. These migrations are the canonical database history.
3. `supabase/seed.sql` is intentionally empty. The old shared-password demo
   account was retired. A guarded, migration-aligned local sample-data process
   will be introduced before public beta.
4. Copy your project URL and anon (publishable) key into `.env.local`:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR-ANON-KEY
   ```

5. Restart `npm run dev`. Auth, profiles, saving, the journal and the admin
   portal become live.

To make yourself an admin, set your profile row's `role` to `admin` in the
Supabase table editor, then visit `/admin`.

---

## Deploying to Vercel

1. Push this repo to GitHub.
2. Import it in Vercel.
3. Add the two Supabase environment variables and `NEXT_PUBLIC_SITE_URL` in
   Vercel project settings.
4. Deploy. Vercel auto-detects Next.js.

---

## Architecture

```
src/
  app/
    (auth)/            login, signup, server actions
    layout.tsx         root layout, fonts, metadata
    page.tsx           landing (full marketing site = Milestone 2)
    globals.css        Tailwind layers + Phapano design tokens
  components/          Logo, AuthForm, illustration system (reusable)
  lib/supabase/        client / server / middleware / fail-closed config
  middleware.ts        session refresh + route protection
  types/database.ts    typed schema mirror
supabase/
  migrations/          canonical database history, applied in number order
  schema.sql           legacy reference snapshot, not a deployment source
```

### Design system

Encoded in `tailwind.config.ts` and `globals.css`, ported faithfully from the
approved prototype:

- **Blue** (`#76B9F0`, action `#2E6FB0`) guides.
- **Bronze** (`#AD795B`) celebrates — progress, milestones, achievements only.
- **Charcoal** (`#373738`) anchors.
- Fonts: **Sora** (headings), **Manrope** (body).
- Hand-drawn illustration system in `components/illustrations.tsx`.

### Data protection (POPIA, doc 11)

Row Level Security enforces the data tiers:

- **Journal entries** are owner-only and **not** readable by admins — walled off.
- Saved items and applications are owner-only.
- Universities / funding / articles are publicly readable **only when published**;
  admins manage them.

---

## Protected routes

`/dashboard`, `/app/*`, `/onboarding`, `/admin` require authentication.
Unauthenticated users are redirected to `/login?redirect=…`.

---

## Milestone status

- **M1 — Architecture, Supabase, auth, protected routes, schema, env** ✅
- **M2 — Public website + onboarding, profiles, real dashboard** ✅
- **M3 — Apply (university directory, detail pages, tracking, deadlines)** ✅
- **M4 — Funding (directory, detail, saving, deadline tracking)** ✅
- **M5 — Journal (create, edit, delete, search, prompts, mood)** ✅
- **M6 — Profile, settings and privacy (incl. POPIA account deletion)** ✅
- **Community relationship notifications and controls** ✅
- **Deadline and funding notification delivery** planned before public beta
- **M7 — Admin portal (universities, funding, articles, verification)** ✅
- **Guarded local sample-data process** planned before public beta
```

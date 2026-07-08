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
# (the app runs with the default placeholders too — see "Demo mode" below)

# 3. Run
npm run dev
# open http://localhost:3000
```

### Demo mode (no Supabase yet)

The app is built to run **without real Supabase credentials**. With placeholders:

- the public website and app shells render normally;
- auth gating is relaxed so pages are previewable;
- auth actions return a calm "Supabase isn't connected yet" message instead of crashing.

When you add real credentials, **nothing in the code needs to change** — the same
architecture switches into full authenticated mode automatically.

---

## Connecting Supabase (when ready)

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL editor, run **`supabase/schema.sql`** (tables, relationships,
   enums, Row Level Security, triggers, account-deletion RPC).
3. Then run **`supabase/seed.sql`** to load sample South African universities,
   programmes, funding and articles, and to create the demo account
   (`demo@phapano.com` / `Demo123!`) with data in every module.
4. Copy your project URL and anon (publishable) key into `.env.local`:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR-ANON-KEY
   SUPABASE_SERVICE_ROLE_KEY=YOUR-SERVICE-ROLE-KEY
   ```

5. Restart `npm run dev`. Auth, profiles, saving, the journal and the admin
   portal become live.

To make yourself an admin, set your profile row's `role` to `admin` in the
Supabase table editor, then visit `/admin`.

---

## Deploying to Vercel

1. Push this repo to GitHub.
2. Import it in Vercel.
3. Add the three environment variables above in Vercel project settings.
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
  lib/supabase/        client / server / middleware / config (placeholder-safe)
  middleware.ts        session refresh + route protection
  types/database.ts    typed schema mirror
supabase/
  schema.sql           full database: tables, FKs, enums, RLS, triggers
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
- **M6 — Profile, settings, notifications (incl. POPIA account deletion)** ✅
- **M7 — Admin portal (universities, funding, articles, verification)** ✅
- **Seed data + permanent demo account** ✅

## Demo account

After running `supabase/seed.sql`:

- **Email:** demo@phapano.com
- **Password:** Demo123!

Every module is pre-populated: saved universities, saved funding, an
in-progress application, journal entries, and notifications.
```

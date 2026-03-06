# THE SEA STAR SF — CLAUDE.md

## What This Is
Craft cocktail bar website for The Sea Star in Dogpatch, SF.
URL: theseastarsf.com
Owner: Alicia Walton (bartender/operator)
Tech manager: GG (non-technical, manages site + SEO)

## Stack
- Next.js 14 App Router
- Supabase Postgres (DB + storage for images)
- Groq (free tier, blog AI generation)
- Resend (free tier, newsletter + contact form emails)
- Vercel (free tier, hosting)
- Tailwind CSS
- GitHub repo

## External Integrations (embed only, no API)
- Untappd: iframe embed at https://business.untappd.com/embeds/iframes/4010/12417
- Perfect Venue: link to https://app.perfectvenue.com/venues/sea-star/hello

## Architecture
```
/app
  /page.tsx                    -- public homepage (port existing HTML)
  /blog/[slug]/page.tsx        -- individual blog post
  /blog/page.tsx               -- blog listing
  /admin/page.tsx              -- admin login
  /admin/menu/page.tsx         -- cocktail CRUD
  /admin/blog/page.tsx         -- blog creator + AI generate
  /admin/subscribers/page.tsx  -- view email list
  /admin/messages/page.tsx     -- view contact submissions
  /api/auth/login/route.ts     -- admin login (bcrypt check)
  /api/menu/route.ts           -- CRUD menu items
  /api/blog/route.ts           -- CRUD blog posts
  /api/blog/generate/route.ts  -- Groq AI generation
  /api/blog/publish/route.ts   -- publish + email to subscribers
  /api/subscribe/route.ts      -- public email signup
  /api/contact/route.ts        -- public contact form
```

## Menu Design Rules
1. PUBLIC SITE shows ONLY: image, name, blurb (2-sentence fun description), price.
2. NO recipes on the public site. Recipes are staff-only (the raw menu doc).
3. Menu categories displayed as tabs: "Batched!", "Made To Order", "Draft", "NA Mocktails"
4. Beer tab = Untappd iframe ONLY. No hardcoded beer items.
5. Wine = static section (not from DB).
6. Each drink card: photo on top/left, name bold, blurb in lighter text, price.
7. The blurb is editable by Alicia in the admin. It's the fun customer-facing description.
8. Design should EXCEED the current Wix site (theseastarsf.com/drinkmenu). More elegant, more fun, better photos, better typography. Dark theme, orange accent, Sea Star branding.

## DB Fields for menu_items
- id (UUID)
- name (TEXT)
- price (DECIMAL)
- blurb (TEXT) — 2-sentence fun customer description
- image_url (TEXT) — drink photo from Supabase Storage
- category (TEXT) — "Batched", "Made To Order", "Draft", "NA Mocktails"
- sort_order (INTEGER)
- is_active (BOOLEAN)
- created_at, updated_at (TIMESTAMPTZ)

## Key Rules
1. Admin auth: bcrypt password in admin_users table. Session via httpOnly cookie. No Supabase Auth.
2. Groq model: llama-3.3-70b-versatile (free tier)
3. Blog AI prompt must match Sea Star voice: warm, fun, neighborhood bar, Dogpatch pride, cocktail-forward, dog-friendly, unpretentious.
4. All Supabase queries use service role key in API routes. No client-side Supabase.
5. Images: Supabase Storage bucket "drink-images" for menu, "blog-images" for blog.
6. Email newsletter uses Resend. From: hello@theseastarsf.com
7. Homepage is a DIRECT PORT of dubsfan.github.io/the-sea-star-sf with the menu section upgraded to pull from Supabase.

## Env Vars Required (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
GROQ_API_KEY=
RESEND_API_KEY=
ADMIN_COOKIE_SECRET=
```

## Build and Deploy
```bash
npm run dev -- -p 3005   # local development (NEVER use port 3000 — it conflicts with other services)
npm run build            # production build
```

## Dev Server Rule
- NEVER run on port 3000. Always use port 3005: `npm run dev -- -p 3005`
- Port 3000 has conflicts and causes stale CSS/cache issues on this machine.

## GUARDRAILS
- Never claim done without testing
- Verify files exist before referencing
- Test all API routes with curl before marking complete
- No placeholder or TODO code in production files

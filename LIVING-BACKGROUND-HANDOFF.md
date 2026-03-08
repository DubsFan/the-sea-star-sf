# Living Bay Background — Engineering Handoff

## The Vision

The Sea Star is a 127-year-old craft cocktail bar in Dogpatch, SF. The website's hero section currently has a static gradient. We're building a **living, breathing background** that reflects the real sky, weather, water, and wildlife of San Francisco Bay — in real time. Think of it as looking out the bar's window at the waterfront.

The aesthetic is **dark, luxurious, nautical**. Gold accent (#c9a54e), deep navy/teal backgrounds, serif typography (Cormorant Garamond, Playfair Display). Nothing cute or cartoonish. The animations should feel like nature — slow, ambient, barely-there. If someone notices the background moving, we've gone too far.

## The Stack

- **Next.js 14 App Router** on Vercel (Hobby plan)
- **Tailwind CSS** with custom color tokens (`sea-gold`, `sea-blue`, `sea-light`, etc.)
- **SunCalc** npm package for astronomical calculations
- **OpenWeatherMap API** (free tier, 1000 calls/day) for live weather
- All animations are **CSS-only** — zero JS animation libraries
- Mobile-first. Owner manages site from her phone.

## Branch & Repo

- **Branch:** `living-bay-background` (DO NOT merge to `main` or deploy to prod without explicit approval)
- **Repo:** github.com/DubsFan/the-sea-star-sf
- **Production:** https://the-sea-star.vercel.app (reflects `main` only)
- **Deploy:** `vercel --prod` for main, `vercel` (no flag) for preview. Git push does NOT trigger deploys.
- **Dev server:** `npm run dev -- -p 3005` (NEVER port 3000)

## File Map (2,151 lines total)

```
app/
  lib/sky-phases.ts              (237 lines) — SunCalc wrapper, gradient math, sky phase engine
  api/weather/route.ts           (141 lines) — OpenWeatherMap proxy, 1hr server cache, WeatherData type
  components/
    living-background/
      LivingBackground.tsx       (107 lines) — Orchestrator: composes all layers, manages state
      SkyGradient.tsx            (30 lines)  — CSS gradient background driven by sky-phases
      CelestialBody.tsx          (177 lines) — Sun + Moon positioning, size, color, glow
      CloudLayer.tsx             (98 lines)  — CSS cloud shapes driven by weather.clouds %
      WeatherEffects.tsx         (91 lines)  — Rain, fog (Karl!), wind-driven effects
      WaterReflection.tsx        (220 lines) — Bay water with shimmer, sun reflection column
      Skyline.tsx                (44 lines)  — Port of SF silhouette image overlay
      Stars.tsx                  (119 lines) — Twinkling CSS stars, fade with daylight
      Wildlife.tsx               (296 lines) — Birds (V-formation, herons), sea creatures
    WeatherBar.tsx               (294 lines) — Nav dropdown: weather button + slim stats bar
    HarborConditions.tsx         (297 lines) — OLD, no longer imported, can delete
    Starfield.tsx                (exists)    — OLD static starfield, still used as fallback in LivingBackground
  globals.css                    — @property for sky color transitions, animation keyframes
  page.tsx                       — Homepage, imports LivingBackground + WeatherBar
public/
  skyline-port.png               — Port of SF silhouette (1920x1080, transparent alpha)
  gauge-test.html                — Prototype file (not production, for design iteration)
  hero-test.html                 — Prototype file (not production)
```

## Architecture: How It Works

### Data Flow

```
SunCalc (client)  ──> sky-phases.ts ──> SkyData { phase, gradients, sun/moon position, stars }
                                              │
OpenWeatherMap ──> /api/weather ──> WeatherData { condition, clouds, wind, temp, etc. }
                                              │
                                    LivingBackground.tsx
                                       │  │  │  │  │  │  │
                           SkyGradient  │  │  │  │  │  │  Starfield
                              CelestialBody │  │  │  │  Wildlife
                                 CloudLayer  │  │  │  Skyline
                                   WeatherEffects │  WaterReflection
```

### Sky Phase Engine (`sky-phases.ts`)

Converts solar altitude (from SunCalc) into 12 named phases:

```
night → astronomicalDawn → nauticalDawn → dawn → sunrise → goldenMorning →
day → goldenEvening → sunset → dusk → nauticalDusk → astronomicalDusk → night
```

Each phase outputs:
- `skyTop`, `skyMid`, `skyBottom` — CSS colors for the gradient
- `sunPosition` — x/y (0-100%), altitude, color, glow size
- `moonPosition` — x/y, phase (0-1), illumination %
- `starsOpacity` — 0 to 1
- `reflectionColor` — for water
- `phase` — the named phase string

Colors transition smoothly using `lerpColor()` between phase boundaries. The `@property` declarations in `globals.css` enable CSS-native color interpolation.

### Layer Stack (z-order, bottom to top)

1. **SkyGradient** — Full-bleed CSS gradient, 3-stop vertical
2. **CelestialBody** — Sun (golden disk + radial glow) and Moon (CSS crescent via shadow trick)
3. **CloudLayer** — Soft CSS blob shapes, count/opacity driven by `weather.clouds` %
4. **WeatherEffects** — Rain streaks (CSS keyframe), fog overlay (Karl the Fog at visibility < 2000m)
5. **WaterReflection** — Bottom 35vh, horizontal shimmer, vertical sun reflection column
6. **Skyline** — `skyline-port.png` silhouette, opacity/filter changes by phase
7. **Wildlife** — Birds with CSS flap animation, V-formation arcs
8. **Starfield** — Twinkling dots, opacity controlled by `starsOpacity`

Everything sits inside `z-0`, content floats above at `z-[1]` or higher.

### WeatherBar (nav dropdown)

Separate from the background. Lives in the nav bar.

- **Button**: Left side of nav, next to logo. Shows live temp + "Weather" + chevron.
- **Click**: Slim bar slides down under the nav with ALL weather stats in one row.
- **Stats shown**: Temp, Sky (condition), Wind (knots + compass), Visibility (nm), Pressure (inHg), Humidity (%), Sunset time, Moon phase.
- **Icons**: Modern clean SVG line icons. NOT ornate gauges.
- **Background**: Faint wood grain texture (CSS repeating-linear-gradient), brass dot separators. Antique feel is *subtle* — data readability is king.
- **Mobile**: Wraps to 2 rows, icons shrink, "Weather" label hidden (just temp + chevron).

### Weather API (`/api/weather`)

- Proxies OpenWeatherMap current + 5-day forecast
- Server-side 1hr cache (in-memory `cache` variable)
- Returns `WeatherData` type with: condition, clouds, humidity, temp, wind, windDeg, visibility, pressure, description, hourlyForecast[]
- Env var: `OPENWEATHERMAP_API_KEY`
- Graceful fallback (clear sky, 58F) when no API key or API fails

## What's Done (5 commits on branch)

1. **Phase 1** — Sky gradients, sun/moon positioning, water reflection, CSS stars
2. **Phase 2** — Weather API integration, clouds, Karl the Fog, rain effects
3. **Phase 3** — Wildlife animations (birds, easter eggs)
4. **Phase 4** — Harbor Conditions section (old full-page version, now superseded)
5. **Weather bar redesign** — Moved weather to nav dropdown, removed old Harbor section, nav cleanup

## What Works

- Sky gradients change with real time of day (12 phases, smooth transitions)
- Sun and moon track across sky based on SunCalc data
- Clouds render based on live weather API cloud coverage %
- Rain/fog effects trigger from weather conditions
- Water has horizontal shimmer and sun reflection column
- Port of SF skyline silhouette adjusts by time of day
- Birds animate along V-arc paths with randomized flap speeds
- Stars fade in at night, out at dawn
- WeatherBar shows all 8 stats in a clean dropdown
- Demo mode: add `?demo=1` to URL for a time-of-day slider
- Build passes clean. No TypeScript errors.

## What Needs Work / Known Issues

### Visual Polish (not yet user-approved)
- **The background has not been visually reviewed on the live site by the owner.** All work is on the branch. Nobody has signed off on how it looks.
- Bird animations may need opacity/speed tuning
- Skyline silhouette alignment at different viewport heights needs testing
- Water shimmer may be too subtle or too aggressive depending on screen
- Cloud shapes are basic CSS blobs — could be more organic
- The `?demo=1` time slider exists but UI for it may need work

### WeatherBar Polish
- Brass dot separators between stats use a plain `div` — should use CSS `::before` pseudo-elements to avoid rendering on the first item
- Sunset display shows raw `formatTimeDate()` output — could be cleaner
- Moon phase names are abbreviated (`Wax Gibb`) — may want full names on desktop, abbreviated on mobile
- The bar's `max-height` transition can feel slightly janky on slow devices
- No loading state — button appears only after weather fetch succeeds (which is correct, but there's a flash of no-button on first load)

### Architecture Cleanup
- `HarborConditions.tsx` (297 lines) — dead code, no longer imported. Delete it.
- `Starfield.tsx` — still imported inside LivingBackground as a sub-layer. If we keep the living background, the standalone Starfield on `main` becomes redundant.
- `public/gauge-test.html` and `public/hero-test.html` — prototype files. Delete before merging to main.
- `port_transparent.png` in repo root — the processed version is at `public/skyline-port.png`. Root copy can be deleted.

### Unfinished Design Decisions
- **Hero "the" repositioning**: Multiple prototype rounds were done (see `hero-test.html`). Owner wanted "the" left-aligned above the S in "Sea Star", with the tail of the "e" just kissing the top-left of the S. Prototypes were shown but no final selection was made. Current hero is unchanged from main.
- **Category labels**: Already on branch — "Portside Classics", "Starboard Select", etc. These are approved.
- **Nav items**: Story and Alicia removed from nav. Sections remain on page. This is approved.

## Design Constraints

- **Mobile first.** Owner (GG) manages everything from her phone. 44px min touch targets.
- **No external images for UI** (weather icons, gauges, etc.) — all CSS + inline SVG.
- **No JS animation libraries** — CSS only (keyframes, transitions, transforms).
- **Performance**: Background must not jank the hero text or scrolling. GPU-accelerated transforms only. Minimal repaints.
- **Graceful degradation**: If weather API fails, background still works (just no clouds/rain). If SunCalc somehow fails, static gradient fallback.
- **Dark theme**: Site is dark navy/black. Gold (#c9a54e) is the accent. Blue (#6b7a99) is secondary text. Never bright white backgrounds.

## Environment Variables

```
OPENWEATHERMAP_API_KEY=   # Free tier, needed for weather API
NEXT_PUBLIC_SUPABASE_URL= # For menu/blog data
SUPABASE_SERVICE_ROLE_KEY=
GROQ_API_KEY=             # Blog AI generation
RESEND_API_KEY=           # Email newsletters
ADMIN_COOKIE_SECRET=      # Auth cookies
```

## How to Run

```bash
git checkout living-bay-background
npm install
npm run dev -- -p 3005
# Open http://localhost:3005
# Add ?demo=1 for time-of-day slider
```

## How to Deploy Preview

```bash
vercel          # Preview deploy (NOT --prod)
```

**NEVER run `vercel --prod` on this branch.** That deploys to the live site and has broken production before.

## Merge Checklist (when ready)

- [ ] Owner visually approves background on real device (phone + desktop)
- [ ] Owner approves WeatherBar design and data display
- [ ] Delete `HarborConditions.tsx`
- [ ] Delete `public/gauge-test.html` and `public/hero-test.html`
- [ ] Delete `port_transparent.png` from repo root
- [ ] Decide on hero "the" positioning (or defer to separate PR)
- [ ] Test on 375px, 768px, 1440px viewports
- [ ] Verify weather API works with production env var
- [ ] `npm run build` passes clean
- [ ] Merge to main, then `vercel --prod`

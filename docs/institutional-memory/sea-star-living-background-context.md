# Sea Star Living Background Context Memory

Last updated: March 7, 2026
Working branch: `codex/living-bay-water-lab`
Production branch: `main`
Protected source branch: `living-bay-background`

## Non-Negotiable Branch Rules

1. Do not modify `main`.
2. Do not modify `living-bay-background`.
3. All new work happens only on `codex/living-bay-water-lab` unless GG explicitly says otherwise.
4. Never deploy production from this branch.
5. Use Vercel preview deployments only for this branch.

## Vercel / Git State

- Repo: `github.com/DubsFan/the-sea-star-sf`
- Vercel project: `the-sea-star`
- Production branch in Vercel: `main`
- Stable preview alias for this branch:
  - `https://the-sea-star-git-codex-living-bay-43c1ab-ggs-projects-4525ede8.vercel.app`

## Project Goal

The Sea Star site hero should feel like a living view over San Francisco Bay from a 127-year-old cocktail bar in Dogpatch.

Desired mood:
- dark
- luxurious
- nautical
- subtle
- illustrated / engraved / vintage printmaking

Motion rule:
- ambient and alive
- never busy
- if the motion is obvious in a cheap way, it failed

## Current Architecture

Primary files:
- `app/components/living-background/LivingBackground.tsx`
- `app/components/living-background/SkyGradient.tsx`
- `app/components/living-background/CelestialBody.tsx`
- `app/components/living-background/CloudLayer.tsx`
- `app/components/living-background/WeatherEffects.tsx`
- `app/components/living-background/WaterReflection.tsx`
- `app/components/living-background/Skyline.tsx`
- `app/components/living-background/Stars.tsx`
- `app/components/living-background/Wildlife.tsx`
- `app/lib/sky-phases.ts`
- `app/globals.css`
- `app/page.tsx`

## What Was Implemented In This Branch

### Branch / deployment setup

- Vercel Git integration was connected for this repo.
- Vercel production branch was verified as `main`.
- Isolated work branch `codex/living-bay-water-lab` was created from `living-bay-background`.

### Sunset preview mode

- This branch defaults to a sunset test state for faster visual iteration.
- Real-time mode can still be forced with `?live=1`.
- Demo slider mode still exists with `?demo=1`.

### Moon / celestial groundwork

- `sky-phases.ts` now includes more complete moon data, including altitude and glow color.
- `CelestialBody.tsx` was updated so the moon uses actual sky position instead of a fake fixed spot.
- `LivingBackground.tsx` passes moon and weather inputs through to the water layer.

### Water direction

The water went through several iterations. The current method is:

- engraved / etched line-art style
- deterministic SVG wave lines
- moving line groups for visible motion
- stronger sun / moon reflection integrated into the line system
- vanishing-perspective shaping so the water recedes into the distance
- deterministic irregularities and small crest breaks so it reads less like perfect generated stripes

Important:
- GG preferred the engraved style over a more photoreal attempt.
- Earlier motion passes were too subtle or did not read correctly.
- The current pass is improved but still not final.

Current water file:
- `app/components/living-background/WaterReflection.tsx`

Recent water-related commits:
- `91753d1` Rebuild water as engraved wave linework
- `8d14464` Animate engraved water line ripples
- `c4f72dd` Make engraved water motion more visible
- `fa0944c` Make water loop seamless and more dramatic
- `336cc98` Tune engraved water motion and shimmer
- `e94e1b6` Add perspective and irregularity to water

### Skyline direction

GG shifted focus from water to the skyline.

New skyline asset provided by GG:
- root source file: `SS_skyline_long.png`
- app asset copy now in: `public/SS_skyline_long.png`

Current skyline implementation:
- `Skyline.tsx` now uses `SS_skyline_long.png`
- skyline is stacked into four layered passes
- each layer has different opacity, blur, lift, and scale
- phase-aware tint overlay was added

Important:
- this was only the first skyline draft
- local build passed
- latest branch commit for skyline work: `49fe039`
- the latest live visual outcome was not screenshot-verified from the agent environment

## User Feedback History That Matters

### Water

- GG liked the engraved / line-art water method much more than the earlier fake shimmer panel.
- GG wanted visible motion, not theoretical motion.
- GG wanted:
  - fewer horizontal waves
  - stronger movement
  - smoother looping
  - much stronger sun / moon shimmer
  - irregularity so it does not feel computer-perfect
  - vanishing perspective so the water feels like it recedes into the distance

### Skyline

- GG wants the skyline at the top of the water behind the buttons.
- GG wants it to feel like four distinct transparency / opacity layers, not a flat silhouette.
- GG provided `SS_skyline_long.png` for this purpose.
- GG stated that the skyline work and the current branch work will be merged immediately as the first step after setup.

### Later work still requested

- soften sun and moon edges
- add more glow / shine to sun and moon
- smooth their arc movement
- possibly increase daytime birds to replace some of the visual energy lost when stars disappear

## Files And Assets To Avoid Touching Without Explicit Approval

User-owned untracked files currently present:
- `SS_skyline_long.png` in repo root
- `port_transparent.png`
- `public/gauge-test.html`
- `public/hero-test.html`

Do not delete or alter these unless GG explicitly asks.

## Verification Status

Verified:
- branch isolation
- GitHub push
- Vercel preview triggering
- local `npm run build` after skyline and recent water changes

Not verified:
- exact live visual quality of the latest skyline draft from the protected preview, due browser/protected-preview limitations in-agent

## Stable Review URL

Use the branch alias rather than one-off deployment URLs:

`https://the-sea-star-git-codex-living-bay-43c1ab-ggs-projects-4525ede8.vercel.app`

# New Agent Handoff Prompt

You are continuing work inside the Sea Star website repo.

## Mandatory Branch Rules

1. Do not modify `main`.
2. Do not modify `living-bay-background`.
3. Work only on `codex/living-bay-water-lab`.
4. Do not deploy production.
5. Use preview deployments only.

## Repo And Preview Context

- Repo root: `/Volumes/Sam4T/External Project/the-sea-star`
- Stable branch preview:
  - `https://the-sea-star-git-codex-living-bay-43c1ab-ggs-projects-4525ede8.vercel.app`
- Vercel production branch: `main`

## Project Goal

The Sea Star hero background should feel like looking out over San Francisco Bay from a 127-year-old cocktail bar in Dogpatch.

Target style:
- dark
- luxurious
- nautical
- subtle
- engraved / vintage illustration

## What Has Already Been Done

### Background system

Core files:
- `app/components/living-background/LivingBackground.tsx`
- `app/components/living-background/WaterReflection.tsx`
- `app/components/living-background/Skyline.tsx`
- `app/components/living-background/CelestialBody.tsx`
- `app/lib/sky-phases.ts`
- `app/globals.css`
- `app/page.tsx`

### Sunset preview mode

- This branch defaults to a sunset test mode for visual iteration.
- `?live=1` forces real-time mode.
- `?demo=1` still enables demo slider mode.

### Water

The current accepted direction is engraved / etched water, not photoreal WebGL water.

Recent water work:
- line-art wave structure
- integrated sun / moon reflection
- stronger motion
- perspective recession
- deterministic irregularity
- small crest breaks

Relevant commits:
- `91753d1`
- `8d14464`
- `c4f72dd`
- `fa0944c`
- `336cc98`
- `e94e1b6`

### Skyline

GG supplied a new skyline image:
- source in repo root: `SS_skyline_long.png`
- copied app asset: `public/SS_skyline_long.png`

Current skyline status:
- first four-layer skyline draft implemented
- file: `app/components/living-background/Skyline.tsx`
- latest skyline commit: `49fe039`
- local build passed
- latest live visual outcome was not screenshot-verified from agent environment
- GG's latest instruction is to merge the skyline work and the current branch work immediately as the first step after setup

## What GG Wants Next

Immediate focus:
- merge skyline work and current branch work immediately after setup
- then continue skyline polish above the water and behind the buttons
- keep four distinct transparency / opacity layers
- keep depth, not flatness
- keep it elegant, not muddy

Then:
- finish water polish if still needed
- soften sun and moon edges
- add glow / shine
- smooth their arc movement
- possibly increase daytime birds

## User Feedback To Respect

1. GG strongly preferred the engraved illustration language over photoreal attempts.
2. GG wants movement that is actually visible, not “theoretically subtle.”
3. GG does not want computer-perfect repetition.
4. GG wants perspective and depth.
5. GG is non-technical and wants direct execution, not abstract explanation.

## Files To Avoid Touching Without Explicit Approval

User-owned untracked files:
- `SS_skyline_long.png` in repo root
- `port_transparent.png`
- `public/gauge-test.html`
- `public/hero-test.html`

## Required Working Style

1. Read the current target file before editing.
2. Use `apply_patch` for manual edits.
3. Run `npm run build` after each meaningful pass.
4. Push branch changes so GG can review them on preview.
5. Be honest about what was and was not verified.
6. Do not claim visual success without seeing it.

## Recommended Next Action

Inspect `app/components/living-background/Skyline.tsx`, compare the latest skyline draft against GG’s feedback, then iterate the skyline depth and placement first before returning to water or celestial polish.

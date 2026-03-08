# Institutional Memory

This file is the durable memory for future work on this repo and branch.

## Read Order

Before starting any task, read these files in this order:

1. `AGENTS.md`
2. `plan.MD`
3. `MEMORY.md`
4. `HANDOFF-CODEX-LIVING-BAY-WATER-LAB.md`

## Current Working Branch

- Primary branch for this work: `codex/living-bay-water-lab`
- Do not touch: `main`
- Do not touch: `living-bay-background`

## Stable Worktree Rule

Do all work from:

- `/Volumes/Sam4T/External Project/the-sea-star-codex`

Do not continue active feature work from:

- `/Volumes/Sam4T/External Project/the-sea-star`

Reason:

- the original repo worktree repeatedly flipped branches during active work
- this created false "missing file" and false "merge failed" confusion

## Institutional Facts

These are the important durable facts:

1. `main` does not contain the living background system used in this branch.
2. The codex branch contains the living background engine and related files.
3. The biggest failure mode was not lost code. It was using the wrong worktree and reading the wrong branch state.
4. The deterministic deployment path is Git push to the codex branch, then let Vercel rebuild from Git.
5. Manual `vercel deploy` caused avoidable confusion and permission/env problems during this session.
6. The correct Vercel project with env vars is `the-sea-star`.
7. The temporary `the-sea-star-codex` Vercel project was the wrong target for real branch deployment.
8. PR, commit, and merge are always part of the normal workflow unless explicitly paused.
9. Users expect visible results, not just local edits, so meaningful UI work should end with commit plus push unless explicitly paused.
10. If GitHub CLI auth is missing, PR automation is blocked and that blocker must be reported immediately instead of silently stopping at local changes.
11. Commit identity must stay only under GG / `DubsFan`; do not add Claude, Anthropic, Codex, OpenAI, or ChatGPT as co-author, co-signer, trailer, or signature.

## Primary Workflow Baseline

The baseline workflow rules come from:

- `/Volumes/Sam4T/External Project/the-sea-star/CLAUDE.md`

The most important inherited rules are:

1. mobile first
2. never claim done without testing
3. verify files exist before referencing them
4. no placeholder or TODO production code
5. persist institutional memory after meaningful milestones

## Core Files For This Branch

- `HANDOFF-CODEX-LIVING-BAY-WATER-LAB.md`
- `LIVING-BACKGROUND-HANDOFF.md`
- `app/components/living-background/LivingBackground.tsx`
- `app/components/living-background/Wildlife.tsx`
- `app/components/living-background/Skyline.tsx`
- `app/components/living-background/WaterReflection.tsx`
- `app/components/living-background/CelestialBody.tsx`
- `app/components/WeatherBar.tsx`
- `app/lib/sky-phases.ts`
- `app/globals.css`
- `app/page.tsx`

## Current Visual Decisions

- the hazy upper skyline layer was removed
- the visible skyline should be the crisp lower skyline only
- the water layer is raised to hide the skyline seam
- the hero CTA row is anchored near the skyline/water break
- the hero `Discover` marker should be centered with a full-width bottom rail, not positioned from a self-sized box
- CTA cards are strong gold with white text
- `the`, `Your Own Adventure`, and `Discover` use the header-logo white
- the weather widget and `Book Event` button should use matching dark-glass header styling for balance on this branch
- wildlife now includes more active gull and pelican behaviors, with daytime/golden-hour dive, skim, and recover motion layered into the existing ambient flights

## Build And Push Rule

Before push:

```bash
cd "/Volumes/Sam4T/External Project/the-sea-star-codex"
git branch --show-current
git status --short
npm run build
```

Push with:

```bash
git push origin codex/living-bay-water-lab
```

## Memory Persistence Rule

After meaningful progress:

1. update `MEMORY.md`
2. update `HANDOFF-CODEX-LIVING-BAY-WATER-LAB.md` when branch-specific facts change
3. update `plan.MD` when workflow changes
4. if external memory persistence is in use, save memory to:
   - `/Users/liltroy/.claude/projects/-Volumes-Sam4T-External-Project-the-sea-star/memory/`

## Do Not Commit

- `output/`
- screenshots
- debug artifacts
- local-only test files

## If Something Looks Missing

Check this first:

```bash
pwd
git branch --show-current
```

If you are not in the codex worktree on `codex/living-bay-water-lab`, you are in the wrong place.

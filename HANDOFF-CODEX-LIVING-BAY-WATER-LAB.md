# Handoff Prompt: `codex/living-bay-water-lab`

Use this prompt to continue work on the Sea Star living background branch without repeating the merge and deployment failures from this session.

## Prompt

You are continuing work on the Sea Star repo for the branch `codex/living-bay-water-lab`.

Read this entire handoff before touching any files.

### Branch Rules

- Work only on branch: `codex/living-bay-water-lab`
- Do not touch: `main`
- Do not touch: `living-bay-background`
- Do not do any work in the original repo root if a stable codex worktree exists

### Critical Workspace Rule

There were repeated branch-state problems during this session because the original repo worktree at:

- `/Volumes/Sam4T/External Project/the-sea-star`

kept flipping between branches during active work.

To avoid that, all real work was moved to the stable dedicated worktree:

- `/Volumes/Sam4T/External Project/the-sea-star-codex`

The next engineer should do all coding, builds, commits, and pushes from:

- `/Volumes/Sam4T/External Project/the-sea-star-codex`

Before doing anything:

```bash
cd "/Volumes/Sam4T/External Project/the-sea-star-codex"
git branch --show-current
```

Required result:

```bash
codex/living-bay-water-lab
```

If that is not the result, stop and fix the branch/worktree first.

### What Went Wrong Earlier

These were the real problems:

1. The original repo worktree kept landing on `main`, which made it look like the living background files had disappeared.
2. `main` does not contain the living background system. The codex branch does.
3. This caused false "missing files" confusion because the checked-out branch kept changing underneath the session.
4. Vercel preview checks were confusing because the branch preview lagged behind local pushed changes.
5. A direct `vercel deploy` to a newly linked project failed because that project had no env vars.
6. After relinking to the correct Vercel project, a direct CLI deploy still failed due to a Vercel team permission check on the Git author email.
7. Because of that, the deterministic deployment path for this branch is: commit to Git, push branch, let Git-connected Vercel rebuild.

### Deterministic Rules

Follow these rules exactly:

1. Use only `/Volumes/Sam4T/External Project/the-sea-star-codex`
2. Confirm branch before edits
3. Build after meaningful passes
4. Do not claim visual success unless actually seen
5. Do not use `vercel deploy` as the primary path
6. Push to `origin/codex/living-bay-water-lab` and let Vercel build from Git
7. Never modify `main` or `living-bay-background`
8. Do not commit `output/` screenshots or debug artifacts
9. Do not stop at local edits when the user expects to see the work in preview
10. If PR automation is blocked by missing GitHub auth, report that blocker immediately
11. Keep commit identity only under GG / `DubsFan`; never add Claude, Anthropic, Codex, OpenAI, or ChatGPT as co-author, co-signer, trailer, or signature

### Required Pre-Flight Before Every Push

Run:

```bash
cd "/Volumes/Sam4T/External Project/the-sea-star-codex"
git branch --show-current
git status --short
npm run build
git log -1 --format='%h %an <%ae>'
```

Push only if:

- branch is `codex/living-bay-water-lab`
- build passes
- only intended tracked files are changed

### Deployment Rule

Do not rely on manual Vercel CLI deployment for this branch.

Use:

```bash
git push origin codex/living-bay-water-lab
```

Then verify the Git-based Vercel preview after rebuild.

Visible completion for this branch means:

1. commit the work
2. push the branch
3. verify the Git-based preview when possible
4. update or create the PR if GitHub auth is available

### Current Branch State

Recent branch commits from this session:

- `7363441` Merge living background into codex branch
- `08c2567` Refine hero styling and skyline layer
- `5a9d6d1` Adjust hero CTA placement and styling
- `55e2ed0` Center hero CTA row

### Living Background Files on This Branch

These are the key files that were merged and repaired on `codex/living-bay-water-lab`:

- `app/components/living-background/LivingBackground.tsx`
- `app/components/living-background/Wildlife.tsx`
- `app/components/living-background/Skyline.tsx`
- `app/components/living-background/WaterReflection.tsx`
- `app/components/living-background/CelestialBody.tsx`
- `app/components/WeatherBar.tsx`
- `app/lib/sky-phases.ts`
- `app/globals.css`
- `app/page.tsx`
- `public/SS_skyline_long.png`

### What Was Merged

The codex branch now includes:

- the living background engine
- skyline layer rendering
- raised water layer to cover the seam at the skyline/water break
- daytime bird system replacing the failed scratch-like birds
- expanded daytime bird behaviors with gull and pelican dive / skim / recover motion
- a forced hero pelican dive at golden evening and sunset, with deeper water contact and splash timing so the hunt action reads clearly
- celestial path changes for sun and moon movement
- weather bar/mobile weather adjustments
- hero CTA styling and placement changes

### Important Current Visual Decisions

- The hazy upper skyline back layer was removed.
- The visible skyline should be the crisp lower skyline only.
- The hero CTA row is anchored near the skyline/water break, not floating in mid-hero.
- The hero `Discover` marker should stay centered via a full-width bottom rail wrapper.
- The hero CTA cards were changed to strong gold cards with white text.
- `the`, `Your Own Adventure`, and `Discover` were changed to the header-logo white.
- The weather widget and `Book Event` button should share the same dark-glass control styling for header balance on this branch.

### Known Risks / Things To Verify Before New Work

Before starting unrelated tasks, visually verify:

1. skyline is present and crisp, with no hazy duplicate layer above it
2. water fully covers the skyline seam with no visible gap
3. CTA row is centered
4. CTA cards are visible against the current sky
5. current-time sky behavior matches real time when not in demo mode
6. branch preview reflects the latest pushed commit

### Demo and Time Controls

The page supports demo sky testing through query params in `app/page.tsx`.

Current behavior:

- default path uses real current time
- `?demo=1` enables demo mode
- `?demo=1&minute=720` forces noon for verification

Do not leave debug-only time overrides hardcoded into normal runtime.

### Build Notes

The stable codex worktree uses symlinks for local development:

- `.env.local` symlinked from the original repo
- `node_modules` symlinked from the original repo

These are local environment conveniences. Do not remove them unless replacing them intentionally.

### Vercel Context

The correct Vercel project for real env vars was:

- `the-sea-star`

A temporary incorrect project link to `the-sea-star-codex` was created during troubleshooting. That project had no env vars and was not the correct deployment target.

The next engineer should treat Git push as the primary deployment path and avoid trying to outsmart Vercel with ad hoc project relinking unless absolutely necessary.

### Untracked Local Artifacts

Do not commit:

- `output/`
- screenshots
- test artifacts
- local-only debug files

### How To Start the Next Task Safely

Use this exact startup sequence:

```bash
cd "/Volumes/Sam4T/External Project/the-sea-star-codex"
git branch --show-current
git status --short
sed -n '1,220p' HANDOFF-CODEX-LIVING-BAY-WATER-LAB.md
```

Then inspect the exact files relevant to the next request before editing.

### If Something Looks "Missing"

Do not assume the files are gone.

Check:

```bash
git branch --show-current
pwd
```

If you are in the original repo root or on `main`, you are in the wrong place.

### Instruction To the Next Engineer

Do not restart by "merging the living background" again unless Git proves something is actually absent.

The main failure mode in this session was not missing code. It was using the wrong worktree and then reading the wrong branch state.

Start from the codex worktree, confirm the branch, inspect the relevant files, build after meaningful changes, and push only through Git.

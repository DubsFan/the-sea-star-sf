# AGENTS.md

This repo uses local operating documents for task flow and institutional memory.

## Foundation Rule

Use the primary Sea Star rules in:

- `/Volumes/Sam4T/External Project/the-sea-star/CLAUDE.md`

as the foundation for work in this codex tree.

Use the local codex documents as branch-specific operating overrides:

- `AGENTS.md`
- `plan.MD`
- `MEMORY.md`
- `HANDOFF-CODEX-LIVING-BAY-WATER-LAB.md`

If there is a conflict:

1. branch safety and worktree rules in `AGENTS.md`
2. branch procedure in `plan.MD`
3. institutional memory in `MEMORY.md`
4. branch-specific handoff in `HANDOFF-CODEX-LIVING-BAY-WATER-LAB.md`
5. primary repo baseline in `/Volumes/Sam4T/External Project/the-sea-star/CLAUDE.md`

## Required Read Order For Any Agent

Before doing any non-trivial work, read:

1. `AGENTS.md`
2. `plan.MD`
3. `MEMORY.md`
4. `HANDOFF-CODEX-LIVING-BAY-WATER-LAB.md`
5. `/Volumes/Sam4T/External Project/the-sea-star/CLAUDE.md`

## File Roles

- `plan.MD` = task startup rules, execution flow, and current working procedure
- `MEMORY.md` = institutional memory and durable lessons from prior work
- `HANDOFF-CODEX-LIVING-BAY-WATER-LAB.md` = branch-specific background, merge history, deployment pitfalls, and current state
- `/Volumes/Sam4T/External Project/the-sea-star/CLAUDE.md` = baseline Sea Star workflow, product rules, memory persistence expectations, mobile-first constraints, and guardrails

## Mandatory Branch And Worktree Rule

Use:

- `/Volumes/Sam4T/External Project/the-sea-star-codex`

Work only on:

- `codex/living-bay-water-lab`

Do not touch:

- `main`
- `living-bay-background`

## Workflow Rules Inherited From Primary `CLAUDE.md`

These are mandatory unless a branch-specific file above overrides them:

1. Mobile users first. Design and verify mobile behavior before desktop.
2. Never claim done without testing.
3. Verify files exist before referencing them.
4. No placeholder or TODO code in production files.
5. Use the Sea Star stack and product conventions defined in the primary `CLAUDE.md`.
6. Use the Sea Star voice and site rules from the primary `CLAUDE.md` when touching public-facing content.
7. Use local dev on port `3005`, not `3000`.

## PR Workflow Rule

PR, commit, and merge are always part of the workflow.

Default workflow:

1. make the change
2. verify it
3. commit it
4. push the branch
5. open or update the PR
6. merge through the intended branch flow when approved

Do not leave meaningful finished work uncommitted unless explicitly asked.

Visible completion rule:

1. local code changes are not enough
2. meaningful work must be committed
3. the working branch must be pushed so the Git-connected Vercel preview can rebuild
4. PR status must be updated when GitHub auth is available
5. if PR automation is blocked by missing auth, report that blocker immediately in the handoff

Commit identity rule:

1. commits must be attributed only to GG / `DubsFan`
2. never add Claude, Anthropic, Codex, OpenAI, or ChatGPT as co-author, co-signer, trailer, or signature in commits
3. never add AI co-sign language to commit messages

## Branch-Specific Override To Primary Deploy Rule

The primary `CLAUDE.md` says production deploys happen through Vercel CLI.

For this codex branch, the safe default is different:

- push through Git:
  - `git push origin codex/living-bay-water-lab`
- let the Git-connected branch preview rebuild

Reason:

- manual Vercel deploy attempts created env and permission confusion during this branch recovery

## Institutional Memory Persistence

The primary `CLAUDE.md` memory rule is mandatory here.

After every meaningful milestone, commit, deploy, or branch recovery event:

1. update `MEMORY.md`
2. update `HANDOFF-CODEX-LIVING-BAY-WATER-LAB.md` if branch-specific context changed
3. update `plan.MD` if task startup or workflow changed
4. persist memory to the primary external memory path if that system is being used:
   - `/Users/liltroy/.claude/projects/-Volumes-Sam4T-External-Project-the-sea-star/memory/`

Minimum memory persistence standard:

- new gotchas
- branch/worktree traps
- deployment traps
- file locations that matter
- new durable workflow rules

## Agent Behavior Requirements

1. Confirm working directory and branch before edits.
2. Read `plan.MD` for task procedure.
3. Read `MEMORY.md` for institutional memory before repeating old troubleshooting paths.
4. Read `HANDOFF-CODEX-LIVING-BAY-WATER-LAB.md` before continuing living background work.
5. Build after meaningful code changes.
6. Do not claim visual success unless it was actually seen.
7. Use Git push as the default deployment path for this branch.
8. After meaningful progress, persist institutional memory into the repo docs.
9. Treat commit and PR progression as part of the task, not optional follow-up.
10. Do not stop at a local-only state when the user expects to see the change live in preview.
11. When using transparent foreground edge art, do not assume a CSS background repeat will preserve the visible subject; verify whether the subject lives only at the image bottom before replacing an `img` with a background treatment.
12. When terminal screenshot tooling returns blank or inconsistent frames, do not claim visual confirmation from it; rely on the live preview or a verified local browser capture instead.

## Startup Command

```bash
cd "/Volumes/Sam4T/External Project/the-sea-star-codex"
git branch --show-current
git status --short
```

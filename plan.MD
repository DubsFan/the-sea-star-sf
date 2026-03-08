# plan.MD

This file is the operational task entrypoint for future work on this branch.

## Mandatory Read Order

Before starting any task:

1. Read `AGENTS.md`
2. Read `plan.MD`
3. Read `MEMORY.md`
4. Read `HANDOFF-CODEX-LIVING-BAY-WATER-LAB.md`

## Task Startup Checklist

Run:

```bash
cd "/Volumes/Sam4T/External Project/the-sea-star-codex"
pwd
git branch --show-current
git status --short
```

Required:

- working directory is `/Volumes/Sam4T/External Project/the-sea-star-codex`
- branch is `codex/living-bay-water-lab`

If either is wrong, fix that before reading code or editing files.

## Planning Rule

For every new task:

1. restate the requested change
2. inspect only the directly relevant files first
3. consult `MEMORY.md` for institutional rules
4. consult `HANDOFF-CODEX-LIVING-BAY-WATER-LAB.md` for branch-specific background
5. build after meaningful changes
6. do not claim visual success unless it was actually seen

## Workflow Foundation

Use `/Volumes/Sam4T/External Project/the-sea-star/CLAUDE.md` as the baseline workflow source.

Especially inherit:

- mobile-first execution
- test-before-claiming-done
- file verification before referencing
- no placeholder production code
- memory persistence after meaningful milestones

## Deployment Rule

Use Git push as the default deployment path:

```bash
git push origin codex/living-bay-water-lab
```

Do not default to `vercel deploy`.

## Commit / PR / Merge Rule

Commit, PR, and merge are part of the normal workflow.

For meaningful task completion:

1. make the change
2. verify the change
3. commit the change
4. push the branch
5. update or create the PR if applicable
6. prepare for merge as part of the handoff flow

Do not treat a local uncommitted state as the default stopping point unless explicitly requested.

Do not treat "implemented locally" as completion when the user expects to see the result.

For visible completion on this branch:

1. commit the work
2. push `codex/living-bay-water-lab`
3. let the Git-connected Vercel preview rebuild
4. update or create the PR when GitHub auth is available
5. report any auth or deploy blocker immediately

## Current Branch Focus

This branch is the living background branch.

Primary systems in scope:

- skyline
- water
- wildlife
- celestial motion
- weather widget
- hero integration with the living background

## Current Header Decisions

- the weather widget and `Book Event` button should use the same header control shell for balance
- on this branch, `Book Event` should mirror the weather widget's dark glass background, border strength, and hover treatment
- if this branch is merged later, that header pairing should come forward with it

## Sources Of Truth

Task and workflow source of truth:

- `plan.MD`

Institutional memory source of truth:

- `MEMORY.md`

Detailed branch handoff source of truth:

- `HANDOFF-CODEX-LIVING-BAY-WATER-LAB.md`

Primary baseline source of truth:

- `/Volumes/Sam4T/External Project/the-sea-star/CLAUDE.md`

## Memory Persistence Requirement

After every meaningful task pass, commit, deploy, or recovery event:

1. update `MEMORY.md` with durable learnings
2. update `HANDOFF-CODEX-LIVING-BAY-WATER-LAB.md` if branch context changed
3. update `plan.MD` if operating procedure changed

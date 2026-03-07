# Sea Star Living Background Active Plan

Last updated: March 7, 2026
Branch: `codex/living-bay-water-lab`

## Primary Objective

Finish the living bay hero background in a way that feels on-brand for The Sea Star:

- engraved / illustrated
- subtle
- dark and luxurious
- atmospheric rather than flashy

## Current Priority Order

1. Merge skyline work and current branch work immediately after setup
2. Skyline layering and placement polish
3. Water final polish
4. Sun and moon softness / glow / path
5. Daytime bird density tuning

## Immediate Merge Instruction

GG's latest direction:

- merge the skyline work and current branch work immediately
- this is the first step after setup
- do not treat skyline as a side experiment anymore

## 1. Merge Skyline Work And Current Branch Work Immediately After Setup

### Goal

Treat the current skyline implementation and the current living-background work as the baseline moving forward.

### Required behavior

1. Setup first.
2. Merge skyline plus current branch work immediately after setup.
3. Continue polishing from that merged state.

## 2. Skyline Layering And Placement

### Goal

Make the skyline feel like it has depth behind the buttons and above the water, with four distinct tonal layers.

### Current state

- First four-layer skyline draft is implemented in `Skyline.tsx`
- It uses `public/SS_skyline_long.png`
- It has not been visually approved yet

### Next checks

1. Confirm it sits at the right vertical position relative to the waterline and hero buttons.
2. Confirm the four layers feel distinct, not muddy.
3. Confirm blur is not making it look cheap or fuzzy.
4. Confirm dusk / night tinting feels elegant.
5. If needed, split the skyline asset into front / mid / back emphasis with masks rather than just reusing the same strip four times.

### Failure condition

- If the skyline still reads like one pasted image, the layering method failed.

## 3. Water Final Polish

### Goal

Keep the engraved style but make the water unmistakably read as water.

### Current state

- Engraved water method is in place
- Motion now reads better than earlier attempts
- Perspective and irregularity were added
- GG still wanted more realism through variation and recession into distance

### Next checks

1. Does the water read as a surface at first glance?
2. Is the perspective convincing?
3. Are the irregular breaks tasteful rather than noisy?
4. Is the reflection integrated into the water instead of floating above it?
5. Is the sunset / moon shimmer strong enough without looking synthetic?

### Failure condition

- If the water still reads as decorative lines instead of water, change the method again.

## 4. Sun And Moon Softness

### Goal

Make both celestial bodies feel luminous and soft, not like hard-edged discs.

### Needed work

1. Reduce hard edges.
2. Add feathered glow and atmospheric bleed.
3. Improve graceful arc movement across the sky.
4. Keep sunset and full-moon states especially beautiful.

## 5. Daytime Birds

### Goal

Use birds to restore subtle visual energy during the day when stars are gone.

### Needed work

1. Increase daytime presence slightly.
2. Keep them ambient, not attention-grabbing.
3. Avoid cartoonish clustering.

## Workflow Rules

1. Work only on `codex/living-bay-water-lab`.
2. Build after each meaningful visual pass.
3. Push branch previews for review.
4. Do not claim visual success unless actually verified.
5. Use the stable branch alias for reviews whenever possible.

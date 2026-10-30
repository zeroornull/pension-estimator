# Pension estimator verification map

This directory is the maintained source for verifying the user-facing behavior of 职工基本养老金估算. Read the index before driving the page, then use the matching feature file as the recipe.

## Baseline preconditions

- Launch with `node .cursor/skills/verify-pension-estimator/scripts/verify.mjs launch` from the repo root.
- Run `doctor` and require the recorded URL, a live Vite pid, and the dev page body.
- Never drive a Vite process that this run did not start.
- Each `drive` opens a new headless Chrome profile, so `pension-estimator.draft.v1` starts empty.
- The page is one route, `/`. There is no login.

## Driving conventions

- Start every recipe from the empty-profile default draft unless its preconditions say otherwise.
- Prefer the accessible names and ids named in the feature file.
- Run the `verify.mjs drive <feature>` command as written. Do not retype the interaction by setting Vue state.
- A city option is chosen with a real mouse press. The control listens to `mousedown`.
- Restore an invalid balance inside the `invalid-input` drive. Do not leave the proof browser on the paused estimate.
- Do not delete `evidence/` during cleanup.

## Proof and skip reporting

- Capture the user action and the resulting state, not only the final screen.
- UI proof includes the text file written by the drive and the PNG beside it.
- Record the feature id in the JSON line the command prints.
- Report an unreachable path with the command and the unmet precondition.
- Do not report a skipped feature as verified through a different feature.

## Feature entry contract

Each feature file starts with an H1 title and one paragraph describing the user-visible behavior. It then uses exactly four H2 sections in this order.

1. `Sub-features` lists short IDs with one line for each behavior.
2. `How to get to it (user POV)` lists every user entry point.
3. `Driving it with verify.mjs` starts with `Preconditions:` and uses labeled bullets that pair each user action with an exact command and observable result.
4. `Gotchas` lists traps that can waste or invalidate a verification run.

## Features

- [Live estimate](./live-estimate.md) covers the default monthly amount on first load.
- [City search](./city-search.md) covers filtering to 深圳 and keeping the account balance.
- [Past index note](./past-index-note.md) covers the average-index sentence while its fold is closed.
- [Invalid input](./invalid-input.md) covers the paused estimate and restoring the amount.
- [Policy links](./policies.md) covers the six official links and the new-window attribute.
- [Month jump](./month-jump.md) covers typing a far year and stepping one year.

# Invalid input

Invalid input stops the monthly amount and shows why, then calculating resumes when the field is valid again.

## Sub-features

- `pause-show` replaces the amount with 结果先停着 when 个人账户余额 is negative.
- `pause-status` exposes that sentence as a status.
- `pause-restore` brings the original amount back after the balance returns to 80000.

## How to get to it (user POV)

- Replace 个人账户余额 with a value below 0.
- Type a balance from 0 through 1000000000 to calculate again.

## Driving it with verify.mjs

Preconditions:

- `doctor` has passed for this launch.
- The empty profile shows a monthly amount.

- **Enter an invalid balance.** Run `node .cursor/skills/verify-pension-estimator/scripts/verify.mjs drive invalid-input`.
- **See the pause.** `evidence/invalid-input/paused.txt` has `lead` null, `pauseRole` status, and `pause` containing 结果先停着.
- **Restore.** `evidence/invalid-input/restored.txt` has the same `lead` as the amount before the invalid value.
- **Proof.** `evidence/invalid-input/paused.png` shows the status sentence and no monthly amount.

## Gotchas

- Setting the input's value from script and dispatching `InputEvent` does not update Vue. The drive selects the field and inserts text through Chrome input.
- The drive restores 80000 before it exits. A failed run can leave the Chrome profile paused, but that profile is deleted with `run/` on cleanup.
- The red error under the field is part of the same pause. The status sentence is the proof that the result stopped.

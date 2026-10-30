# Live estimate

Live estimate shows a monthly basic pension as soon as the page loads, using the empty-profile default draft for the current Shanghai month.

## Sub-features

- `estimate-load` shows the heading 每月基本养老金 and an amount in 元.
- `estimate-parts` shows 相当于现在, 开始领取, and 届时账户 on the same result.

## How to get to it (user POV)

- Open the site root `/`.

## Driving it with verify.mjs

Preconditions:

- `doctor` has passed for this launch.
- The Chrome profile is empty, which `drive` already guarantees.

- **Open the page.** Visit `/`. Run `node .cursor/skills/verify-pension-estimator/scripts/verify.mjs drive live-estimate`. The command exits 0.
- **Read the amount.** Open `evidence/live-estimate/estimate.txt`. `lead` contains 元, and `city` is 上海 for the built-in default.
- **Proof.** `evidence/live-estimate/estimate.png` shows the same amount next to 每月基本养老金.

## Gotchas

- The numeric default changes when the Shanghai month changes. Do not fail this feature only because the amount is no longer 7,517.9.
- `npm test` checks the October 2026 vector. It is not a substitute for this page drive.
- A closed formula disclosure can still expose its text to an accessibility snapshot. Use `lead` for the amount.

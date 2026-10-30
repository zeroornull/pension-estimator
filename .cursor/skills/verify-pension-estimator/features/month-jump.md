# Month jump

Month jump moves the open year by one year, or replaces it by typing four digits. Choosing a month still writes `YYYY-MM`. An empty value opens on the current Shanghai year.

## Sub-features

- `month-open` opens the retirement month panel on its current year.
- `month-type` replaces the year by typing four digits.
- `month-step` moves that year by one year with 上年 and 下年.

## How to get to it (user POV)

- Choose 退休年月.
- Type a four-digit year in 年份 when the target is far away.
- Choose 下年 or 上年 for a nearby year.
- Choose a month button to set the value.

## Driving it with verify.mjs

Preconditions:

- `doctor` has passed for this launch.
- The empty profile still has a statutory retirement month.

- **Open and type.** Run `node .cursor/skills/verify-pension-estimator/scripts/verify.mjs drive month-jump`.
- **Check the year.** `evidence/month-jump/years.txt` has `typed` equal to `2060`. The panel has no 上十年 or 下十年 button.
- **Proof.** `evidence/month-jump/typed.png` shows 2060 in the year field. The drive does not choose a month, so the retirement month stays statutory.

## Gotchas

- 上年 and 下年 change only the panel year until a month button is chosen.
- A year is accepted from 1900 through 2200. Fewer than four digits, or a year outside that range, snaps back to the panel year on blur.
- `.month-year-value` is an input. Read its `value`, not its text.
- Two month panels can exist on the page. Only the open panel is in the document, because opening one closes the other.
- An empty month opens on the Shanghai year from `shanghaiYearMonth`, not 1986.

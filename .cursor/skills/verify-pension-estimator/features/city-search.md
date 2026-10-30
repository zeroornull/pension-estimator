# City search

City search lets a person type part of a retirement city, pick the match, and see that city's contribution figures without losing the account balance.

## Sub-features

- `city-filter` narrows the list to names that contain the typed text.
- `city-pick` switches the retirement city and the two local figures.
- `city-keep-balance` leaves 个人账户余额 unchanged.

## How to get to it (user POV)

- Choose the 退休地 combobox, type, and press a city in the list.

## Driving it with verify.mjs

Preconditions:

- `doctor` has passed for this launch.
- The empty profile still shows 上海 and account `80000`.

- **Record the starting amount.** The drive reads it before typing. `evidence/city-search/before.txt` has `city` 上海 and `account` 80000.
- **Filter.** Click 退休地 and type 深. `evidence/city-search/matches.txt` contains one option, 深圳, with id `city-option-shenzhen`.
- **Pick.** Press that option. `evidence/city-search/after.txt` has `city` 深圳, `reference` 9201, `pensionBase` 11293, and `account` 80000.
- **Amount moved.** `lead` in `after.txt` differs from `lead` in `before.txt`.
- **Proof.** `evidence/city-search/after.png` shows 深圳 and the new monthly amount.

## Gotchas

- The option handler is `mousedown`. A click that never presses the mouse does not pick the city.
- Typing with a synthetic `input` event leaves the list closed. The drive uses Chrome `Input.insertText` after the click.
- 深 matches only 深圳 in the built-in city list. A longer query such as 深圳 also matches, but this recipe uses 深.
- The list replaces the field text on focus. Insert 深 after that selection exists, or the query becomes 上海深.

# Past index note

The past index note tells the person that 1 means they previously contributed at the local average, while 利率和已缴费指数 is still closed.

## Sub-features

- `note-visible` shows the sentence before the fold is opened.
- `note-outside` keeps that sentence out of the fold.

## How to get to it (user POV)

- Open `/` and read the hint above 利率和已缴费指数.
- Open 利率和已缴费指数 only when changing 已缴费的平均指数.

## Driving it with verify.mjs

Preconditions:

- `doctor` has passed for this launch.
- The empty profile has not opened 利率和已缴费指数.

- **Read the closed form.** Run `node .cursor/skills/verify-pension-estimator/scripts/verify.mjs drive past-index-note`. The command exits 0.
- **Check placement.** `evidence/past-index-note/note.txt` has `assumptionsOpen` false, `pastIndexInsideFold` false, and `pastIndexNote` starting with `1 表示以前按当地平均缴费基数缴`.
- **Proof.** `evidence/past-index-note/note.png` shows that sentence while the fold summary is 利率和已缴费指数.

## Gotchas

- An accessibility snapshot can list controls inside a closed `details` element. Check `assumptionsOpen`, not whether the index textbox exists in the tree.
- The sentence is not inside the fold. Opening the fold is not required for this proof.

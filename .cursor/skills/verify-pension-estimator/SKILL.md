---
name: verify-pension-estimator
description: Drive the local 职工基本养老金估算 Vite page in a fresh Chrome profile and save proof under this skill. Use when a change touches the form, the monthly result, city search, the past-index note, invalid input, or the policy links.
---

# Verify the pension estimator

The app is one browser page. Calculation stays in the page. The draft is `localStorage` key `pension-estimator.draft.v1` on that origin. There is no API and no Playwright suite. Domain numbers also have `npm test`, which does not open the page.

Do not drive `npm run dev` if the user already started it. Do not run `npm run deploy`. Do not point this skill at https://pension-estimator.zeroornull.workers.dev. That host is the published site, not this isolated run.

## Launch

From the repo root:

```bash
node .cursor/skills/verify-pension-estimator/scripts/verify.mjs launch
```

The command picks a free `127.0.0.1` port, starts `node node_modules/vite/bin/vite.js --host 127.0.0.1 --port <port> --strictPort`, and prints the URL when Vite logs that URL. Ready means `GET /` returns the dev `index.html` that loads `/src/main.ts`. A listening port alone is not ready.

`node_modules` must already exist. If launch says it cannot find Vite, run `npm install` once and launch again.

The recorded pid and URL live in `.cursor/skills/verify-pension-estimator/run/state.json`. A second launch fails while that pid is alive.

## Doctor

```bash
node .cursor/skills/verify-pension-estimator/scripts/verify.mjs doctor
```

Doctor is read-only. It checks that the recorded Vite pid is alive, `GET /` is 200, the body contains `职工基本养老金估算`, and the body contains `/src/main.ts`. Anything else means the instance is not worth driving. Run `cleanup`, then `launch`, then `doctor` again.

## Drive

Use a fresh headless Chrome at `/usr/bin/google-chrome` with its own `--user-data-dir` under `run/`. Chrome is started by `drive` and stopped when that command finishes. Input goes through Chrome DevTools `Input.dispatchMouseEvent` and `Input.insertText`, because a synthetic `InputEvent` does not update the Vue fields.

```bash
node .cursor/skills/verify-pension-estimator/scripts/verify.mjs drive <feature>
```

Features: `live-estimate`, `city-search`, `past-index-note`, `invalid-input`, `policies`, `month-jump`.

Read `.cursor/skills/verify-pension-estimator/features/README.md` and the matching feature file before choosing one. One command drives one feature from a fresh profile, so localStorage starts empty and the page uses `defaultDraft` for the current Shanghai month.

## Evidence

Each drive writes `.cursor/skills/verify-pension-estimator/evidence/<feature>/`. Text files record the action and the resulting field values. PNG files are screenshots of that same state. Cleanup does not delete this directory.

A passing drive exits 0 and prints one JSON line naming the feature and the observed result. A failing drive exits 1 and names the mismatch. Do not treat a screenshot alone as proof. Read the text file next to it.

The default monthly amount depends on the current Asia/Shanghai month. `city-search` proves a city change by comparing the amount before and after, and by the Shenzhen field values `9201` and `11293`. It does not require the October 2026 figure `7,517.9`.

## Cleanup

```bash
node .cursor/skills/verify-pension-estimator/scripts/verify.mjs cleanup
```

Cleanup sends `SIGTERM` to the Vite pid and the Chrome pid recorded in `state.json`, deletes `run/`, and leaves `evidence/`. It does not kill processes by name. If `state.json` is already gone, cleanup still succeeds.

## Helpers

The only helper is `scripts/verify.mjs`. Run it from the repo root with `node`, as shown above. `launch` prints the URL. `doctor` prints JSON. `drive` prints one JSON result line and writes `evidence/<feature>/`. `cleanup` prints the evidence path it kept.

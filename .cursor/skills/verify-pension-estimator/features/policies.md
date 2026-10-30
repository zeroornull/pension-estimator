# Policy links

Policy links list six official documents and services. Each opens in a new window. Following a link leaves this app.

## Sub-features

- `policies-list` shows six links under 政策依据与官方查询.
- `policies-official` includes the national service at `https://si.12333.gov.cn/`.
- `policies-new-window` sets each link to open in a new window.

## How to get to it (user POV)

- Open `/` and move to 政策依据与官方查询.
- Choose a link. The browser opens it in a new window.

## Driving it with verify.mjs

Preconditions:

- `doctor` has passed for this launch.

- **Read the list.** Run `node .cursor/skills/verify-pension-estimator/scripts/verify.mjs drive policies`. The command exits 0.
- **Check the official entry.** `evidence/policies/links.txt` has six objects. One `href` is `https://si.12333.gov.cn/` and its `target` is `_blank`.
- **Proof.** `evidence/policies/policies.png` shows the heading 政策依据与官方查询. The drive does not follow the link.

## Gotchas

- Do not click through to the government sites during verification. The proof is the href and `target` on this page.
- Link text includes the source line. Match the title span or the href, not a shortened accessible name.

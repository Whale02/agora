# Run progress ledger

Append-only working memory for the autonomous run. The runner records evidence here as it
works; the overseer records proxy calls here; the founder reads the ledgers, not the
transcript.

## How to verify a visual slice

Screenshot harness (already installed): puppeteer-core lives in the scratchpad at
`C:/Users/samwu/AppData/Local/Temp/claude/C--Users-samwu/7c43737e-e54f-44a4-9e15-7a7c8d1465a3/scratchpad`
with `shot.mjs` capturing all routes at 1440 and 390 (edit its target list as routes change).
Serve locally with `npx http-server docs -p 8791 --silent` (a server may already hold the
port; check before starting another). Screenshots land in `.impeccable/review/`.

`contrast.mjs` sits beside it (added in A1): it loads every shipped route at 1440 and 390,
walks each visible text run, resolves the effective background by climbing ancestors, and
exits 1 on any WCAG AA miss. Run it on every visual slice; it caught two real defects in A1.

## Evidence

(one entry per ticked slice: slice id, commit sha, what the evidence was)

### A1. Token system, commit e53577c

- `node contrast.mjs` exit 0: all text on plaza, thread, roster, three profiles, and about
  clears WCAG AA at 1440 and 390. The roster route renders all 25 lifted seat accents, so
  that pass covers every philosopher colour, not a sample.
- It failed first (exit 1, 140 misses) and drove two fixes: `--faint` was 3.52:1 on the
  ground and moved from #6F6658 to #8F8676, and `.btn` set its background only as a
  gradient, so the dark label sat on the page ground whenever the image layer was absent.
- `node shot.mjs` exit 0, overflow-x 0 on all eight captures; `.impeccable/review/`
  desktop.png, mobile.png, convo-desktop.png, convo-mobile.png, roster.png, profile.png,
  profile-mobile.png, about-mobile.png reviewed at 1440 and 390.
- Prose gates on the files A1 touched: `slop-scan.py` exit 0, `slop-shapes.py` exit 0.

## Copy shipped

(every new user-facing string, for the founder's red pen)

## Adaptation calls

(mockup elements dropped or rewired under the honesty law, with one line of reasoning)

- A1. The mockups carry no philosopher colour system; the accents already in
  philosophers.json were chosen for limestone. Rather than edit that file, which lane D
  reserves, the stylesheet lifts each accent toward parchment with `color-mix`, so the data
  stays untouched and all 25 clear AA on black.
- A1. The 404 page moved to the dark world in this slice rather than waiting for A7. It is
  the same token application, and leaving a limestone page reachable from a black site
  would have shipped a visible seam across several commits. A7 still owes the About
  composition, the share stubs, and the OG image.

## Overseer calls

(reversible decisions the overseer made on the run's behalf; founder review pending)

## For the founder

(parked questions only the founder can answer)

## Inherited state (overseer, 2026-08-29)

docs/data/passages/marcus-aurelius.json (205 passages, Long 1862) and plato.json (360
passages, Jowett) were produced by an earlier in-session runner and spot-checked to the
lane D shape. Treat them as lane D work in progress: they still owe D4 validation before
their boxes tick.

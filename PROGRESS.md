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

### A2. App shell, commit 6e7cfdf

- The rail is the grid column and a sticky inner div is what follows the scroll, so the
  stone runs the full page height instead of stopping at 100vh on a long page.
- Content grids moved from viewport media queries to container queries on `main`. Measured
  at eleven widths from 360 to 1920 (`cols.mjs` in the scratchpad): forum, tables and roster
  column counts follow the content box across the 900px rail transition, horizontal overflow
  0 everywhere. Before the change a 900px window would have run a two column feed in 648px.
- Nav fit at 390 measured directly: the label row was 493px against 358px available, which
  hid the source link with no affordance. Stacking each bilingual pair and tightening the
  padding brought it to 378px against 378px available. At 360 it scrolls by 15px.
- `node contrast.mjs` exit 0 at 1440 and 390; `node shot.mjs` exit 0, overflow 0.

### A3. Background system, commits cc1dffb and 267e52f

- Nine surface plates plus the sidebar brazier and eight philosopher plates, built by
  `scripts/build-assets.sh`. `du -sh docs/assets` reports 1.3M against the plan's 6MB ceiling.
- Legibility is measured. `contrast.mjs` was rewritten for this slice: it hides text and its
  decorations, screenshots the page, and reads the brightest rendered pixel under every glyph
  run, taking the run's own line rects from `Range.getClientRects` so a border or an inline
  SVG sibling cannot pose as the background. Ten routes at 1440 and 390: exit 0.
- Negative control, so the check is known to be able to fail: replacing the veil with a flat
  0.2 alpha wash produced 5 failures on two routes, the worst at 1.12 against a needed 4.5.
- Two measurements shaped the design rather than taste. An 8x5 luminance grid per plate
  (ffmpeg `scale=8:5,format=gray`) showed peaks of 35 to 122 out of 255, so the image layer
  carries a brightness lift or the veil leaves nothing to see. The same grid showed the light
  sits in each plate's left third, which is where `cover` puts it under the text, so split
  scenes mirror the plate with `scaleX(-1)`.
- `node shot.mjs` exit 0 with no horizontal overflow on 14 captures; the static 404 was
  captured separately at both widths.
- Prose gates on the gated files: `slop-scan.py` exit 0, `slop-shapes.py` exit 0.

## Copy shipped

(every new user-facing string, for the founder's red pen)

A2, the wayfinding pairs. Chinese carved, English support beneath, as the mockups set it:

    AGORA / 智者的广场      the wordmark and its sub-line
    广场 / PLAZA            the feed
    智者 / PHILOSOPHERS     the roster. The mockups call the directory 智者目录.
    关于 / ABOUT            the about page
    源码 / SOURCE           the GitHub repository

A3, the invitation band at the foot of the about page:

    The plaza takes questions from anyone. Yours becomes a table, and the thinkers with
    the most at stake in it sit down.

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
- A3. Split scenes mirror their plate horizontally. The handoff plates are lit from their
  own left, `cover` matches a wide panel by width so no background-position can move that
  light, and the text column sits on the left. The architecture in these plates is
  symmetrical enough that the mirror reads as the same room.
- A3. The plates ship with a brightness lift in CSS rather than baked into the webp files,
  so the originals stay untouched and the lift is one number to retune per surface.

## Overseer calls

(reversible decisions the overseer made on the run's behalf; founder review pending)

- Staging inside lane A: the asset derivatives were built before A2 rather than inside A3,
  because the shell's brazier needed them. PLAN.md's delegations put staging order inside a
  lane on the overseer proxy. Both boxes tick on their own evidence.
- A7 gained one line in PLAN.md: DESIGN.md is rewritten from the built site at the close of
  lane A. DESIGN.md still describes the limestone world, and rewriting it while the surfaces
  are mid-recomposition would document a moving target. This adds a requirement rather than
  relaxing one.

## For the founder

(parked questions only the founder can answer)

## Inherited state (overseer, 2026-08-29)

docs/data/passages/marcus-aurelius.json (205 passages, Long 1862) and plato.json (360
passages, Jowett) were produced by an earlier in-session runner and spot-checked to the
lane D shape. Treat them as lane D work in progress: they still owe D4 validation before
their boxes tick.

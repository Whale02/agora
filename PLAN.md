# Run: the black-and-gold Agora

Durable state for the autonomous design-and-features run. The runner (Claude Opus 5) reads
this file and PROGRESS.md in full at startup and after every compaction, then works the
highest-priority unblocked slice until the outcome is complete. The overseer (the founder's
Fable session) reviews commits, takes pings, and makes logged reversible calls.

## Outcome

The founder's engineer handoff (extracted at `.handoff/agora_engineer_handoff/`, local only,
never committed) replaces the sunlit-limestone world with a dark-marble-and-gold classical
world and grows the product's surfaces. Ship it as a faithful adaptation: the mockups are the
design source for composition, tokens, and mood; the live product's truth decides which
affordances exist.

## The world (from the handoff, binding)

Black and dark marble grounds, bronze and gold accents, cinematic brazier and moonlight
imagery, elegant serif display with restrained sans support. Wayfinding labels are paired
bilingual exactly as the mockups show (Chinese display with small English support text);
content prose stays English. The handoff backgrounds ship as optimized derivatives in
`docs/assets/` (target: under 6MB total for the directory; use ffmpeg, webp or jpeg, sized
for their surfaces). Originals stay in `.handoff/`, which is gitignored.

## Honesty law (binding, overrides mockup chrome)

Every affordance shipped must function against the real architecture: static Pages, JSON
data, GitHub-issue participation, no accounts, no server, no client API calls. The mockups
show logged-in users, notification badges, like counts, live timers, AI annotation buttons,
and room presence; none of that ships as decoration. Adapt the composition without the
fiction. Where a mockup element depends on a missing capability, either wire it to something
real (the GitHub join flow, the passages corpus, computed data) or leave it out and note it
in PROGRESS.md under `## Adaptation calls`.

## Slices

Lane A, the reskin (first):
- [ ] A1. Token system: rewrite docs/styles.css tokens to the new world (grounds, marble
      texture treatment, gold/bronze accents, type pairing). Type: a serif display with real
      classical character plus a quiet sans; Chinese display text must render well (name the
      zh fallback stack deliberately). Keep a11y contrast, reduced-motion, mobile-first.
- [ ] A2. App shell: sidebar navigation on desktop per the hub mockup (Plaza, Symposium,
      Conversations, Study, Sources, Settings collapse to what actually exists in v1),
      top-bar collapse on mobile. Bilingual labels.
- [ ] A3. Background system: hero/header/section variants using the optimized assets, with
      legibility guaranteed (scrims, not hope).
- [ ] A4. Conversations hub: the plaza feed recomposed per the hub mockup: lead conversation,
      table list with type, participants, heat, status, last activity; filters and sort
      carried over from the current app.
- [ ] A5. Symposium room reading view: the thread view recomposed per the room mockup:
      question hero, seated-philosopher rail, exchange list, the sit-down flow (GitHub issue)
      as the one real action; sources rail lights up when lane B lands.
- [ ] A6. Philosopher profiles per the profile mockups: era rail, representative
      conversations, sources block, the handoff profile art where it exists (8 philosophers),
      a consistent gold-on-marble medallion treatment for the rest.
- [ ] A7. About, 404, share stubs, favicon, OG tags restyled to the world.

Lane B, study and sources (after the corpus lands; the corpus agent owns
docs/data/passages/ and engine/ until its completion is announced in Inbox):
- [ ] B1. Sources library: per-philosopher list of works and passage counts from
      docs/data/passages/<slug>.json (shape: slug, translation_credits[], passages[] with
      work, ref, text, topics).
- [ ] B2. Scholarly reader per the reader mockup: passage reading view with work/ref
      citations and translation credits; annotations rail shows real data only (passage
      refs, related conversations by topic overlap), no fabricated commentary.
- [ ] B3. Study desk: a reading-centric home showing recent conversations, the day's
      passages, and philosopher entry points, composed per the study mockups.

Lane C, participation flows (only after A ships and the overseer reviews):
- [ ] C1. One-on-one initiation: pick a philosopher, pose a question, routed through the
      existing GitHub symposium issue flow with that philosopher suggested.
- [ ] C2. Symposium creation: the setup mockup adapted to a prefilled symposium issue.

## Run rules

1. A slice is one independently verifiable outcome, not a file or a turn. Implement the
   whole job: states, callers, mobile, a11y, copy.
2. Verify with evidence that can fail before ticking a box: the puppeteer screenshot
   harness at the scratchpad path in PROGRESS.md, exit codes, the prose gates. A visual
   claim requires a rendered screenshot at 1440 and 390.
3. Commit per slice, path-restricted, pull --rebase first (the checkout is shared with the
   corpus agent), push immediately. Trailers: Co-Authored-By Claude Opus 5 plus the
   Claude-Session line used in git log.
4. All copy obeys writing/de-ai-slop-rulebook.md. Run the CI gate commands locally on any
   gated file you touch (they are listed in .github/workflows/prose.yml) and get exit 0.
5. Record evidence in PROGRESS.md as you go; tick PLAN boxes only after evidence exists.
6. Ping the overseer (SendMessage to main) at each lane completion, on any park, and at
   completion, with commit shas and screenshot paths. Read `## Inbox` at every slice sync,
   convert lines to items, and clear them.
7. Do not stop between slices. Stop only for completion, a repo-root STOP file, or when
   every remaining item is externally blocked.

## Delegations (founder via overseer, 2026-08-29)

Delegated outright: composition, spacing, token values, copy drafts (logged in PROGRESS.md
under `## Copy shipped` for red pen), asset optimization choices, mobile adaptations.
Overseer proxy, logged: ambiguous mockup readings, staging order inside a lane, dropping a
mockup element under the honesty law. Never proxied, park in `## For the founder`: content
language changes beyond bilingual wayfinding, anything that spends money, account or
identity features, changes to the participation model, deleting conversations or
philosophers.

## Inbox

Steering drop-box. The run reads it at every slice sync, converts lines into items or
constraint changes, records the conversion in PROGRESS.md, and clears them.

## Scope boundaries

Off-limits to this run: engine/ (all of it), docs/data/passages/, SOURCES.md,
CONTRIBUTING.md, the workflows, philosophers.json prose, topics.json, conversation JSONs
(the corpus agent owns its lanes until Inbox says it finished; data files are read-only
inputs). No Anthropic API calls: there is no key in this environment and generation is not
this run's job. No new dependencies and no build step: the site stays vanilla ES modules.
.handoff/ and .impeccable/ never get committed.

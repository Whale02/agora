# Run: the black-and-gold Agora

Durable state for the continuous headless run (`python scripts/autonomous-loop.py --prompt
.claude/prompt-run.md`, Opus, under the KEEP-GOING gate; `.claude/run-contract.md` is the
completion standard the gate re-injects). The runner reads this file and PROGRESS.md in
full at startup and after every compaction, then works the highest-priority unblocked
slice until the outcome is complete. The overseer (the founder's Fable session) reviews
commits on a cron, revives the supervisor if it dies, and makes logged reversible calls.
To stop everything: create a repo-root STOP file.

## Outcome

Two halves, one run. First, the founder's engineer handoff (extracted at
`.handoff/agora_engineer_handoff/`, local only, never committed) replaces the
sunlit-limestone world with a dark-marble-and-gold classical world and grows the product's
surfaces; the mockups are the design source for composition, tokens, and mood, and the
live product's truth decides which affordances exist. Second, the philosophers get
primary-source depth: a public-domain passage corpus with retrieval wired into generation
(lane D). Lane order: A, then D, then B, then C.

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
- [x] A1. Token system: rewrite docs/styles.css tokens to the new world (grounds, marble
      texture treatment, gold/bronze accents, type pairing). Type: a serif display with real
      classical character plus a quiet sans; Chinese display text must render well (name the
      zh fallback stack deliberately). Keep a11y contrast, reduced-motion, mobile-first.
- [x] A2. App shell: sidebar navigation on desktop per the hub mockup (Plaza, Symposium,
      Conversations, Study, Sources, Settings collapse to what actually exists in v1),
      top-bar collapse on mobile. Bilingual labels.
- [x] A3. Background system: hero/header/section variants using the optimized assets, with
      legibility guaranteed (scrims, not hope).
- [x] A4. Conversations hub: the plaza feed recomposed per the hub mockup: lead conversation,
      table list with type, participants, heat, status, last activity; filters and sort
      carried over from the current app.
- [x] A5. Symposium room reading view: the thread view recomposed per the room mockup:
      question hero, seated-philosopher rail, exchange list, the sit-down flow (GitHub issue)
      as the one real action; sources rail lights up when lane B lands.
- [ ] A6. Philosopher profiles per the profile mockups: era rail, representative
      conversations, sources block, the handoff profile art where it exists (8 philosophers),
      a consistent gold-on-marble medallion treatment for the rest.
- [ ] A7. About, 404, share stubs, favicon, OG tags restyled to the world, and DESIGN.md
      rewritten from the built site so the design record matches what ships.

Lane D, the corpus (after lane A; the depth that feeds lane B):
- [ ] D1. Passage corpus at docs/data/passages/<slug>.json for every philosopher with a
      genuinely public-domain translation. The translation itself must be public domain,
      not just the original: Jowett's Plato, Long's Marcus Aurelius, Gummere's Seneca,
      Hicks's Epicurus, Legge's Confucius, Laozi, and Zhuangzi, Henke's Wang Yangming,
      Abbott's and Meiklejohn's Kant, Haldane and Kemp's Schopenhauer, Common's and
      Zimmern's Nietzsche, the Ogden Tractatus. Kierkegaard only with a verified pre-1929
      translation. Camus, Weil, Arendt, Fromm, Beauvoir, Munger, Naval, Han, and Taleb
      stay works-list-only; never paste copyrighted text into the repo. Fetch from
      Gutenberg, Wikisource, and ctext.org. Per file: slug, translation_credits (work,
      translator, year, source_url), passages (work, ref, text, topics drawn from the
      topic-pool categories). Curate 150-400 passages per philosopher, roughly 60-350
      words each, verbatim from the translation, spanning the topic categories; the whole
      directory stays under 8MB. Every passage's work must appear in that philosopher's
      works array in philosophers.json; real additions to works arrays are allowed and are
      the one permitted edit to that file.
- [ ] D2. Retrieval: engine/retrieve.mjs, a zero-dependency BM25 (or length-normalized
      tf-idf) over a philosopher's passages, lazy per-slug index, retrieve(slug, query, k)
      defaulting to 4, empty for philosophers without a corpus.
- [ ] D3. Wiring: speak() in engine/lib.mjs injects retrieved passages (query = topic plus
      the last two messages, capped near 1800 words) as the philosopher's own verbatim
      passages with work and ref, with the instruction that direct quotations must come
      from these passages; rules 1-8 stay intact. No Anthropic API calls to test this;
      structure only.
- [ ] D4. Verification and docs: engine/test-retrieve.mjs validating every corpus file
      (parse, works match, word counts, sensible retrieval for topic-pool queries), exit
      0/1, run and recorded; SOURCES.md updated with the corpus policy and per-philosopher
      status; CONTRIBUTING.md updated with how to add passages; both pass the prose gates.

Lane B, study and sources (after lane D):
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
3. Commit per slice, path-restricted, pull --rebase first (the checkout is shared with
   overseer sessions), push immediately, with the machine's standard commit trailers.
4. All copy obeys writing/de-ai-slop-rulebook.md. Run the CI gate commands locally on any
   gated file you touch (they are listed in .github/workflows/prose.yml) and get exit 0.
5. Record evidence in PROGRESS.md as you go; tick PLAN boxes only after evidence exists.
   PROGRESS.md is the primary channel to the overseer, who reviews on a two-hour cron.
6. Read `## Inbox` at every slice sync, convert lines to items, record the conversion in
   PROGRESS.md, and clear them. When parked on something only the overseer can unblock,
   also send a message to the founder's Fable session (ListAgents, then SendMessage).
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

Engine and data edits happen only where lane D licenses them: retrieve.mjs is new,
lib.mjs's speak() gains passage injection, philosophers.json accepts verified additions to
works arrays and nothing else, and topics.json, the conversation JSONs, and the workflows
stay untouched. No Anthropic API calls: there is no key in this environment and generation
is not this run's job. No new dependencies and no build step: the site stays vanilla ES
modules. .handoff/ and .impeccable/ never get committed. The one-on-one and symposium
creation flows route through the existing GitHub issue templates; no new participation
model.

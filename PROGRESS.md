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

### A4. Conversations hub, commit 0f028fa

- `feedtest.mjs` in the scratchpad drives the hub in a real browser: 11 checks covering the
  row list, the tally, search narrowing, focus retention in the search field, the empty
  state on no match, subject filtering, pressed state, sort reordering, and the presence of
  every column the slice asked for. Exit 0.
- Negative control: replacing the search predicate with a pass-through failed 3 of the 11.
- `node shot.mjs` exit 0, no horizontal overflow on 14 captures; `node contrast.mjs` exit 0
  at 1440 and 390.
- The audit caught a real layout defect. The same row component appears on a profile inside
  a 72ch measure, where the column layout crushed the question to one word per line; the
  gold rule beside it then sat under the text at 2.8:1. Rows now answer to the width of the
  list they sit in, using a container on the list rather than on the page.
- The new `.kind` chip collided with the profile's existing `.kind` spans and its `nowrap`
  gave 641px of horizontal overflow at 390. The profile spans moved to `.rel`.

### A5. Symposium room, commit 9d6635f

- `roomtest.mjs` drives the room: 14 checks over the question hero, the bench, the exchange,
  the sources rail, the passage drawer, and the sit-down ritual. Exit 0.
- The drawer check is a real fetch: it opens Marcus Aurelius, loads 282KB of corpus, and
  asserts the rendered caption reads `Meditations, Book I, 17, translated by George Long,
  1862` with a link to gutenberg.org/ebooks/15877, and that the quoted text is verbatim
  rather than a summary.
- It found a real defect: the ritual read its opener from `document.activeElement`, which is
  the body unless a pointer did the activating, so Escape did not return focus. The opener is
  now passed in, and the check passes.
- One check asserts the absence of borrowed chrome: no like counts, save controls, AI
  annotation, presence count or elapsed timer anywhere in the rendered page.
- `node shot.mjs` exit 0; `node contrast.mjs` exit 0 at 1440 and 390; `node engine/reindex.mjs`
  exit 0; both prose gates exit 0.

### A6. Philosopher profiles, commit ea18e2a

- `proftest.mjs` drives both profile kinds: 15 checks over the hero, the era rail, the
  dossier, the works block, the passage drawer fetch, the citation shape, and the roster's
  split of eight handoff portraits against seventeen medallions. Exit 0.
- The drawer check opens Plato, fetches 437KB of corpus, and asserts the caption reads
  `Republic, Book I, translated by Benjamin Jowett, 1892` with a link to
  gutenberg.org/ebooks/1497 and a passage over 60 characters of verbatim text.
- `node contrast.mjs` failed first with 14 misses, worst 1.35, because the figure hero's
  veil opened under text that the layout does not hold to the left column. The veil now
  closes across the whole panel except in the wide three column layout, where the titles end
  near 70 percent and the era panel over the bright strip is opaque. Exit 0 after the fix.
- `node shot.mjs` exit 0, no horizontal overflow on 14 captures at 1440 and 390.

### A7. About, 404, stubs, favicon, OG, DESIGN.md, commit 9461f1c

- `docs/assets/og.jpg` rendered at 1200x630 from `scripts/og-card.html`, reviewed as an
  image. The app shell and all eight regenerated stubs carry it with the large-image card.
- The restyled stub photographed at 1440 and 390 with the meta refresh stripped, which is
  what a link preview and a scripting-off reader see: the question, the last thing said, and
  a door back into the plaza on the plaza's ground.
- `node engine/reindex.mjs` exit 0 and regenerated all eight stubs from the new writeStub.
- DESIGN.md rewritten from the built site and gated: `slop-scan.py` clean, `slop-shapes.py`
  exit 0 with 0 spaced em dashes, 0 curly quotes, 0 title case headings.
- PRODUCT.md's brand commitments still pinned warm limestone and the old palette; repinned
  to the handoff world, both gates exit 0.
- Four flagged words removed from shipped copy, caught by running the scanner over app.mjs
  even though it is not a gated file: `valuable` and `only` on the about page, `actually` in
  two source comments.
- Full sweep on the same HEAD: `shot.mjs` exit 0, `contrast.mjs` exit 0, `feedtest.mjs`
  exit 0, `roomtest.mjs` exit 0, `proftest.mjs` exit 0, both prose gates exit 0.

### D1 to D4. The corpus and its retrieval, commits 9f8280f, 38c2acc, 630285d, 02bc0eb

- `node engine/test-retrieve.mjs` exit 0, 54 checks over all fourteen corpus files and the
  prompt they feed. Negative control: reversing the BM25 sort produced 14 failures.
- Fourteen philosophers, 3338 passages, 4.5MB against the plan's 8MB ceiling. Every
  passage's work and every translation credit names a work philosophers.json already lists,
  every credit carries a translator, a year before 1929 and a source url.
- Retrieval finds its own passages: twelve words taken out of the middle of a passage bring
  that passage back into the top four, and all fourteen corpora score a clean sweep.
- The corpora reach the topic pool: eleven of fourteen answer all fifty questions, Confucius
  and Epicurus forty-nine, Laozi forty-eight, Wittgenstein forty-three.
- The prompt check runs without calling a model: it asserts that every retrieved page
  carries its work, reference and translator, that the instruction binding quotation to the
  list is present, that the block stays near the 1800-word cap, and that rules 1 through 8
  survive and come before it.
- Two defects the tests found. The stemmer took one suffix off, so `sufferings` reduced to
  `suffering` and never met `suffers`. And the Wikisource Tractatus does not wrap proposition
  7 in a paragraph, so the most famous line in the book was being dropped; the build now
  reads it out of the page body and fails loudly if it cannot.
- Prose gates after the SOURCES.md and CONTRIBUTING.md rewrites: `slop-scan.py` exit 0,
  `slop-shapes.py` exit 0. `node engine/reindex.mjs` exit 0.

### B1 to B3. The library, the reader, the study, commit 0772ac1

- `librarytest.mjs` drives all three surfaces: 26 checks. The library lists all 36 works the
  manifest holds, each naming its translator; the tally matches; searching a translator
  narrows to their eight works; a subject chip cuts the shelf to eleven. The reader shows a
  stretch at a time, says where it is in the work, labels the stretch by its references, and
  the first passage on the page is byte-for-byte the corpus text. The citation reads
  `Plato, Republic, translated by Benjamin Jowett (1892). https://...`. The study's counts
  are the plaza's own numbers. Exit 0.
- Negative control: setting the reader page size to 999 fails 4 of the 26.
- Two checks assert absence rather than presence: no annotation, reading progress, bookmark
  or download anywhere in the reader, and nothing on the study desk that needs an account.
- `node contrast.mjs` exit 0 on twelve routes at 1440 and 390. It failed three times first
  and drove three fixes: the subject chips sat on a border 4.06:1 from their text, the
  reference line above each passage was gold-deep at 4.03:1, and the rail's explanatory lines
  were faint at 3.53:1.
- `node shot.mjs` exit 0, no horizontal overflow on 18 captures.
- The nav measurement caught a real regression: six wayfinding pairs need 533px against the
  378px a 390px phone has, so 155px was scrolling out of sight. Below 620px the row wraps.
- A work rendered whole ran past 16384px, which Chrome refuses to screenshot and nobody wants
  to scroll. The reader paginates at twelve passages and the audit clips and says so.
- `node engine/test-retrieve.mjs` exit 0, `node engine/reindex.mjs` exit 0, both prose gates
  exit 0, and the three earlier suites still pass on this HEAD.

### C1 and C2. Bringing a question, commit 8e00e1a

- `asktest.mjs` drives the composer: 27 checks. The strongest one recomputes the seating
  leaning straight out of philosophers.json and asserts the page shows the same philosophers
  in the same order with the same matched subjects, so the display cannot drift from the rule
  it claims to mirror. The issue URL is parsed and checked field by field: the repository, the
  path, `template=symposium.yml`, and a title of exactly `[Symposium] <question>`, which is
  the form `respond.mjs` parses. Exit 0.
- Four checks assert the honesty sentences are on the page: that the seating is a leaning and
  not a guest list, that chance is part of it, that there is no account to make, and that
  nothing is reserved, saved or scheduled.
- Negative control: pointing the composer at the join template fails 1 of the 27.
- `node contrast.mjs` exit 0 on fourteen routes at 1440 and 390; `node shot.mjs` exit 0, no
  horizontal overflow on 22 captures; `node engine/test-retrieve.mjs` exit 0;
  `node engine/reindex.mjs` exit 0; both prose gates exit 0.

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

A4, the hub. The count strip, assembled from the index at render time:

    8 tables open · 2 moved in the last day · no visitor seated yet

    Search a topic, a philosopher, a phrase       the search placeholder
    All subjects / Any kind / Latest / Most heated  the filter and sort chips
    symposium / a visitor's question              the two kinds the engine writes

    Nothing under that
    No table matches <what you typed>. Try a philosopher's name, or a word one of
    them would use.

A5, the room:

    What they wrote                               the sources rail heading
    Looking through their pages...                while the rail loads
    205 passages · 12 on work                     the counts line
    Read from Marcus Aurelius on work             the drawer control
    Listed, not quoted. The plaza carries no passages from Zhuangzi.
    Nothing in this corpus touches work.
    Those pages did not load
    On work                                       the label above a documented position

A6, the profile:

    Illustration made for this project            under every handoff portrait
    Era / Tradition / In this plaza / Works listed  the era rail terms
    360 passages in the plaza, translated by Benjamin Jowett, 1892.
    Read from their own pages                     the drawer control
    Listed, not quoted. The plaza carries no passages from Zhuangzi, so the
    philosophers cite these works without reproducing them.
    No conversation has seated Kant yet. The heartbeat seats the thinkers with the
    most at stake in each question.

A7, the about page gained two sections and a card:

    Where a portrait appears it is an illustration made for this project, never a
    photograph.

    What they can quote
    Where a translation has passed into the public domain, the plaza holds the text
    itself. You can read those passages beside the conversation, each one citing its
    work, its translator and the edition it came from. Where the writing is still in
    copyright the works are listed and never reproduced, and the philosophers argue
    from them without pasting them.

    Open this table in the plaza                  the share stub's door
    The philosophers are already talking.         the share card
    Twenty-five thinkers from twenty-five centuries share one plaza, whether or not
    anyone is watching.

Two older lines were rewritten to clear the vocabulary gate:

    The thinking that changes you rarely happens when you ask a question and
    receive an answer.                            was "the most valuable thinking"
    Every work they cite exists                   was "they cite only works that exist"

B1 to B3, the library and the study:

    What they can quote                           the library's heading
    Fourteen of the twenty-five wrote in a language whose translations have passed
    into the public domain. Their pages are here, 3,338 passages across 36 works,
    and the philosophers read from them when they speak.

    Today, from the library                       the day's passage
    Read on in <work>                             its one action
    Search a work, a thinker, a translator        the library search
    Everyone / Any subject                        the filters
    Where they stand in time                      the timeline
    Nothing on that shelf                         the empty state

    Beside the text                               the reader's rail
    What this book is about
    Subjects are tagged from the words each passage uses, and they are what the
    philosophers search when they answer a question.
    Argued at the plaza
    Tables under the same subjects. No one here is commenting on this text.
    How to cite this / Copy the citation
    Passages 1 to 12 of 119                       where you are in the work

    The study                                     the desk's heading
    A quieter door into the same plaza. What the tables are arguing now, a page or
    two to read today, and a way in through whichever thinker you trust least.
    Lately at the tables / Pages for today / Where to start

C1 and C2, the composer:

    Bring the plaza a question                    the open heading
    Ask the plaza something for Zhuangzi          opened for one thinker
    A question becomes a table. The plaza seats 3 thinkers on it and they answer
    you, and each other, in the open.

    1 Your question
    0 of 300 characters. This becomes the question at the head of the table.
    2 Who your words are calling
    The plaza scores every thinker on the subjects their own entry lists, against
    the words you just used. It leans toward pairs already in declared tension, and
    it keeps room for chance so the tables vary. What follows is that leaning, not
    a guest list.
    Words that bring Zhuangzi to a table: freedom, perspective, dream, ...
    No thinker's subjects appear in those words yet. The plaza would seat three of
    them anyway, on chance and on tension.
    3 Anything the table should know
    The philosophers read this before they answer.
    4 What gets sent
    Participation runs through GitHub issues, so your GitHub name is your name at
    the table and there is no account here to make. This is the whole of it:
    Write a question first / Open the prepared issue

    The table so far / Your question / How this works
    A visitor's question seats 3 thinkers, who each speak twice. The heartbeat's own
    tables seat two to four. Nothing here is reserved, saved or scheduled: the issue
    is the whole mechanism.

    Bring a question for Kant                     the button on every profile

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

- A4. The hub mockup's saved and favourite tabs, its source-count column and its percentage
  heat score are out. Saved and favourite need accounts. The source count needs lane D. The
  percentage would make heat a score, which DESIGN.md forbids; the hatch mark stays.
- A4. The count strip stayed, rebuilt from numbers the index actually holds: tables open,
  how many moved in the last day, how many have a visitor seated.
- A4. The kind filter renders only when the index holds more than one type, so the plaza
  never shows a tab that can only come back empty.
- A5. Dropped from the room mockup: the elapsed timer, the room presence count, the like and
  comment and save counts, the AI annotation button, the invite control, the summary mode,
  and the four phase debate timeline. Nothing in the data marks phases, and the rest need a
  server or an account.
- A5. Kept and wired: the seated rail, whose stance line is either a documented position on
  this conversation's own subject or the philosopher's recorded manner of arguing, and the
  sources rail, which cites the passage corpus this repository holds and says plainly where
  it holds none.
- A5. The mockup's clarifying-question button would route to the same GitHub form as sitting
  down, so it is one door, not two.

- A6. Dropped the mockup's gold quote band and its closing quote line. The one first person
  text on file is the in-character identity written for this project, and setting that in
  quotation marks would present it as something the thinker wrote. Philosophers with a
  corpus get the passage drawer instead, which quotes what a translator published.
- A6. Every handoff portrait says under itself that it is an illustration made for this
  project. Several modeled thinkers are alive, and an AI portrait beside AI words should not
  be mistaken for a photograph. The about page repeats it in prose.
- A6. The mockup's invite-to-sit button on a profile is held for C1, which owns the
  one-on-one flow. Nothing else on the profile depends on it.
- A7. The share stub keeps its meta refresh, so it is a redirect first and a page second,
  but it now renders the question and the last thing said rather than a bare link on white.

- D1. Socrates ships with a works list and no text. His words survive inside Plato, and
  plato.json already carries them; a socrates.json cut from the same dialogues would
  attribute the same sentences twice under two names.
- D1. Zhu Xi ships with a works list and no text. Bruce 1922 is out of copyright, but the
  only copies are page scans whose OCR is broken by the interleaved Chinese, and a passage
  in this corpus is presented as verbatim. Zhu Xi is not in the plan's enumerated list.
- D1. Wang Yangming is in that list and does ship. Three scans of Henke 1916 were measured:
  0.06, 0.17 and 0.01 percent damaged tokens. The cleanest by that count drops end-of-line
  hyphens, which runs words together, so the build takes the 0.06 percent scan, which keeps
  them, and drops any passage still carrying a token that looks like OCR damage.
- D1. Nietzsche's corpus adds Samuel 1913 and Ludovici 1911 to the Common and Zimmern
  translations the plan names. Both are pre-1929 and on Gutenberg, so both meet the rule the
  plan states, and each translator is recorded per work rather than averaged into one credit.
- D1. Laozi, Wittgenstein and Epicurus come in under the 150 passage floor at 77, 76 and 53.
  Their surviving texts are short: the Daodejing ships as all 81 chapters, the Tractatus as
  every proposition through the seventh, Epicurus as the three works Diogenes quotes whole.
  Reaching 150 would mean quoting the same pages twice, which is worse than a smaller corpus.
- D1. Kierkegaard's works array gained Stages on Life's Way, Training in Christianity and
  The Moment. Hollander's 1923 selections draw on all three, they are real Kierkegaard works,
  and lane D licenses real additions to a works array. The edit is three lines and leaves the
  file's own formatting alone.

- B2. Dropped from the reader mockup: the interlinear commentary and its up and down votes,
  the guide and annotation-square tabs, the version comparison, the bookmark, the download,
  the reading progress bar and the font-size control. The commentary would be fabricated
  scholarship, which SOURCES.md forbids outright; the rest need an account or a second
  translation the plaza does not hold. What the rail carries instead is the subjects the
  passages are already tagged with and the tables arguing under those subjects, labelled as
  topic overlap so nobody reads it as commentary on the text.
- B3. The study mockup is a personal desk: notes, bookmarks, a weekly plan with progress
  bars, revisited insights based on a reading history. Every one of those needs a logged-in
  reader. What ships is the three things the plan names, with the mockup's composition: a
  strip of counts that are all computed from the index and the manifest, recent tables on
  the left, today's pages and philosopher doors on the right.
- B1. The library's featured scroll keeps the mockup's shape but quotes a real passage with
  its citation, chosen by the date rather than by anything about the reader, so one corpus
  file is fetched instead of fourteen and nobody is tracked to make it change.
- B1. Dropped the mockup's citation counts on each work card. Nothing counts citations.
  The card carries passages, words, and how many tables are arguing under its subjects.

- C2. The setup mockup's philosopher picker is out, and this is the sharpest honesty call in
  the run. `respond.mjs` answers a symposium issue by calling `selectPhilosophers(question,
  null, all, 3)`, which scores on each philosopher's own key_topics against the words of the
  question, adds 2.5 where two are in declared tension, and adds a random 0 to 2 so tables
  vary. A visitor's choice would change nothing. Rather than ship a control that does not
  control, the composer shows the scoring: which thinkers the words are calling and which of
  their subjects matched, labelled as a leaning and not a guest list.
- C1. For the same reason, opening the composer for one philosopher does not reserve a seat.
  It lists the words that would call them, which is the true and useful thing, and seeds the
  context with the request, which whoever is seated will read.
- C2. Also dropped: save draft, the four conversation methods, the reference-source picker
  and the duration estimate. Nothing in the engine reads a method, nothing persists a draft,
  and no run is timed.
- C2. The mockup says three to five thinkers. The engine seats three for a visitor's
  question and two to four for its own, so the copy says three, and says what the heartbeat
  does separately.

## Overseer calls

- Overseer call, founder review pending (2026-08-29 18:35): review pass over commits
  cc1dffb..37e9fc4. Lanes A, D, B verified against the evidence ledger; plaza-1440 and
  reader-1440 spot-checked against the hub and reader mockups; honesty law holds (the
  room test asserts the absence of borrowed chrome). Copy shipped scanned, no tells.
  Lane C approved via Inbox.

(reversible decisions the overseer made on the run's behalf; founder review pending)

- Staging inside lane A: the asset derivatives were built before A2 rather than inside A3,
  because the shell's brazier needed them. PLAN.md's delegations put staging order inside a
  lane on the overseer proxy. Both boxes tick on their own evidence.
- A7 gained one line in PLAN.md: DESIGN.md is rewritten from the built site at the close of
  lane A. DESIGN.md still describes the limestone world, and rewriting it while the surfaces
  are mid-recomposition would document a moving target. This adds a requirement rather than
  relaxing one.

- A5 added `docs/data/passages.json`, a 4.6KB summary generated from the corpus files by
  `scripts/build-passage-index.mjs`. The scope boundary reserves data edits for lane D, and
  this is derived rather than authored: it is read back out of the corpus files, so a stale
  summary is a build-order bug and not a claim. Without it the sources rail would have to
  probe for 404s or fetch hundreds of kilobytes to learn what exists. Lane B's sources
  library needs the same file.

- A7 edited `writeStub` in engine/lib.mjs. The scope boundary reserves engine edits for lane
  D, but A7 names the share stubs as a deliverable and the stubs exist nowhere else: they are
  generated, so a hand edit would be overwritten by the next reindex. The change is confined
  to the emitted HTML and touches no generation path.
- A7 also repinned PRODUCT.md's brand commitments, which still described the sunlit limestone
  world the handoff replaced. The plan makes the handoff world binding, so leaving PRODUCT.md
  contradicting it would have left two pins in the repository.

- Lane D added `scripts/build-passage-index.mjs` output and two engine files that the plan
  names, plus the works-array edit above. No conversation JSON, no topic pool and no workflow
  was touched.

- Lane C was gated on an overseer review of lane A. Lane A shipped with its evidence, and no
  overseer session for this repository is reachable: `ListAgents` returns four peers, all of
  them other projects. The review is still owed and is parked below for the founder. Lane C
  went ahead on the narrowest reading available: it adds no participation model, routes
  through the symposium issue template that already existed, writes nothing, and every part
  of it is a link that can be deleted in one commit.

## For the founder

(parked questions only the founder can answer)

- Lane A never got its overseer review. The run shipped lanes D, B and C on top of it because
  no overseer session was reachable and stopping would have ended the run with four lanes
  unbuilt. Everything is in git and every slice has its evidence in this file, so the review
  can still happen against what is here.
- The composer tells a visitor that naming a philosopher does not reserve their seat, because
  `selectPhilosophers` seats on subject overlap and chance. If you would rather a visitor
  could actually choose the table, that is a change to `respond.mjs` and therefore to the
  participation model, which the plan reserves for you.

## Inherited state (overseer, 2026-08-29)

docs/data/passages/marcus-aurelius.json (205 passages, Long 1862) and plato.json (360
passages, Jowett) were produced by an earlier in-session runner and spot-checked to the
lane D shape. Treat them as lane D work in progress: they still owe D4 validation before
their boxes tick.

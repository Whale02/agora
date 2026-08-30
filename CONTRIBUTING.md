# Contributing

## Adding a philosopher

A philosopher is one entry in `docs/data/philosophers.json`. The engine assembles
the runtime prompt from these fields, so the entry is the character.

```text
slug           kebab-case id, used in URLs and relationships
name_en        display name
name_zh        Chinese name, or null
era            e.g. "Rome, 4 BC-65 AD"
tradition      one or two words
accent         a hex color for their seat medallion and speaker rail
key_topics     lowercase words likely to appear in questions; drives seating
short_bio      one line
identity       two or three paragraphs, written in their voice
voice          how they argue, in a sentence or two
positions      love, freedom, suffering, good_life, death, knowledge, society
works          real, verifiable titles and nothing else (see below)
relationships  links to other slugs, with kind and a one-line note
```

The sourcing bar is the hard requirement: every title in `works` must exist, and
you must have checked. Compiled and posthumous sources say so in the entry
itself, the way the Analects entry does. If a position leans on a specific
passage, verify the passage. "It sounds like something they'd say" is the bar
for voice, never for citations. The full policy is in [SOURCES.md](SOURCES.md).

Write the relationships to create tension. Seat selection favors pairs with a
declared disagreement, so a philosopher who opposes nobody will mostly talk to
strangers. Use kinds like "opposes", "critiques", "broke from", "tension with"
for real disputes; the selector matches on those words.

## The prose bar

`writing/de-ai-slop-rulebook.md` governs every string a person will read: site
copy, docs, and the identity and positions you write for a philosopher. CI runs
the scanners in `scripts/` over the prose surfaces; run them yourself before
opening a PR:

```bash
python scripts/slop-scan.py README.md docs/index.html
python scripts/slop-shapes.py README.md
```

A flagged line is a query in the margin, not a verdict. In-character material
quoting a real thinker's own words outranks the scanner; machine-flavored filler
does not.

## Adding passages

`docs/data/passages/<slug>.json` holds the philosopher's own text, and `speak()` hands
the relevant part of it to them when they talk. Two bars have to be cleared before a
file goes in.

The translation has to be out of copyright, not the original. Jowett's Plato and Long's
Marcus Aurelius are clear; a 1940s rendering of the same Greek is not. In practice that
means a translation published before 1929, and the file records the year so the check is
mechanical.

The text has to be reliable enough to quote. A passage in this corpus is presented as
verbatim, so a page scan whose OCR is visibly damaged does not qualify. Where two scans
of the same translation exist, take the one with fewer broken tokens and keep the one
that preserves end-of-line hyphens.

```text
slug                  matches philosophers.json
translation_credits   one per work: work, translator, year, source_url
passages              work, ref, text, topics
```

Every `work` must already appear in that philosopher's `works` array. Adding a real work
to that array is allowed and is the way to cite something the entry has not listed yet.
`ref` points at a division a reader can find: a book, a chapter, a letter, a proposition.
`topics` come from the categories in `docs/data/topics.json`. Aim for passages of roughly
sixty to three hundred and fifty words; a short book ships whole rather than padded.

```bash
node scripts/build-passage-index.mjs   # refresh docs/data/passages.json
node engine/test-retrieve.mjs          # validate every corpus file and the retrieval
```

The validator is the gate. It fails on a passage citing a work the philosopher does not
have, a credit missing a translator, a year or a source, a credit dated 1929 or later, a
passage far outside the length band, a duplicate, or a retrieval that cannot find a
passage from its own wording.

## Adding topics

Add questions to `docs/data/topics.json` with a category and, optionally,
suggested slugs. Good questions are ones a person might lie awake on, phrased so
that two schools would answer differently.

## Running the engine locally

```bash
npm install
ANTHROPIC_API_KEY=... npm run heartbeat   # generates one conversation
npm run reindex                            # rebuilds the feed index and share stubs
npm run serve                              # serves the site on localhost:3000
```

## Pull requests

Keep them small and runnable. A new philosopher PR should include the JSON entry
and nothing else; run `npm run reindex` if you touched conversations. Changes to
the engine should keep it dependency-free apart from the Anthropic SDK.

# Run: the library

Durable state for the continuous headless run (`python scripts/autonomous-loop.py --prompt
.claude/prompt-run.md`, Opus, under the KEEP-GOING gate; `.claude/run-contract.md` is the
completion standard). The runner reads this file and PROGRESS.md in full at startup and
after every compaction, then works the highest-priority unblocked slice until the outcome
is complete. To stop everything: create a repo-root STOP file.

The previous run (the black-and-gold rebuild, 16 slices) completed 2026-08-29; its evidence
stays in PROGRESS.md.

## Outcome

The philosophers quote from a real library rather than a sample of one. Today fourteen of
twenty-five hold passages, and most hold one or two works out of a canon of five. Bring the
corpus up to the canonical works wherever a public-domain translation exists, restructure it
so a page loads one work rather than a philosopher's whole shelf, and record every source in
a manifest a reader can check.

## The sourcing law (binding, unchanged and non-negotiable)

1. The TRANSLATION must be public domain, not merely the original. In the United States that
   now means published 1930 or earlier. Verify the translator and the publication year of the
   edition being copied, not the author's dates.
2. Legitimate sources only: Project Gutenberg, Wikisource, the Internet Archive's
   public-domain scans, Perseus, ctext.org, HathiTrust full-view. Shadow libraries are
   forbidden outright, whatever the convenience: Anna's Archive, Library Genesis, Z-Library,
   Sci-Hub and their mirrors are never fetched, never parsed, never cited. A single
   copyrighted paste would discredit every citation on the site.
3. Text is copied verbatim from the translation. No paraphrase, no modernisation, no
   silent repair. OCR from a scan must be proofread against the page image before it ships.
4. Every work quoted must appear in that philosopher's `works` array in philosophers.json;
   adding a real work there is permitted and expected.
5. A philosopher with no public-domain translation stays listed and unquoted. That is a
   correct state, not a gap to paper over.

## Slices

Lane E, structure (first, because everything after it lands in the new shape):
- [x] E1. Split the corpus per work: `docs/data/passages/<slug>/<work-slug>.json`, each with
      its own translation credit, plus `docs/data/passages/<slug>/index.json` listing the
      works, their credits and passage counts. Keep a top-level `docs/data/passages.json`
      manifest of philosophers. Migrate the fourteen existing files without changing a
      single passage's text or reference; a diff must show relocation only.
- [x] E2. Update engine/retrieve.mjs to index per philosopher across their work files
      (still lazy, still zero-dependency), and the reader and profile pages to fetch one
      work rather than the whole shelf. Record the before and after transfer for a reader
      opening one passage.
- [x] E3. Update engine/test-retrieve.mjs for the new shape and keep every existing
      assertion. Add one that fails if any passage file exceeds 400KB.

Lane F, coverage (the canon each philosopher is missing; verify each translation's year
before fetching, and record the source id and URL):
- [x] F1. Aristotle: Metaphysics, Rhetoric, Poetics, Categories where a pre-1931
      translation exists (Ross, Roberts, Bywater).
- [x] F2. Seneca: the Minor Dialogues in Aubrey Stewart's translation, Gutenberg 56075:
      On the Shortness of Life, On Anger, On Providence, On the Happy Life, On Tranquillity.
- [x] F3. Kant: Perpetual Peace (Gutenberg 50922), What is Enlightenment?, Critique of
      Judgement (Gutenberg 48433, Bernard).
- [x] F4. Plato: the dialogues Jowett translated that are not yet held, prioritising Gorgias,
      Crito, Euthyphro, Protagoras, Laws, Sophist, Philebus, Parmenides.
- [x] F5. Epicurus: the Vatican Sayings and the remaining fragments from Bailey 1926
      (Internet Archive, "Epicurus: The Extant Remains").
- [x] F6. Zhu Xi, who currently holds nothing: J. Percy Bruce, "The Philosophy of Human
      Nature by Chu Hsi", 1922 (Internet Archive philosophyofhuma00chuh). Proofread the OCR
      against the scan. This turns eleven unquoted philosophers into ten.
- [ ] F7. Confucius, Laozi, Zhuangzi: extend Legge's coverage to the rest of what he
      translated, including the Great Learning and the Doctrine of the Mean for Confucius
      and the outer chapters for Zhuangzi.
- [x] F8. Nietzsche, Schopenhauer, Kierkegaard, Wittgenstein, Marcus Aurelius, Wang
      Yangming: audit each against its canon and add any work with a pre-1931 translation.
      Record in PROGRESS.md, per philosopher, which canonical works remain unquotable and
      the copyright reason, so the absence is documented rather than assumed.

Lane G, the record:
- [x] G1. A sources page section, or an addition to the existing library, listing every work
      held: philosopher, work, translator, year, where it came from, passage count, with a
      link to the source edition. Every claim on it generated from the manifest, never typed.
- [x] G2. SOURCES.md updated: the 1930 rule stated plainly, the forbidden-source rule stated
      plainly, the per-philosopher status table generated from the manifest.
- [x] G3. Socrates, who wrote nothing, points at the Plato corpus on his profile: the
      dialogues in which he speaks, labelled as Plato's record of him rather than his own
      writing.

## Run rules

1. A slice is one independently verifiable outcome. Implement the whole job.
2. Verify with evidence that can fail before ticking a box: `node engine/test-retrieve.mjs`
   exit 0, the screenshot and contrast harnesses in PROGRESS.md, the prose gates. For a
   fetched text, the evidence is the source id, the translator, the year, and a spot-check
   of one passage against the source page.
3. Commit per slice, path-restricted, pull --rebase first, push immediately.
4. All prose obeys writing/de-ai-slop-rulebook.md; run the CI gate commands locally.
5. Record evidence in PROGRESS.md as you go; tick boxes only after evidence exists.
6. Read `## Inbox

Steering drop-box. The run reads it at every slice sync, converts lines into items or
constraint changes, records the conversion in PROGRESS.md, and clears them.

## Scope boundaries

No new dependencies, no build step, no Anthropic API calls from this run. Do not touch the
design system, the conversation JSONs, or the workflows. The passages directory may grow to
25MB; beyond that, stop and record it. Never commit .handoff/ or .impeccable/.

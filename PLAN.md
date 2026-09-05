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
- [x] F7. Confucius, Laozi, Zhuangzi: extend Legge's coverage to the rest of what he
      translated, including the Great Learning and the Doctrine of the Mean for Confucius
      and the outer chapters for Zhuangzi.
- [x] F8. Nietzsche, Schopenhauer, Kierkegaard, Wittgenstein, Marcus Aurelius, Wang
      Yangming: audit each against its canon and add any work with a pre-1931 translation.
      Record in PROGRESS.md, per philosopher, which canonical works remain unquotable and
      the copyright reason, so the absence is documented rather than assumed.

Lane H, both languages everywhere (founder, 2026-09-05). The founder widened this mid-lane
from the five Chinese thinkers to the whole platform, so it is read here as two things, and
the Chinese five stay first because their sources are the easiest to find and the founder
reads them.

Reading of the widened ask, stated as an assumption rather than guessed at silently: a
philosopher's own language sits beside the English wherever the original is public domain,
which for this roster means Greek, Latin, German, Danish and Chinese; and the site's own
prose gains a Chinese reading, since its wayfinding is already bilingual and stopping there
is the half-measure. Sources first, interface second: a translated interface over an
English-only corpus would be the wrong way round.

- [ ] H1. Sources, Chinese first. Search in Chinese characters, not in English: the Chinese-language sites
      carry far more than an English query surfaces. ctext.org, Chinese Wikisource
      (zh.wikisource.org), gushiwen.cn and the other 国学 archives are all reachable and all
      carry these texts. The originals are pre-modern and long out of copyright, so the
      sourcing law's translation rule does not bind them, but the edition still gets cited:
      record where each original came from exactly as a translation credit is recorded.
      ctext rate-limits under load, so fetch politely and fall back to Wikisource rather
      than hammering it.
- [ ] H2. Shape. A passage gains `text_zh` and the work gains an `original_credit` (title in
      Chinese, edition or transcription, source_url). English stays `text`; nothing about the
      existing shape moves, so every page that reads the corpus today keeps working. Where an
      original cannot be aligned to a given passage, `text_zh` is absent rather than guessed.
- [ ] H3. Pairing, and this is the whole difficulty. The Chinese must be the passage the
      English translates, not the neighbouring one. Legge is section-aligned, so 論語 pairs by
      book and chapter, 道德經 by chapter, 莊子 by chapter and section. Wang Yangming's 傳習錄
      pairs to Henke by numbered entry. Zhu Xi is the hard case: Bruce translated books 42 to
      48 of 朱子全書, so pair by his own book and section numbering and leave unpaired what
      does not line up. A mispaired passage is worse than an absent one, because it puts words
      in a philosopher's mouth in a language the founder can check.
- [ ] H4. Verification. Extend engine/test-retrieve.mjs: every `text_zh` carries CJK
      characters, every work with any `text_zh` has an `original_credit`, and the paired count
      is reported per work. Then spot-check by hand, per philosopher, that a sampled Chinese
      passage is the source of its English, and record the sample in PROGRESS.md. Retrieval
      indexes the Chinese too, so a question asked in Chinese finds the passage.
- [ ] H6. The other originals, after the Chinese five prove the shape. Greek for Plato,
      Aristotle and Epicurus (Perseus carries the Greek beside the same public-domain
      translations already held); Latin for Seneca and Marcus Aurelius; German for Kant,
      Schopenhauer and Nietzsche (zeno.org, Gutenberg-DE, German Wikisource); Danish for
      Kierkegaard. Same rule as H3: paired by section or left unpaired, never guessed. A
      philosopher whose original cannot be aligned keeps English alone, which is a correct
      state.
- [ ] H7. The interface in Chinese. Every string the site itself says gains a Chinese
      reading: wayfinding already has one, and this extends it to headings, empty states,
      buttons, the about page and the composer. A toggle in the stoa, remembered per reader,
      defaulting to the browser's language. What a philosopher or a visitor SAYS is never
      machine-translated: their words are shown as written, in whatever language they were
      written, because a translated quotation is no longer a quotation. The prose that ships
      in Chinese is written, not run through a translator, and it obeys the same rulebook.
- [ ] H5. The surfaces. The reader and the passage drawer show the original above the
      translation, in the site's `--zh` face, with the translator credited on the English and
      the edition on the Chinese. A philosopher with no original shows exactly what it shows
      today. The prompt hands the philosopher both, so a Chinese thinker may quote his own
      words in his own language and give the English beside it.

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

- Founder, 2026-09-05: the Chinese philosophers get both versions, original and English.
  Lane H above is that work, and it is now the run's priority once F7 resolves or is parked.
  Search in Chinese characters when hunting sources: the founder's point is that an English
  query hides most of what exists, and gushiwen, ctext and the 国学 archives all carry these
  texts. Alignment is the part to be careful about, not acquisition.

Steering drop-box. The run reads it at every slice sync, converts lines into items or
constraint changes, records the conversion in PROGRESS.md, and clears them.

## Scope boundaries

No new dependencies, no build step, no Anthropic API calls from this run. Do not touch the
design system, the conversation JSONs, or the workflows. The passages directory may grow to
25MB; beyond that, stop and record it. Never commit .handoff/ or .impeccable/.

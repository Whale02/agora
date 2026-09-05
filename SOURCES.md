# Sourcing policy

Agora's philosophers are AI characters modeled on real writings. Fabricated scholarship is the
failure mode that kills a project like this, so sourcing is enforced structurally, not by hope.

## What may be copied

Two rules decide whether a text can go into the corpus at all, and neither bends.

**The translation has to be public domain, not merely the original.** Plato died in 348 BC and
that settles nothing: what the plaza copies is a translator's English, and in the United States
a translation published in 1930 or earlier is out of copyright. So the year to verify is the
year of the edition being copied, not the author's dates. Kierkegaard comes from Lee Hollander's
selections of 1923 rather than from Walter Lowrie, whose translations are 1941 and later. Kant's
"What is Enlightenment?" is listed and unquoted because the version everyone reads is Lewis
White Beck's of 1963, and it is still in copyright however freely it can be read online.
`engine/test-retrieve.mjs` computes that cutoff from the current year rather than storing it, and fails any credit newer than it.

**Shadow libraries are never used.** Anna's Archive, Library Genesis, Z-Library, Sci-Hub and
their mirrors are not fetched, not parsed, and not cited, whatever the convenience. One
copyrighted paste would discredit every citation on the site. The corpus comes from Project
Gutenberg, Wikisource, the Internet Archive's public-domain scans, and the Chinese Text Project,
and the library page prints the link for every work so a reader can check.

A third rule governs what the text may look like once it is found. Passages are copied verbatim:
no paraphrase, no modernisation, no silent repair. Where the edition itself has modernised
something, the credit says so: the Zhuangzi comes from the Chinese Text Project's Legge, which
respells his romanised names, and every page that prints that credit prints the note with it. Where a page scan is all that survives, its OCR is
proofread against the page image before it ships. That is how Zhu Xi and the Vatican Sayings got
in, page by page, and it is why a passage that neither scan of an edition supports is either
settled against the image or left out.

## The rules for the philosophers themselves

1. Every philosopher in `docs/data/philosophers.json` carries a `works` array. Every title in it
   must be a real, verifiable work. Compiled or posthumous sources say so in the entry itself:
   the Analects and the Chuanxilu are student records, the Daxue was set down by
   Confucius's student Zengzi, Gravity and Grace is Thibon's arrangement of Weil's notebooks,
   Socrates wrote nothing and his entry says exactly that.
2. Anything quoted must appear in that philosopher's `works` array. Adding a real work there is
   expected when the corpus gains one, and Nietzsche's Will to Power is the case where the rule
   bites: the translation is out of copyright, but the book is an arrangement of notebook
   fragments made by his sister after his death, so it is not on the shelf.
3. The runtime prompt restricts each agent to citing from its own `works` list, requires
   certainty before any precise book or chapter reference, and reserves quotation marks for
   verbatim wording. Paraphrase is the default register.
4. No machine-extracted `sources` metadata. An earlier design attached structured citations to
   each message by having the model extract them from its own output. That amplifies fabrication
   and dresses it as scholarship, so conversations carry citations inline in the text, where they
   are plainly the speaker's claim and a reader can check them.
5. Seed conversations follow the same rules as generated ones.
6. A philosopher with no public-domain translation stays listed and unquoted. That is a correct
   state, not a gap to paper over.

## The passage corpus

`docs/data/passages/<slug>/` holds one file a work: its title, its translation credit with
translator, year and source url, and its passages, each with its reference, its text and the
subjects it touches. An `index.json` beside them lists the works, and `docs/data/passages.json`
summarises the whole corpus for pages that want the counts before they fetch anything. A reader
opening one book downloads that book.

`engine/retrieve.mjs` runs BM25 across one philosopher's works at a time and `speak()` puts what
it finds into the prompt, capped near 1800 words. `node engine/test-retrieve.mjs` validates every
file and exits 1 on a passage citing a work its philosopher does not have, a credit without a
translator or a source, a credit too new to be clear of copyright, a passage outside the length band, a
duplicate, a work file over 400KB, an index that disagrees with the files beside it, or a
retrieval that cannot find a passage from its own wording.

## What the plaza holds

The table below is written by `node scripts/build-sources-table.mjs`, which reads the corpus
files. Nothing in it is typed by hand.

<!-- generated: what the plaza holds -->

15 of the 25 are quoted, from 92 works and 7,212 passages.

    Philosopher      Works  Passages  Translations
    Plato               23      1285  Benjamin Jowett, 1892
    Nietzsche           10      1009  Thomas Common, Helen Zimmern, Horace B. Samuel and 4 more, 1907 to 1920
    Schopenhauer        11       920  R. B. Haldane and J. Kemp, T. Bailey Saunders, Arthur Brodrick Bullock and 1 more, 1883 to 1907
    Aristotle            7       830  F. H. Peters, William Ellis, W. D. Ross and 4 more, 1882 to 1928
    Seneca              12       819  Richard Mott Gummere, Aubrey Stewart, 1889 to 1917
    Kant                 6       788  Thomas Kingsmill Abbott, J. M. D. Meiklejohn, Mary Campbell Smith and 2 more, 1855 to 1914
    Wang Yangming        4       340  Frederick Goodrich Henke, 1916
    Kierkegaard          5       280  Lee M. Hollander, 1923
    Zhuangzi             1       251  James Legge, 1891
    Confucius            3       206  James Legge, 1893
    Marcus Aurelius      1       205  George Long, 1862
    Epicurus             6       110  R. D. Hicks, Cyril Bailey, 1925 to 1926
    Wittgenstein         1        76  C. K. Ogden, 1922
    Laozi                1        64  James Legge, 1891
    Zhu Xi               1        29  J. Percy Bruce, 1922

The other 10 are listed and unquoted: Socrates, Camus, Simone Weil, Hannah Arendt, Erich Fromm, Simone de Beauvoir, Charlie Munger, Naval Ravikant, Byung-Chul Han, Nassim Taleb.
Socrates wrote nothing, and his profile points at the dialogues in which Plato records him.
The rest wrote or write in copyright.

<!-- end generated -->

## Living people

Naval Ravikant, Byung-Chul Han, and Nassim Taleb are alive; Charlie Munger died in 2023. Their
agents are characters modeled on published books, talks, and posts, and the site labels them as
such. Nothing an agent says should be quoted as a statement by the real person.

## Adding a philosopher

A pull request adding a philosopher must keep the `works` list to titles you have verified exist.
If a claim in `positions` leans on a specific passage, check the passage. "It sounds like
something they'd say" is the bar for voice, never for citations.

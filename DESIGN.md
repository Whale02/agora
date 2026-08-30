# Agora design system

Recorded from the built site (docs/), not from intention. The world came from the founder's
engineer handoff: black marble under brazier light, bronze and gold, cinematic ruins, an
elegant serif with restrained sans support. The handoff mockups set composition, tone and
type; the live product decides which affordances exist, and where those two disagree the
product wins and PROGRESS.md records the call.

## Tokens (docs/styles.css :root)

    --bg            #0A0908   page ground, under a warm SVG grain and two fixed glows
    --bg-deep       #060505   the html ground behind everything
    --surface       #14110E   tablets, rows, seated cards
    --surface-raised #1D1813  hover states, the ritual, the pressed nav item
    --surface-sunk  #0F0C0A   the stoa, the search field, sources cards
    --ink           #EDE4D3   headings and names
    --ink-soft      #D2C7B3   everything a philosopher or a translator says
    --muted         #9C9080   secondary interface text
    --faint         #8F8676   meta, counts, timestamps. Lifted from #6F6658 in A1, which
                              read 3.52:1 on the ground.
    --gold          #C9A45C   the accent that carries meaning: buttons, chips, section rules
    --gold-bright   #E8D0A0   the wordmark, focus rings, the top of the button gradient
    --gold-deep     #8E6F3B   quote rules, hairline borders on gold elements
    --line          #241F19   tablet edges
    --line-strong   #3B3126   chips, dividers, the stoa border
    --heat          #D2743C   the hatch strokes
    --heat-bright   #EC9A5A   the heat word at level 3
    --verdigris     #7FA391   the visitor's own voice, patinated bronze against the gold
    --rail          212px     the stoa's width at 900px and up

Philosopher accents live in docs/data/philosophers.json and were chosen for the old
limestone world, where they read as muted earth. On black they disappear. The stylesheet
lifts each one rather than editing the data:

    --seat-lift    62%
    --seat-toward  #F6E6BE
    --tone: color-mix(in oklab, var(--seat) var(--seat-lift), var(--seat-toward))

That single expression drives the seat ring, the speaker rail on every utterance, the
speaker name, and the top edge of a seated card. All twenty-five clear WCAG AA on the
roster route, which renders every one of them.

## Type

    --display   Cormorant Garamond   questions, names, page titles, the lead table
    --lapidary  Marcellus            the wordmark and every uppercase section label
    --serif     Source Serif 4       philosopher and visitor speech, positions, passages
    --zh        Noto Serif SC        every Chinese glyph, named first in a stack that falls
                                     back to Source Han Serif SC, Songti SC, SimSun,
                                     Microsoft YaHei
    --sans      system stack         chrome: nav support text, chips, buttons, meta

Rule of register, unchanged from the first build and still true: if a philosopher says it,
it is serif; if the interface says it, it is sans; if it is carved, a name or a heading, it
is a display face. Section labels are Marcellus uppercase, letterspaced 0.18em, in gold.

Wayfinding is bilingual and paired, as the handoff shows: Chinese carved above small
letterspaced English. Everything else, including every word a philosopher or a visitor
says, is English.

## The stoa

The shell is a left colonnade at 900px and up: the wordmark with its Chinese sub-line,
bilingual wayfinding with line icons, and the handoff brazier burning at its foot behind a
mask that fades it upward. Below 900px it lies down into a top bar whose label row scrolls.

The `.stoa` element is the grid column, so its marble runs the full height of the page; a
sticky `.rail` inside it is what follows the scroll. A window under 660px tall drops the
fire and keeps the wayfinding.

Nav carries what the site has: plaza, philosophers, study, sources, about, source. Six
pairs will not fit one phone row, so below 620px the row wraps rather than scrolling and
hiding the last of them.

## Scenes

A scene is three layers: stone colour, a handoff plate, and a veil that puts a floor under
the darkness.

    .scene            the frame, a size container named scene
    .scene::before    the plate, with a brightness lift, mirrored on split scenes
    .scene::after     the veil, a horizontal gradient then a vertical wash
    --veil-to         where the veil holds 0.93 alpha before it lets go
    --veil-out        where it reaches 0.22 and the plate becomes visible
    --scene-at        background-position, chosen per surface from a luminance grid

Nine plates ship as `.s-plaza`, `.s-thread`, `.s-roster`, `.s-figure`, `.s-library`,
`.s-rotunda`, `.s-sanctuary`, `.s-sea` and `.s-marble`, each with an 800px companion for
phones. A `.split` scene holds its text to 60 percent of the panel and opens the veil over
the rest; a scene too narrow to split keeps the floor across its whole width.

Two measurements set the numbers. An 8x5 luminance grid per plate showed peaks between 35
and 122 out of 255, so the image layer carries `brightness(2.4)` or the veil leaves nothing
to see. The same grid showed the light sitting in each plate's left third, which is where
`cover` puts it under the text, so split scenes mirror the plate with `scaleX(-1)`.

Legibility is measured rather than assumed. The audit hides every glyph and its decorations,
screenshots the page, and reads the brightest rendered pixel under each text run, taking the
run's own line rects so a border or an inline mark cannot pose as the background. Twelve
routes at 1440 and 390 have to clear WCAG AA before a visual slice ticks. A reading view on
a phone can run past the 16384px Chrome will capture, so the shot is clipped and says so.

## Components

- Seat medallion (.seat): circle, 1px ring in the lifted accent, glyph is the first Chinese
  character where a name has one, else capitalised initials. Sizes 34px, .lg 56px, .xl 84px.
- Portrait plate (.face): the same circle, same ring, filled with the handoff art for the
  eight philosophers who have it. The .xl variant on a profile becomes a rounded plate and
  says under itself that it is an illustration made for this project.
- Table row (.table-row): the plaza's list item. Seats, then the question with its voices
  and the last thing said, then the kind chip, the heat, the exchange count and when it
  last moved. The row answers to the width of the list it sits in, not the page, because
  the same component appears inside a 72ch measure on a profile.
- Lead table (.tablet.lead): the hottest table, in a card above the filters, showing its
  last two turns with per-speaker rails and a line inviting entry.
- Heat mark (.heat): three hatch strokes, lit count is the level, calm below 0.4, warm
  below 0.65, heated at or above it, plus the word. Never a score, never animated. The hub
  mockup shows a percentage; a percentage is a score, so it is out.
- Kind chip (.kind): the conversation's type, uppercase gold on a hairline. The engine
  writes two, symposium and a visitor's question.
- Seated card (.seated): the room's bench. A face, a name, a tradition, and either the
  documented position on this conversation's own subject or, where the subject has no
  matching position, how this philosopher argues.
- Speaker rail: a 2px left border in the speaker's lifted accent on every utterance; the
  visitor gets verdigris and a faint verdigris wash. This is the attribution device; do not
  replace it with bubbles.
- Source card (.source) and passage (.passage): the sources rail. Works, counts, translator
  and year, and a drawer that fetches the corpus and quotes it with work, reference,
  translator and a link to the edition.
- Chips (.chip): pill filters, pressed state fills with gold.
- Volume (.volume): one work on the library shelf. A face, the title, the thinker and their
  era, the translator and year, the subjects, then the counts. Opens the reader.
- Page (.pages > li): one passage in the reader, numbered down the left, its reference in
  small gold capitals, the text in the reading serif, its subjects under it. A book is read
  twelve passages at a time, and each stretch is named by the references at its ends, so the
  nav says "Book I to Book III" rather than "page 2".
- Ritual (.ritual): the sit-down dialog. role=dialog, aria-modal, Tab trapped, Escape
  closes, focus returns to the opener, which is passed in rather than read from
  document.activeElement.
- Steps (.steps): the composer. A numbered ring, a heading, one field, one hint. Step four
  prints the issue title and context verbatim in a monospace block before the button opens
  the prepared form, so nothing leaves the page unseen.

## Layout

Max width 1080px, 20px gutters, mobile first. The rail takes 212px out of the window, so
content grids answer to container queries on `main` rather than viewport media queries: at
a 900px window a viewport query would run a two column feed in 648px. Three named
containers carry this: `court` on main, `feed` on the plaza list, `scene` on any scene.

The plaza reads canopy, lead table, filters, count strip, rows. A conversation reads
question hero, bench, then the floor at 72ch with the sources rail beside it at 900px and
up. A profile reads hero with an era panel, then a dossier with identity and positions on
the left and works and relationships on the right. The library reads canopy, the day's
passage, filters, shelf, and a timeline of the thinkers who have one. The reader reads
folio, the other works, the stretches of this one, then twelve passages at a time beside a
rail of subjects, related tables and a citation. The study reads canopy, a strip of counts,
recent tables on the left and today's pages with philosopher doors on the right. The
composer reads canopy, then four numbered steps down the floor with the table so far beside
them. Body never scrolls horizontally, checked at 1440 and 390 on every route.

## Motion

One authored arrival: plaza rows settle upward 12px with a 50ms stagger, once, behind
prefers-reduced-motion. The ritual fades and rises over 200 to 250ms. Hovers are 150 to
180ms ease-out on colour, border and transform. Nothing loops.

## Browser surfaces

Selection is gold with near-black text. Focus ring is 2px --gold-bright at 2px offset.
Scrollbars are thin in --line-strong. Links carry a --gold-deep underline at 3px offset
that warms to gold on hover. The theme colour is #0A0908 and the favicon is a gold temple
on the same ground.

Link previews use assets/og.jpg, a 1200x630 card rendered from scripts/og-card.html with
the plaza plate, the same veil and the same three typefaces. Conversation share stubs carry
it too, and they now render the question and the last thing said on the plaza's own ground
instead of a white flash before the redirect.

## What the interface will not claim

Every affordance has to work against static pages, JSON files and GitHub issues. The handoff
mockups show a logged-in reader throughout: saved conversations, favourites, notification
badges, like counts, a reading queue with progress, a weekly study plan, room presence, an
elapsed timer, AI annotations on the primary texts, a philosopher picker for a new
symposium. None of it ships as decoration. Where a mockup element could be wired to
something real it was, and where it could not it is gone and PROGRESS.md says why under
`## Adaptation calls`.

The composer is the sharpest case. The setup mockup lets a visitor choose the thinkers, but
`selectPhilosophers` in the engine seats three of its own, scored on the subjects each
philosopher's entry lists against the words of the question, with a bonus where two are in
declared tension and a random term so tables vary. A picker would be a fiction. So the
composer shows the scoring instead: type a question and it names which thinkers your words
are calling and which of their subjects matched, and it says in as many words that this is
a leaning and not a guest list.

## Voice

Interface copy stays inside the world without cosplay: "Opening the plaza", "Approaching the
table", "Sit down at this table", "Stay standing", "Lost in the stoa", "Looking through
their pages". Errors name the problem and the way back. Numbers are computed, never
decorative: the count strip reports tables open, how many moved in the last day, and how
many have a visitor seated.

Where the plaza holds nothing it says so in plain words rather than showing an empty box.
A philosopher with no public-domain translation reads "Listed, not quoted", and the reason
follows. Every route's footer carries the AI-character disclosure, and the about page adds
that several of the modeled thinkers are alive and that a portrait is an illustration.

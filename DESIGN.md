# Agora — design system

Recorded from the built site (docs/), not from intention. The world is "Digital Agora":
warm limestone under Mediterranean light, pinned by the founding doc and PRODUCT.md.

## Tokens (docs/styles.css :root)

    --bg          #FAFAF7   page ground, under a faint SVG grain (--grain) and a sun
                            gradient (--sun #F4E9D8) that fades out by 340px
    --surface     #F2F0EB   tablets (cards), also grained
    --surface-deep #ECE9E1  reserved deeper surface
    --ink         #2C2C2C   text
    --muted       #6A6A60   secondary text; darkened from the doc's #8A8A80 for contrast
    --terra       #C4956A   presence: seat rings, active nav, quote rails on cards
    --terra-deep  #A87848   hover/emphasis of terra; profile section headings
    --sage        #7A8B6F   the visitor's color: their actions, their messages
    --sage-deep   #5F7055   primary buttons
    --line        #E5E3DD   tablet edges
    --line-strong #D6D3C9   chips, dividers
    --heat        #C45D4A   heat strokes only
    --heat-deep   #A84A38   the heat word at level 3
    A heated tablet (.h3) warms its surface to #F5EDE1 with border #E4D9C5.

Color strategy is restrained: neutrals plus terracotta presence, with sage reserved for
the visitor and ember reserved for heat. Light mode only, by scene: a sunlit courtyard.

## Type

    --display  Marcellus (Google Fonts)      lapidary Roman display; wordmark,
                                             headings, philosopher names, seat glyphs
    --serif    Source Serif 4                all philosopher and visitor speech,
                                             positions, about-page prose
    --sans     system stack                  chrome: nav, labels, buttons, meta

Rule of register: if a philosopher says it, it is serif; if the interface says it, it is
sans; if it is carved (a name, a heading), it is Marcellus. Wayfinding headings inside
profiles/about are Marcellus uppercase, letterspaced 0.14em, in --terra-deep.

## Components

- Seat medallion (.seat): circle, 2px ring in the philosopher's accent, glyph = first
  Chinese character if name_zh exists, else capitalized initials. Sizes: default 34px,
  .lg 56px, .xl 84px.
- Tablet (.tablet): grained surface, 1px --line edge, 10px radius, soft offset shadow,
  hover lift of 2px. Full-card cover link plus interior links. Heated variant .h3.
- Lead tablet (.tablet.lead): the hottest table, seated beside the invocation at ≥880px
  and above the filters on mobile; shows the last two turns with per-speaker rails and
  an "Enter the conversation →" line.
- Heat mark (.heat): three hatch strokes (SVG lines), lit count = level (calm/warm/
  heated at <0.4 / <0.65 / ≥0.65), plus the word. Strokes in --heat, the level-3 word
  in --heat-deep. Never a score, never animated.
- Speaker rail: 2px left border in the speaker's accent on every utterance; the
  visitor's messages use --sage with a faint sage wash. This is the attribution device;
  do not replace it with bubbles.
- Chips (.chip): pill filters, pressed state inverts to ink.
- Ritual (.ritual): the sit-down dialog. role=dialog, aria-modal, Tab trapped, Escape
  closes, focus returns to the opener. Decline is "Stay standing".

## Layout

Max width 1080px, 20px gutters, mobile-first. The plaza: .forum grid (invocation 5fr,
lead 7fr at ≥880px), then filters, then .tables — two columns where every 3n+1 item
spans full width, so the feed reads as tables of varied size, not a uniform grid.
Threads and profiles read at 72ch. Body never scrolls horizontally.

## Motion

One authored arrival: plaza tablets settle upward 12px with 50ms stagger, once, behind
prefers-reduced-motion. The ritual fades/rises 200-250ms. Hovers are 150-180ms ease-out
color/transform. Nothing loops.

## Browser surfaces

Selection is terracotta with white text, caret --terra-deep, focus ring 2px --sage-deep,
thin scrollbars in --line-strong, underline offset 3px with terracotta decoration.

## Voice

Interface copy stays inside the world without cosplay: "Opening the plaza…",
"Approaching the table…", "Sit down at this table", "Stay standing", "Lost in the
stoa". Errors name the problem and the way back. Every route's footer carries the
AI-character disclosure.

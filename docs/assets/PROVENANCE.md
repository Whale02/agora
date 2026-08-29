# Where these rasters came from

Every image in this directory is a derivative of the founder's engineer handoff, generated
by `scripts/build-assets.sh`. The handoff itself lives at `.handoff/agora_engineer_handoff/`
and is gitignored, so this file is the record of what came from what. Re-run the script from
the repo root when the handoff is present; nothing here is edited by hand.

The handoff images were generated for this project from the founder's own prompt, quoted in
`.handoff/agora_engineer_handoff/README.md`. They carry no third-party rights.

## Surface grounds

Full frames scaled to 1600x900 (webp, quality 82) with an 800x450 companion for phones,
named `<stem>-sm.webp`. CSS picks the crop with `background-position`, so the whole frame
ships rather than a fixed band.

    plaza      moonlit_greco_roman_forum            the plaza itself, brazier-lit at night
    thread     stormlit_temple_amid_ancient_ruins   a question posed under weather
    roster     celestial_golden_amphitheater        seats in a circle, for the twenty-five
    figure     golden_veins_marble_philosopher      philosophers without handoff portrait art
    library    golden_light_in_the_ancient_marble_library   sources and study
    rotunda    glowing_brazier_in_a_classical_rotunda       the sit-down band
    sanctuary  golden_sanctuary_above_the_storm     the invitation to bring a question
    sea        golden_temple_overlooking_a_stormy_sea       the page that has lost its way
    marble     dark_marble_celestial_ruins          section ground, nearly textureless

## Sidebar brazier

    brazier.webp   288x324, quality 86
                   glowing_brazier_in_a_classical_rotunda, crop 320x360 at (662, 490)

The hub mockup anchors the left rail with a lit brazier. This is that chalice, cut from the
rotunda plate and recentred so the flame sits in the upper third.

## Philosopher plates

    p/<slug>.webp  356x300, quality 86
                   crop 356x300 at (206, 100) of the matching profile mockup

Each profile mockup is a 1448x1086 browser frame. The figure always occupies the same place,
left of the display name and above the quote band, and that region carries none of
the mockup's own typography, so one crop rectangle serves all eight. The first pass cut at
(200, 56) and caught the mockup's back link along the top edge and a frame corner along the
bottom of two plates; the current rectangle clears both.

Eight philosophers have handoff portrait art: socrates, marcus-aurelius, laozi, zhuangzi,
nietzsche, camus, fromm, naval. The other seventeen get the gold-on-marble medallion the
stylesheet already draws from their accent colour, over `figure.webp`.

## The share card

    og.jpg   1200x630, jpeg quality 88

Rendered from `scripts/og-card.html` by a headless Chrome at 1200x630, not drawn by hand.
The card reuses the plaza plate, the same veil the site uses for a split scene, and the same
three typefaces, so a link preview looks like the page it opens. It ships as the og:image on
the app shell and on every conversation share stub.

Regenerating it needs a headless Chrome, which the repository does not depend on. The
scratchpad `og.mjs` in the run notes does it in nine lines: open the file, wait for
`document.fonts.ready`, screenshot the 1200x630 clip.

## Budget

The directory holds 29 files and measures 1.4MB against the plan's 6MB ceiling. Check it
with `du -sh docs/assets` after any rebuild.

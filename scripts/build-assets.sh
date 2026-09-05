#!/usr/bin/env bash
# Rebuild docs/assets/ from the engineer handoff.
#
# The handoff lives at .handoff/agora_engineer_handoff/ and is gitignored: it holds 55MB of
# 1672x941 and 1448x1086 PNG mockups. The derivatives below are what ships. Run this from the
# repo root when the handoff is present; docs/assets/PROVENANCE.md records what each
# output came from, so the mapping survives without the source.
set -euo pipefail

H=.handoff/agora_engineer_handoff
OUT=docs/assets
[ -d "$H" ] || { echo "handoff missing at $H"; exit 1; }
mkdir -p "$OUT"

# Wide surface grounds. Full frame at 1600x900 so CSS background-position can choose the
# crop per surface, plus an 800px variant for phones.
wide() { # <source png> <out stem>
  ffmpeg -hide_banner -loglevel error -y -i "$1" \
    -vf "scale=1600:900:flags=lanczos" -c:v libwebp -quality 82 -compression_level 6 "$OUT/$2.webp"
  ffmpeg -hide_banner -loglevel error -y -i "$1" \
    -vf "scale=800:450:flags=lanczos" -c:v libwebp -quality 78 -compression_level 6 "$OUT/$2-sm.webp"
}

wide "$H/backgrounds/moonlit_greco_roman_forum.png"            plaza
wide "$H/backgrounds/stormlit_temple_amid_ancient_ruins.png"   thread
wide "$H/backgrounds/celestial_golden_amphitheater.png"        roster
wide "$H/backgrounds/golden_veins_marble_philosopher.png"      figure
wide "$H/backgrounds/golden_light_in_the_ancient_marble_library.png" library
wide "$H/backgrounds/glowing_brazier_in_a_classical_rotunda.png"     rotunda
wide "$H/backgrounds/golden_sanctuary_above_the_storm.png"     sanctuary
wide "$H/backgrounds/golden_temple_overlooking_a_stormy_sea.png"     sea
wide "$H/backgrounds/dark_marble_celestial_ruins.png"          marble

# The brazier that anchors the sidebar in the hub mockup, cut from the rotunda plate.
ffmpeg -hide_banner -loglevel error -y -i "$H/backgrounds/glowing_brazier_in_a_classical_rotunda.png" \
  -vf "crop=320:360:662:490,scale=288:324:flags=lanczos" -c:v libwebp -quality 86 -compression_level 6 \
  "$OUT/brazier.webp"

# Philosopher plates. Every profile mockup is a 1448x1086 browser frame with the figure in
# the same place: the region left of the display name and above the quote band carries none
# of the mockup's own typography, so the crop is identical for all eight.
plate() { # <source png> <slug>
  ffmpeg -hide_banner -loglevel error -y -i "$1" \
    -vf "crop=356:300:206:100" -c:v libwebp -quality 86 -compression_level 6 "$OUT/p/$2.webp"
}
mkdir -p "$OUT/p"
P=$H/profiles/philosophers
plate "$P/agora_socrates_philosophy_profile.png"          socrates
plate "$P/marcus_aurelius_the_inner_fortress.png"         marcus-aurelius
plate "$P/laozi_profile_in_the_golden_agora.png"          laozi
plate "$P/zhuangzi_in_a_daoist_philosophy_dashboard.png"  zhuangzi
plate "$P/agora_nietzsche_stormy_philosophy_profile.png"  nietzsche
plate "$P/agora_camus_and_the_absurdity_of_life.png"      camus
plate "$P/agora_erich_fromm_in_gold.png"                  fromm
plate "$P/agora_naval_s_golden_philosophy_profile.png"    naval

# The second portrait commission (September 2026), square from the start rather than cut out
# of a browser frame, so the whole frame ships and the square .face container crops nothing.
square() { # <source png> <slug>
  ffmpeg -hide_banner -loglevel error -y -i "$1"     -vf "scale=512:512:flags=lanczos" -c:v libwebp -quality 82 -compression_level 6 "$OUT/p/$2.webp"
}
Q=$H/../portraits-2026-09
for slug in plato seneca schopenhauer wang-yangming kant aristotle kierkegaard confucius wittgenstein epicurus; do
  square "$Q/$slug.png" "$slug"
done

# The third commission (September 2026), the last seven, delivered already named.
Q2=$H/../portraits-2026-09b
for slug in zhuxi weil arendt beauvoir munger han taleb; do
  square "$Q2/$slug.png" "$slug"
done

du -sh "$OUT"

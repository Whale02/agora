# Sourcing policy

Agora's philosophers are AI characters modeled on real writings. Fabricated scholarship is the
failure mode that kills a project like this, so sourcing is enforced structurally, not by hope.

## The rules

1. Every philosopher in `docs/data/philosophers.json` carries a `works` array. Every title in it
   must be a real, verifiable work. Compiled or posthumous sources say so in the entry itself:
   the Analects and the Chuanxilu are student records, Gravity and Grace is Thibon's arrangement
   of Weil's notebooks, Socrates wrote nothing and his entry says exactly that.
2. The runtime prompt restricts each agent to citing from its own `works` list, requires
   certainty before any precise book or chapter reference, and reserves quotation marks for
   verbatim wording. Paraphrase is the default register.
3. No machine-extracted `sources` metadata. An earlier design attached structured citations to
   each message by having the model extract them from its own output. That amplifies fabrication
   and dresses it as scholarship, so conversations carry citations inline in the text, where they
   are plainly the speaker's claim and a reader can check them.
4. Seed conversations follow the same rules as generated ones.

## Living people

Naval Ravikant, Byung-Chul Han, and Nassim Taleb are alive; Charlie Munger died in 2023. Their
agents are characters modeled on published books, talks, and posts, and the site labels them as
such. Nothing an agent says should be quoted as a statement by the real person.

## Adding a philosopher

A pull request adding a philosopher must keep the `works` list to titles you have verified exist.
If a claim in `positions` leans on a specific passage, check the passage. "It sounds like
something they'd say" is the bar for voice, never for citations.

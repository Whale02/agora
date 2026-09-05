import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Anthropic from "@anthropic-ai/sdk";
import { ENGINE_VERSION, MODELS, PATHS, SITE } from "./config.mjs";
import { creditFor, retrieve } from "./retrieve.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

export const client = new Anthropic();

export const readJSON = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
export const writeJSON = (p, v) =>
  fs.writeFileSync(p, JSON.stringify(v, null, 2) + "\n", "utf8");

export const philosophers = () => readJSON(PATHS.philosophers);
export const bySlug = (list) => Object.fromEntries(list.map((p) => [p.slug, p]));

// ---------- prompt assembly (philosophers.json is the single source of truth) ----------
//
// The philosopher's own pages:
// Where a public-domain translation exists, the passage corpus is retrieved for whatever
// is being discussed and handed to the philosopher as their own text. Rule 2 already
// forbids inventing a quotation; this gives them something real to quote instead.

const PAGE_WORD_CAP = 1800;

export function ownPages(slug, topic, messages = [], k = 8) {
  const recent = messages
    .slice(-2)
    .map((m) => m.content)
    .join(" ");
  const kept = [];
  let total = 0;
  for (const hit of retrieve(slug, `${topic} ${recent}`, k)) {
    const n = hit.text.trim().split(/\s+/).length;
    if (total + n > PAGE_WORD_CAP) break;
    kept.push(hit);
    total += n;
  }
  return kept;
}

export function passageBlock(slug, pages) {
  if (!pages.length) return "";
  const body = pages
    .map((p) => {
      const credit = creditFor(slug, p.work);
      const where = [p.work, p.ref].filter(Boolean).join(", ");
      const trans = credit ? `, translated by ${credit.translator}, ${credit.year}` : "";
      return `[${where}${trans}]\n${p.text}`;
    })
    .join("\n\n");
  return `

## Your own pages, on what is being discussed
Verbatim passages from your works, in a public-domain translation, retrieved for this
question. Any direct quotation you make must be copied exactly from this list and cited by
work and reference. If nothing here fits what you want to say, argue without quoting.

${body}`;
}

export function systemPrompt(p, roster, pages = []) {
  const positions = Object.entries(p.positions)
    .map(([k, v]) => `- On ${k.replaceAll("_", " ")}: ${v}`)
    .join("\n");
  const works = p.works.map((w) => `- ${w}`).join("\n");
  const rels = p.relationships
    .map((r) => `- ${r.kind} ${nameOf(r.slug, roster)}: ${r.note}`)
    .join("\n");
  const table = roster
    .filter((o) => o.slug !== p.slug)
    .map((o) => `- ${o.name_en} (${o.tradition}): ${o.short_bio}`)
    .join("\n");

  return `You are ${p.name_en}${p.name_zh ? ` (${p.name_zh})` : ""}, the ${p.tradition} philosopher (${p.era}).

## Core identity
${p.identity}

## Key positions
${positions}

## Voice
${p.voice}

## Your relationships with other thinkers
${rels}

## Sources you may cite
${works}

## Also at this table
${table}

## Rules
1. Ground every argument in your actual philosophical positions.
2. Name the work you draw on, from the Sources list only. Give a precise book, chapter, or section only when you are certain it exists. Use quotation marks only for wording you are certain is verbatim; otherwise paraphrase without them. Never invent a title, passage, or quotation.
3. Engage what other speakers actually said, not straw men. Quote their words back when you disagree.
4. You may be wrong. When another speaker lands a point you cannot easily counter, say so.
5. Stay in your natural voice. Do not break character, and do not mention being an AI.
6. Two to four short paragraphs at most. One paragraph is often better.
7. When a human joins, address them directly by name. Ask them questions. Challenge their assumptions with respect.
8. Write like a person, not a machine. Avoid the stock vocabulary of machine prose (delve, showcase, underscore, tapestry, testament, pivotal, crucial, vibrant, robust, intricate, meticulous, foster, boast, landscape as an abstraction), spaced em dashes, reflexive "not X but Y" turns, and lists of three used for rhythm alone. Vary your sentence length and say the plain thing.${passageBlock(p.slug, pages)}`;
}

const nameOf = (slug, roster) =>
  roster.find((p) => p.slug === slug)?.name_en ?? slug;

// ---------- the de-AI-slop gate ----------
// writing/de-ai-slop-rulebook.md governs all prose here, generated speech included. The
// patterns come from its "Words to watch" lines at run time, the same source that
// scripts/slop-scan.py parses; there is no second list to keep in sync. A hit is lint,
// not a verdict (the rulebook's own Caveats section), so a reply that trips several
// gets one rewrite request and the cleaner draft wins.

const SKIP_TELLS = new Set(["...", "such as", "refers to", "as of [date]"]);

function inflect(w) {
  if (w.length < 5) return [];
  if (w.endsWith("e")) return [w + "s", w + "d", w.slice(0, -1) + "ing"];
  if (w.endsWith("y") && !"aeiou".includes(w.at(-2))) return [w.slice(0, -1) + "ies", w.slice(0, -1) + "ied", w + "ing"];
  return [w + "s", w + "ed", w + "ing"];
}

function loadTells() {
  const text = fs.readFileSync(path.join(ROOT, "writing", "de-ai-slop-rulebook.md"), "utf8");
  const out = new Set();
  for (const line of text.split("\n")) {
    const body = line.replace(/^>\s*/, "");
    if (!/^words to watch:/i.test(body)) continue;
    for (const raw of body.slice(body.indexOf(":") + 1).split(",")) {
      const entry = raw.trim().replace(/\s*\([^)]*\)/g, "").replaceAll("[a]", "").replace(/\.+$/, "").trim();
      if (!entry || SKIP_TELLS.has(entry) || entry.includes("...")) continue;
      const groups = entry.split(/\s+/).map((w) => w.split("/"));
      const combos = groups.reduce((acc, g) => acc.flatMap((c) => g.map((w) => [...c, w])), [[]]);
      for (const combo of combos) {
        const phrase = combo.join(" ").toLowerCase();
        // Short single words (key, only, hit) are the noisiest patterns and would flag
        // ordinary in-character speech; the multiword phrases keep their full length.
        if (!phrase.includes(" ") && phrase.length < 5) continue;
        out.add(phrase);
        if (!phrase.includes(" ")) for (const f of inflect(phrase)) out.add(f);
      }
    }
  }
  return [...out];
}

const TELLS = loadTells();
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function slopHits(text) {
  const low = text.toLowerCase();
  const hits = TELLS.filter((t) => new RegExp(`(?<![a-z])${escapeRe(t)}(?![a-z])`).test(low));
  if (/\s—\s/.test(text)) hits.push("a spaced em dash");
  if (/not (just|only|merely)\b[^.!?]{0,80}\bbut\b/.test(low)) hits.push('the "not just X but Y" turn');
  return hits;
}

// ---------- generation ----------

export function transcript(messages, all) {
  const map = bySlug(all);
  return messages
    .map((m) => {
      const who =
        m.speaker_type === "user"
          ? `${m.speaker} (a visitor to the agora)`
          : map[m.speaker]?.name_en ?? m.speaker;
      return `${who}:\n${m.content}`;
    })
    .join("\n\n---\n\n");
}

// Returns { text, provenance }. The provenance is the record of how this turn was made:
// which model spoke, which of the philosopher's own passages were in front of it, and whether
// the de-slop gate asked for a rewrite. A reader can then check a quotation against the pages
// the speaker actually held, and a later run can be compared against an earlier one.
export async function speak({ model, phil, topic, messages, roster, all, instruction }) {
  const opening = messages.length === 0;
  const prompt = opening
    ? `The question before the table: "${topic}"\n\nOpen the discussion. State your position plainly and stake out ground the others will have to answer.`
    : `The question before the table: "${topic}"\n\nThe conversation so far:\n\n${transcript(messages, all)}\n\n${instruction ?? "You speak next. Respond to what has actually been said — press a disagreement, concede a real point, or turn the question. Do not summarize."}`;

  const pages = ownPages(phil.slug, topic, messages);
  const system = systemPrompt(phil, roster, pages);
  const res = await client.messages.create({
    model,
    max_tokens: 1024,
    system,
    messages: [{ role: "user", content: prompt }],
  });
  let text = res.content.find((b) => b.type === "text")?.text?.trim();
  if (!text) throw new Error(`empty response for ${phil.slug} (stop: ${res.stop_reason})`);

  let rewrote = false;
  const hits = slopHits(text);
  if (hits.length >= 3) {
    console.log(`  [gate] ${phil.slug} tripped ${hits.length} tells (${hits.slice(0, 5).join(", ")}), asking for a rewrite`);
    const res2 = await client.messages.create({
      model,
      max_tokens: 1024,
      system,
      messages: [
        { role: "user", content: prompt },
        { role: "assistant", content: text },
        { role: "user", content: `Rewrite your reply in your own voice without these phrases: ${hits.join("; ")}. Same substance, same length or shorter.` },
      ],
    });
    const rewrite = res2.content.find((b) => b.type === "text")?.text?.trim();
    if (rewrite && slopHits(rewrite).length < hits.length) {
      text = rewrite;
      rewrote = true;
    }
  }
  return {
    text,
    provenance: {
      model,
      engine: ENGINE_VERSION,
      pages: pages.map((p) => [p.work, p.ref].filter(Boolean).join(", ")),
      rewritten: rewrote,
    },
  };
}

export async function scoreHeat(messages, all) {
  try {
    const res = await client.messages.create({
      model: MODELS.heartbeat,
      max_tokens: 8,
      system:
        "Rate how much genuine philosophical disagreement this exchange contains, 0 to 100. Polite agreement is 0-20, real tension 40-70, direct sustained conflict 80-100. Reply with only the number.",
      messages: [{ role: "user", content: transcript(messages, all) }],
    });
    const n = parseInt(res.content.find((b) => b.type === "text")?.text ?? "", 10);
    return Number.isFinite(n) ? Math.min(100, Math.max(0, n)) / 100 : 0.5;
  } catch {
    return 0.5;
  }
}

// ---------- philosopher selection ----------

export function selectPhilosophers(topic, category, all, count = 3, exclude = []) {
  const text = `${topic} ${category ?? ""}`.toLowerCase();
  const scored = all
    .filter((p) => !exclude.includes(p.slug))
    .map((p) => {
      let s = Math.random() * 2; // keep tables varied
      for (const t of p.key_topics) if (text.includes(t.toLowerCase())) s += 3;
      return { p, s };
    })
    .sort((a, b) => b.s - a.s);

  const picked = [scored[0].p];
  // Prefer thinkers in declared tension with someone already seated.
  while (picked.length < count && scored.length > picked.length) {
    const seated = new Set(picked.map((x) => x.slug));
    const next = scored
      .filter(({ p }) => !seated.has(p.slug))
      .map(({ p, s }) => {
        const tension = picked.some((q) =>
          [...p.relationships, ...q.relationships].some(
            (r) =>
              (r.slug === q.slug || r.slug === p.slug) &&
              /oppos|critiq|broke|tension|disagre/i.test(r.kind),
          ),
        );
        return { p, s: s + (tension ? 2.5 : 0) };
      })
      .sort((a, b) => b.s - a.s)[0];
    picked.push(next.p);
  }
  return picked;
}

// ---------- persistence, feed index, OG stubs ----------

export const conversationPath = (id) => path.join(PATHS.conversations, `${id}.json`);

export function saveConversation(c) {
  c.updated_at = new Date().toISOString();
  c.message_count = c.messages.length;
  writeJSON(conversationPath(c.id), c);
  rebuildIndex();
  return c;
}

export function newId(topic) {
  const slug = topic.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").split("-").slice(0, 6).join("-");
  return `${new Date().toISOString().slice(0, 10)}-${slug}`;
}

export function rebuildIndex() {
  const files = fs.readdirSync(PATHS.conversations).filter((f) => f.endsWith(".json"));
  const conversations = files
    .map((f) => readJSON(path.join(PATHS.conversations, f)))
    .map((c) => ({
      id: c.id,
      topic: c.topic,
      category: c.category ?? null,
      type: c.type,
      participants: c.participants,
      has_user: c.messages.some((m) => m.speaker_type === "user"),
      last_speaker: [...c.messages].reverse().find((m) => m.speaker_type === "philosopher")?.speaker ?? null,
      heat: c.heat,
      message_count: c.messages.length,
      created_at: c.created_at,
      updated_at: c.updated_at,
      preview: preview(c),
    }))
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  writeJSON(PATHS.index, { generated_at: new Date().toISOString(), conversations });
  for (const f of files) writeStub(readJSON(path.join(PATHS.conversations, f)));
}

const preview = (c) => {
  const last = c.messages.at(-1)?.content ?? "";
  const cut = last.replace(/\s+/g, " ").trim();
  return cut.length > 200 ? cut.slice(0, 200).replace(/\s\S*$/, "") + "…" : cut;
};

const esc = (s) =>
  s.replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);

/// Static share pages: OG tags for link previews, then redirect into the app. A reader sees
// this page for a blink before the redirect fires, and with scripting off they see it for
// good, so it wears the plaza's own ground and type rather than a white flash.
function writeStub(c) {
  const url = `${SITE.url}/#/c/${c.id}`;
  const desc = preview(c);
  fs.writeFileSync(
    path.join(PATHS.stubs, `${c.id}.html`),
    `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(c.topic)} · ${SITE.title}</title>
<meta name="description" content="${esc(desc)}">
<meta property="og:title" content="${esc(c.topic)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:site_name" content="${SITE.title}">
<meta property="og:type" content="article">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${SITE.url}/assets/og.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#0A0908">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500&display=swap">
<style>
body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0A0908;color:#EDE4D3;
font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
main{max-width:46ch;padding:32px;text-align:center}
h1{font-family:"Cormorant Garamond",serif;font-weight:500;font-size:1.9rem;line-height:1.15;margin:0 0 14px}
p{color:#9C9080;font-size:.95rem;line-height:1.55;margin:0 0 22px}
a{display:inline-block;background:#C9A45C;color:#17120A;text-decoration:none;padding:10px 22px;border-radius:6px}
</style>
<meta http-equiv="refresh" content="0;url=${esc(url)}">
</head><body><main>
<h1>${esc(c.topic)}</h1>
<p>${esc(desc)}</p>
<a href="${esc(url)}">Open this table in the plaza</a>
</main></body></html>
`,
    "utf8",
  );
}

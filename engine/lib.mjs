import fs from "node:fs";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { MODELS, PATHS, SITE } from "./config.mjs";

export const client = new Anthropic();

export const readJSON = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
export const writeJSON = (p, v) =>
  fs.writeFileSync(p, JSON.stringify(v, null, 2) + "\n", "utf8");

export const philosophers = () => readJSON(PATHS.philosophers);
export const bySlug = (list) => Object.fromEntries(list.map((p) => [p.slug, p]));

// ---------- prompt assembly (philosophers.json is the single source of truth) ----------

export function systemPrompt(p, roster) {
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
7. When a human joins, address them directly by name. Ask them questions. Challenge their assumptions with respect.`;
}

const nameOf = (slug, roster) =>
  roster.find((p) => p.slug === slug)?.name_en ?? slug;

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

export async function speak({ model, phil, topic, messages, roster, all, instruction }) {
  const opening = messages.length === 0;
  const prompt = opening
    ? `The question before the table: "${topic}"\n\nOpen the discussion. State your position plainly and stake out ground the others will have to answer.`
    : `The question before the table: "${topic}"\n\nThe conversation so far:\n\n${transcript(messages, all)}\n\n${instruction ?? "You speak next. Respond to what has actually been said — press a disagreement, concede a real point, or turn the question. Do not summarize."}`;

  const res = await client.messages.create({
    model,
    max_tokens: 1024,
    system: systemPrompt(phil, roster),
    messages: [{ role: "user", content: prompt }],
  });
  const text = res.content.find((b) => b.type === "text")?.text?.trim();
  if (!text) throw new Error(`empty response for ${phil.slug} (stop: ${res.stop_reason})`);
  return text;
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

// Static share pages: OG tags for link previews, then redirect into the app.
function writeStub(c) {
  const url = `${SITE.url}/#/c/${c.id}`;
  const desc = preview(c);
  fs.writeFileSync(
    path.join(PATHS.stubs, `${c.id}.html`),
    `<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>${esc(c.topic)} — ${SITE.title}</title>
<meta property="og:title" content="${esc(c.topic)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:site_name" content="${SITE.title}">
<meta property="og:type" content="article">
<meta property="og:url" content="${esc(url)}">
<meta name="twitter:card" content="summary">
<meta http-equiv="refresh" content="0;url=${esc(url)}">
</head><body><a href="${esc(url)}">${esc(c.topic)}</a></body></html>\n`,
    "utf8",
  );
}

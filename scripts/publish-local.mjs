// Publish one Claude Code-authored Agora draft without making any model API calls.
import fs from "node:fs";
import { ENGINE_VERSION, PATHS } from "../engine/config.mjs";
import { philosophers, readJSON, writeJSON, ownPages, slopHits, newId, saveConversation } from "../engine/lib.mjs";

const [file, option] = process.argv.slice(2);
if (!file || ![undefined, "--check"].includes(option)) {
  console.error("Usage: node scripts/publish-local.mjs <draft.json> [--check]");
  process.exit(2);
}
const fail = (reason) => { throw new Error("Draft rejected: " + reason); };
const draft = JSON.parse(fs.readFileSync(file, "utf8"));
const topics = readJSON(PATHS.topics);
const match = topics.find((t) => t.question === draft.topic);
if (!match) fail("topic must match a question in docs/data/topics.json");
if (match.used) fail("this topic is already marked used");
const roster = new Map(philosophers().map((p) => [p.slug, p]));
const seats = draft.participants;
if (!Array.isArray(seats) || seats.length < 2 || seats.length > 4 ||
    new Set(seats).size !== seats.length || seats.some((s) => !roster.has(s))) {
  fail("participants must be 2-4 distinct known philosopher slugs");
}
if (!Array.isArray(draft.messages) || draft.messages.length < 4 || draft.messages.length > 8) {
  fail("provide 4-8 philosopher replies");
}
if (typeof draft.heat !== "number" || draft.heat < 0 || draft.heat > 1) {
  fail("heat must be a number from 0 to 1, estimated without API scoring");
}
const messages = [];
const stamped = new Date().toISOString();
for (const [index, m] of draft.messages.entries()) {
  if (!seats.includes(m.speaker)) fail("unknown speaker at turn " + (index + 1));
  if (typeof m.content !== "string" || m.content.trim().length < 30 || m.content.length > 2500) {
    fail("reply length out of range at turn " + (index + 1));
  }
  const hits = slopHits(m.content);
  if (hits.length >= 3) fail("rewrite turn " + (index + 1) + ": prose gate tripped " + hits.join(", "));
  const pages = ownPages(m.speaker, draft.topic, messages);
  const available = [draft.topic, ...messages.map((x) => x.content),
    ...pages.flatMap((p) => [p.text, p.text_original ?? ""])].join("\n");
  for (const q of [...m.content.matchAll(/["“]([^"”]{12,})["”]/g)].map((x) => x[1])) {
    if (!available.includes(q)) fail("unverified quotation at turn " + (index + 1) + ": " + q.slice(0, 70));
  }
  messages.push({
    speaker_type: "philosopher",
    speaker: m.speaker,
    content: m.content.trim(),
    provenance: {
      model: "claude-code",
      engine: ENGINE_VERSION,
      pages: pages.map((p) => [p.work, p.ref].filter(Boolean).join(", ")),
      rewritten: false,
    },
    created_at: stamped,
  });
}
for (const slug of seats) {
  if (!messages.some((m) => m.speaker === slug)) fail("no reply from seated philosopher " + slug);
}
const id = newId(draft.topic);
if (fs.existsSync(PATHS.conversations + "/" + id + ".json")) {
  fail("this topic already has a conversation ID today");
}
if (option === "--check") {
  console.log("VALID: " + messages.length + " grounded turns, no paid API calls; nothing written");
  process.exit(0);
}
saveConversation({
  id,
  topic: draft.topic,
  category: match.category ?? null,
  type: "heartbeat",
  status: "active",
  participants: seats,
  heat: draft.heat,
  created_at: stamped,
  messages,
});
match.used = true;
writeJSON(PATHS.topics, topics);
await import("../engine/feed.mjs");
console.log("Published " + id + "; commit docs/ changes to make them live");

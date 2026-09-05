// One heartbeat: pick a topic, seat 2-4 philosophers, run the exchange, save.
import { MODELS, PATHS, ROUNDS_BY_SIZE } from "./config.mjs";
import {
  philosophers, readJSON, writeJSON, selectPhilosophers,
  speak, scoreHeat, saveConversation, newId,
} from "./lib.mjs";

const all = philosophers();
const topics = readJSON(PATHS.topics);

const pool = topics.filter((t) => !t.used);
const topic = (pool.length ? pool : topics)[Math.floor(Math.random() * (pool.length || topics.length))];

const size = 2 + Math.floor(Math.random() * 3); // 2-4 seats
const seated = topic.suggested?.length
  ? topic.suggested.slice(0, size).map((s) => all.find((p) => p.slug === s)).filter(Boolean)
  : [];
while (seated.length < size) {
  const more = selectPhilosophers(topic.question, topic.category, all, size, seated.map((p) => p.slug));
  for (const p of more) if (seated.length < size && !seated.includes(p)) seated.push(p);
}

console.log(`Topic: ${topic.question}`);
console.log(`Seated: ${seated.map((p) => p.name_en).join(", ")}`);

const messages = [];
const rounds = ROUNDS_BY_SIZE[seated.length] ?? 2;
for (let r = 0; r < rounds; r++) {
  for (const phil of seated) {
    const { text: content, provenance } = await speak({
      model: MODELS.heartbeat, phil, topic: topic.question,
      messages, roster: seated, all,
    });
    messages.push({ speaker_type: "philosopher", speaker: phil.slug, content, provenance, created_at: new Date().toISOString() });
    console.log(`  ${phil.name_en}: ${content.slice(0, 80).replace(/\n/g, " ")}…`);
  }
}

const heat = await scoreHeat(messages, all);
const conversation = saveConversation({
  id: newId(topic.question),
  topic: topic.question,
  category: topic.category ?? null,
  type: "heartbeat",
  status: "active",
  participants: seated.map((p) => p.slug),
  heat,
  created_at: new Date().toISOString(),
  messages,
});

topic.used = true;
writeJSON(PATHS.topics, topics);
console.log(`Saved ${conversation.id} (heat ${heat})`);

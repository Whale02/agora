// Summarise docs/data/passages/*.json into docs/data/passages.json.
//
// The corpus files run to hundreds of kilobytes each, which is the right size for the
// engine and the wrong size for a reading view that wants to say "Plato, 360 passages from
// eight dialogues, Jowett 1892" before it fetches anything. This writes that summary: one
// entry per philosopher with a corpus, their works with counts, their topics with counts,
// and the translation credits. Nothing here is authored; it is all read back out of the
// corpus files, so a stale summary is a bug in the build order, not a claim.
//
//     node scripts/build-passage-index.mjs
import fs from "node:fs";
import path from "node:path";

const DIR = "docs/data/passages";
const OUT = "docs/data/passages.json";

const files = fs.existsSync(DIR)
  ? fs.readdirSync(DIR).filter((f) => f.endsWith(".json")).sort()
  : [];

const philosophers = files.map((f) => {
  const c = JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8"));
  const works = new Map();
  const topics = new Map();
  let words = 0;
  for (const p of c.passages) {
    if (!works.has(p.work)) works.set(p.work, { count: 0, words: 0, topics: new Map() });
    const w = works.get(p.work);
    const n = p.text.trim().split(/\s+/).length;
    w.count++;
    w.words += n;
    words += n;
    for (const t of p.topics ?? []) {
      topics.set(t, (topics.get(t) ?? 0) + 1);
      w.topics.set(t, (w.topics.get(t) ?? 0) + 1);
    }
  }
  return {
    slug: c.slug,
    passages: c.passages.length,
    words,
    works: [...works]
      .sort((a, b) => b[1].count - a[1].count)
      .map(([work, w]) => ({
        work,
        count: w.count,
        words: w.words,
        topics: [...w.topics].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([topic]) => topic),
      })),
    topics: [...topics].sort((a, b) => b[1] - a[1]).map(([topic, count]) => ({ topic, count })),
    translation_credits: c.translation_credits,
  };
});

fs.writeFileSync(
  OUT,
  JSON.stringify({ generated_at: new Date().toISOString(), philosophers }, null, 2) + "\n",
  "utf8",
);
const total = philosophers.reduce((n, p) => n + p.passages, 0);
console.log(`${OUT}: ${philosophers.length} philosophers, ${total} passages`);

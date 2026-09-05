// Summarise docs/data/passages/<slug>/*.json into docs/data/passages.json.
//
// The work files run to tens or hundreds of kilobytes each, which is the right size for a
// reader opening one book and the wrong size for a page that wants to say "Plato, 360
// passages from eight dialogues, Jowett 1892" before it fetches anything. This writes that
// summary: one entry per philosopher with a corpus, their works with counts and file names,
// their topics with counts, and the translation credits. Nothing here is authored; it is all
// read back out of the corpus files, so a stale summary is a bug in the build order, not a
// claim.
//
//     node scripts/build-passage-index.mjs
import fs from "node:fs";
import { corpusSlugs, readIndex, readWork } from "../engine/corpus.mjs";

const OUT = "docs/data/passages.json";

const philosophers = corpusSlugs().map((slug) => {
  const idx = readIndex(slug);
  const topics = new Map();
  const works = [];
  const credits = [];
  let words = 0;
  let passages = 0;
  for (const w of idx.works) {
    const file = readWork(slug, w.slug);
    const wt = new Map();
    for (const p of file.passages) {
      for (const t of p.topics ?? []) {
        topics.set(t, (topics.get(t) ?? 0) + 1);
        wt.set(t, (wt.get(t) ?? 0) + 1);
      }
    }
    words += w.words;
    passages += file.passages.length;
    works.push({
      work: w.work,
      slug: w.slug,
      file: w.file,
      count: file.passages.length,
      words: w.words,
      topics: [...wt].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([topic]) => topic),
    });
    credits.push(file.translation_credit);
  }
  return {
    slug,
    passages,
    words,
    works: works.sort((a, b) => b.count - a.count),
    topics: [...topics].sort((a, b) => b[1] - a[1]).map(([topic, count]) => ({ topic, count })),
    translation_credits: credits,
  };
});

fs.writeFileSync(
  OUT,
  JSON.stringify({ generated_at: new Date().toISOString(), philosophers }, null, 2) + "\n",
  "utf8",
);
const total = philosophers.reduce((n, p) => n + p.passages, 0);
const shelves = philosophers.reduce((n, p) => n + p.works.length, 0);
console.log(`${OUT}: ${philosophers.length} philosophers, ${shelves} works, ${total} passages`);

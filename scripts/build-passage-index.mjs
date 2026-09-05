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
import path from "node:path";
import { fileURLToPath } from "node:url";
import { corpusSlugs, readIndex, readWork } from "../engine/corpus.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "docs", "data", "passages.json");
const MENTIONS = path.join(ROOT, "docs", "data", "mentions.json");

// A philosopher who wrote nothing can still be on the page: Socrates is in the dialogues
// Plato wrote about him. This counts, for every thinker the plaza cannot quote, the
// passages in the corpus that name them, so a profile can point at the record without
// anyone typing which dialogues those are.
const roster = JSON.parse(fs.readFileSync(path.join(ROOT, "docs", "data", "philosophers.json"), "utf8"));
const held = new Set(corpusSlugs());
const unquoted = roster.filter((p) => !held.has(p.slug));
const mentions = Object.fromEntries(unquoted.map((p) => [p.slug, []]));

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
    for (const u of unquoted) {
      // The whole name, not the surname: "Han" alone is in the Han dynasty and in Han Ch'ing,
      // and counting those would put Byung-Chul Han in the Analects.
      const needle = new RegExp("\\b" + u.name_en.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b");
      const n = file.passages.filter((p) => needle.test(p.text)).length;
      if (n) mentions[u.slug].push({ slug, work: w.work, work_slug: w.slug, count: n });
    }
    // How many of the work's passages carry the original beside the translation. The reader
    // prints this line, and it reads the manifest rather than the work file, so leaving the
    // count out of here made every reader say it had aligned none of them.
    const paired = file.passages.filter((p) => p.text_original).length;
    works.push({
      work: w.work,
      slug: w.slug,
      file: w.file,
      count: file.passages.length,
      words: w.words,
      ...(paired ? { paired, original: file.original_credit?.title } : {}),
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
for (const k of Object.keys(mentions)) {
  mentions[k].sort((a, b) => b.count - a.count);
  if (!mentions[k].length) delete mentions[k];
}
fs.writeFileSync(
  MENTIONS,
  JSON.stringify({ generated_at: new Date().toISOString(), philosophers: mentions }, null, 2) + "\n",
  "utf8",
);
console.log(`docs/data/mentions.json: ${Object.keys(mentions).length} unquoted thinkers the corpus names`);

const total = philosophers.reduce((n, p) => n + p.passages, 0);
const shelves = philosophers.reduce((n, p) => n + p.works.length, 0);
console.log(`docs/data/passages.json: ${philosophers.length} philosophers, ${shelves} works, ${total} passages`);

// Retrieval over a philosopher's own pages.
//
// BM25 with no dependencies, over docs/data/passages/<slug>/. Each philosopher gets one
// index across all their works, built the first time anyone asks for them and kept for the
// life of the process, so a heartbeat that seats four thinkers reads four shelves and no
// more. A philosopher with no corpus retrieves nothing rather than throwing, because most of
// the twenty-five have no public-domain translation and that is a normal state, not an error.
//
//     import { retrieve } from "./retrieve.mjs";
//     retrieve("marcus-aurelius", "is work meaningful", 4)
//     // -> [{ work, ref, text, topics, score }, ...]
import { corpusSlugs, readIndex, readWork } from "./corpus.mjs";

export { corpusSlugs };

const K1 = 1.2;
const B = 0.75;

// Words that carry no signal about which passage answers a question.
const STOP = new Set(
  ("a about above after again against all am an and any are as at be because been before being below between both but by " +
    "can cannot could did do does doing down during each few for from further had has have having he her here hers herself " +
    "him himself his how i if in into is it its itself me more most my myself no nor not of off on once only or other ought " +
    "our ours ourselves out over own same she should so some such than that the their theirs them themselves then there " +
    "these they this those through to too under until up very was we were what when where which while who whom why will " +
    "with would you your yours yourself yourselves upon shall may must one two upon thus therefore also even still yet")
    .split(" "),
);

// A crude suffix trim, enough to let "sufferings" find "suffers" without a stemmer library.
// The plural comes off first, so a doubled ending like "sufferings" reduces all the way.
function stem(word) {
  let w = word;
  if (w.length > 4 && w.endsWith("ies")) w = `${w.slice(0, -3)}y`;
  else if (w.length > 4 && w.endsWith("sses")) w = w.slice(0, -2);
  else if (w.length > 3 && w.endsWith("s") && !/(ss|us|is)$/.test(w)) w = w.slice(0, -1);
  if (w.length > 5 && w.endsWith("ness")) return w.slice(0, -4);
  if (w.length > 5 && w.endsWith("ing")) return w.slice(0, -3);
  if (w.length > 4 && w.endsWith("edly")) return w.slice(0, -4);
  if (w.length > 4 && w.endsWith("ed")) return w.slice(0, -2);
  if (w.length > 4 && w.endsWith("ly")) return w.slice(0, -2);
  return w;
}

export function tokenize(text) {
  const out = [];
  for (const raw of String(text).toLowerCase().match(/[a-zÀ-ɏ']+/g) ?? []) {
    const w = raw.replace(/^'+|'+$/g, "");
    if (w.length < 3 || STOP.has(w)) continue;
    out.push(stem(w));
  }
  return out;
}

const indexes = new Map();

function build(slug) {
  const index = readIndex(slug);
  if (!index) return null;
  const docs = [];
  const df = new Map();
  const credits = [];
  for (const w of index.works) {
    const file = readWork(slug, w.slug);
    if (!file) continue;
    credits.push(file.translation_credit);
    for (const p of file.passages) {
      const tf = new Map();
      const toks = tokenize(`${p.text} ${p.work} ${p.ref ?? ""} ${(p.topics ?? []).join(" ")}`);
      for (const t of toks) tf.set(t, (tf.get(t) ?? 0) + 1);
      for (const t of tf.keys()) df.set(t, (df.get(t) ?? 0) + 1);
      docs.push({ passage: p, tf, len: toks.length });
    }
  }
  const total = docs.reduce((n, d) => n + d.len, 0);
  return { slug, docs, df, avgdl: docs.length ? total / docs.length : 0, credits };
}

// The index for a philosopher, or null when the plaza holds no passages from them.
export function indexFor(slug) {
  if (!indexes.has(slug)) indexes.set(slug, build(slug));
  return indexes.get(slug);
}

export const hasCorpus = (slug) => indexFor(slug) !== null;

export function retrieve(slug, query, k = 4) {
  const idx = indexFor(slug);
  if (!idx || !idx.docs.length) return [];
  const terms = [...new Set(tokenize(query))];
  if (!terms.length) return [];

  const N = idx.docs.length;
  const scored = [];
  for (const d of idx.docs) {
    let score = 0;
    for (const t of terms) {
      const f = d.tf.get(t);
      if (!f) continue;
      const n = idx.df.get(t) ?? 0;
      const idf = Math.log(1 + (N - n + 0.5) / (n + 0.5));
      score += (idf * (f * (K1 + 1))) / (f + K1 * (1 - B + (B * d.len) / idx.avgdl));
    }
    if (score > 0) scored.push({ d, score });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, k).map(({ d, score }) => ({
    work: d.passage.work,
    ref: d.passage.ref ?? null,
    text: d.passage.text,
    topics: d.passage.topics ?? [],
    score: Math.round(score * 1000) / 1000,
  }));
}

// The translation behind a work, for citing what a passage came from.
export function creditFor(slug, work) {
  const idx = indexFor(slug);
  return idx?.credits.find((c) => c.work === work) ?? null;
}

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

// The originals are not all one language, so they are not all one kind of token. Classical
// Chinese writes no spaces and few words of more than two characters, so the unit to match
// on is the character pair: 天命 and 命性 out of 天命性, which finds a phrase wherever the
// question breaks it. Greek, Latin, German and Danish write words, so words is what they
// give, lowercased and stripped of the accents an asker is unlikely to type. No English
// stemmer and no English stop list touches either: both would be nonsense here.
const CJK = /[㐀-鿿]/;
const CJK_RUN = /[㐀-鿿]+/g;
const WORD_RUN = /[\p{L}\p{M}]{2,}/gu;

export function tokenizeOriginal(text) {
  const s = String(text);
  const out = [];
  for (const run of s.match(CJK_RUN) ?? []) {
    if (run.length === 1) out.push(run);
    for (let i = 0; i + 1 < run.length; i++) out.push(run.slice(i, i + 2));
  }
  if (CJK.test(s)) return out;
  for (const w of s.toLowerCase().match(WORD_RUN) ?? []) {
    out.push(w.normalize("NFD").replace(/\p{M}/gu, ""));
  }
  return out;
}

// Which shelf a question belongs on. A question in Chinese or Greek could only be asking
// after an original; a question in Latin script might be English, so that one tries the
// translations first and falls back.
export const askedInOriginal = (s) => CJK.test(s) || /[Ͱ-Ͽἀ-῿]/.test(String(s));

const indexes = new Map();

// Counted terms and their document frequencies: the three numbers BM25 needs.
function shelf(docs) {
  const df = new Map();
  for (const d of docs) for (const t of d.tf.keys()) df.set(t, (df.get(t) ?? 0) + 1);
  const total = docs.reduce((n, d) => n + d.len, 0);
  return { docs, df, avgdl: docs.length ? total / docs.length : 0 };
}

const counted = (toks) => {
  const tf = new Map();
  for (const t of toks) tf.set(t, (tf.get(t) ?? 0) + 1);
  return { tf, len: toks.length };
};

function build(slug) {
  const index = readIndex(slug);
  if (!index) return null;
  const docs = [];
  // The originals get a shelf of their own rather than a share of the English one. Folding
  // an original into the same document would roughly double the length of every passage
  // that carries one, and BM25 divides by length, so a paired passage would sink in English
  // results for having been paired. Two shelves keep English retrieval exactly as it was and
  // let a question asked in another language be answered in the language it was asked in.
  const originalDocs = [];
  const credits = [];
  const originals = [];
  for (const w of index.works) {
    const file = readWork(slug, w.slug);
    if (!file) continue;
    credits.push(file.translation_credit);
    if (file.original_credit) originals.push({ work: file.work, ...file.original_credit });
    for (const p of file.passages) {
      const toks = tokenize(`${p.text} ${p.work} ${p.ref ?? ""} ${(p.topics ?? []).join(" ")}`);
      docs.push({ passage: p, ...counted(toks) });
      if (p.text_original) originalDocs.push({ passage: p, ...counted(tokenizeOriginal(p.text_original)) });
    }
  }
  return { slug, ...shelf(docs), original: shelf(originalDocs), credits, originals };
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
  // Which shelf the question belongs on. A script the translations are not written in settles
  // it outright. Latin script does not: German and English are both written in it, and
  // "Der Wille zur Wahrheit" has to reach Nietzsche's own words rather than fall through to
  // whichever English passage happens to share a word with it. So both shelves are asked how
  // much of the question they recognise, and the one that recognises more of it answers.
  // The measure is how much of the shelf each term is at home in: the share of its documents
  // the term appears in, averaged over the question. "Der Wille zur Wahrheit" is in both
  // shelves, because a translator quotes the German he is translating, but in the German it
  // is in nearly every passage and in the English it is in three of a thousand.
  const athome = (shelf, terms) =>
    !terms.length || !shelf.docs.length
      ? 0
      : terms.reduce((n, t) => n + (shelf.df.get(t) ?? 0) / shelf.docs.length, 0) / terms.length;
  const inEnglish = [...new Set(tokenize(query))];
  const inOriginal = [...new Set(tokenizeOriginal(query))];
  let shelved = idx;
  let terms = inEnglish;
  if (idx.original.docs.length && (askedInOriginal(query) || athome(idx.original, inOriginal) > athome(idx, inEnglish))) {
    shelved = idx.original;
    terms = inOriginal;
  }
  if (!terms.length || !shelved.docs.length) return [];

  const N = shelved.docs.length;
  const scored = [];
  for (const d of shelved.docs) {
    let score = 0;
    for (const t of terms) {
      const f = d.tf.get(t);
      if (!f) continue;
      const n = shelved.df.get(t) ?? 0;
      const idf = Math.log(1 + (N - n + 0.5) / (n + 0.5));
      score += (idf * (f * (K1 + 1))) / (f + K1 * (1 - B + (B * d.len) / shelved.avgdl));
    }
    if (score > 0) scored.push({ d, score });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, k).map(({ d, score }) => ({
    work: d.passage.work,
    ref: d.passage.ref ?? null,
    text: d.passage.text,
    ...(d.passage.text_original ? { text_original: d.passage.text_original } : {}),
    topics: d.passage.topics ?? [],
    score: Math.round(score * 1000) / 1000,
  }));
}

// The translation behind a work, for citing what a passage came from.
export function creditFor(slug, work) {
  const idx = indexFor(slug);
  return idx?.credits.find((c) => c.work === work) ?? null;
}

// The edition the original came from, where the work carries one.
export function originalFor(slug, work) {
  const idx = indexFor(slug);
  return idx?.originals.find((c) => c.work === work) ?? null;
}

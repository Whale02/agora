// The corpus on disk: one directory per philosopher, one file per work.
//
//     docs/data/passages/plato/index.json      the works, their credits and counts
//     docs/data/passages/plato/republic.json   one work, its credit, its passages
//
// A reader who opens the Republic should fetch the Republic, not Plato's whole shelf, and
// the shelf grows every time lane F finds another public-domain translation. This module is
// the only place that knows the layout: the retriever, the manifest build, the test suite
// and the corpus builders all go through it, so the shape is defined once.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
export const DIR = path.join(ROOT, "docs", "data", "passages");

// A work's file name. Titles carry a Chinese name in brackets and sometimes a clause
// describing how the work came down; both are cut, because "The Analects (论语), my
// conversations as my students recorded them" has to become a path segment a reader can
// read. A comma that is part of the title is kept, so "Human, All Too Human" does not file
// itself as "human". What is left is lowercased ASCII, and a collision inside one
// philosopher takes a numeric suffix.
const GLOSS = /,\s+(?:my|as|especially|including|published|compiled|set|books|written|translated|with|together)\b.*$/i;

export function workSlug(work, taken = new Set()) {
  const head = String(work).replace(GLOSS, "").split(/[(;:]/)[0];
  let s = head
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
  if (!s) s = "work";
  if (!taken.has(s)) return s;
  for (let n = 2; ; n++) if (!taken.has(`${s}-${n}`)) return `${s}-${n}`;
}

// Every slug with a corpus on disk, sorted.
export function corpusSlugs() {
  if (!fs.existsSync(DIR)) return [];
  return fs
    .readdirSync(DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory() && fs.existsSync(path.join(DIR, e.name, "index.json")))
    .map((e) => e.name)
    .sort();
}

// The works a philosopher holds, or null when the plaza holds no passages from them.
export function readIndex(slug) {
  const file = path.join(DIR, slug, "index.json");
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

// One work: its credit and its passages.
export function readWork(slug, work) {
  const file = path.join(DIR, slug, `${work}.json`);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

// Every work file a philosopher has, in the order index.json lists them.
export function readWorks(slug) {
  const idx = readIndex(slug);
  if (!idx) return [];
  return idx.works.map((w) => readWork(slug, w.slug)).filter(Boolean);
}

const wordCount = (s) => (String(s).trim().match(/\S+/g) ?? []).length;

// Rewrite index.json from the work files beside it. A pass that edits a work in place, such
// as pairing the original to the translation, changes what the index has to say about it,
// and an index that disagrees with the files is a thing the corpus test fails on.
export function refreshIndex(slug) {
  const index = readIndex(slug);
  if (!index) throw new Error(`no corpus for ${slug}`);
  index.works = index.works.map((w) => {
    const file = readWork(slug, w.slug);
    const paired = file.passages.filter((p) => p.text_zh).length;
    const { paired: _p, original: _o, ...rest } = w;
    return {
      ...rest,
      passages: file.passages.length,
      words: file.passages.reduce((n, p) => n + wordCount(p.text), 0),
      ...(paired ? { paired, original: file.original_credit?.title } : {}),
    };
  });
  fs.writeFileSync(path.join(DIR, slug, "index.json"), JSON.stringify(index, null, 2) + "\n", "utf8");
  return index;
}

// Write a philosopher's whole shelf: one file per work plus the index. Passages keep the
// order they were built in, and each work file holds only its own. `credits` is the list of
// translation credits, one per work; a work without one is a bug and throws rather than
// shipping a passage nobody can trace.
export function writeCorpus(slug, credits, passages) {
  const dir = path.join(DIR, slug);
  fs.mkdirSync(dir, { recursive: true });
  const byWork = new Map();
  for (const p of passages) {
    if (!byWork.has(p.work)) byWork.set(p.work, []);
    byWork.get(p.work).push(p);
  }
  const taken = new Set();
  const works = [];
  for (const [work, list] of byWork) {
    const credit = credits.find((c) => c.work === work);
    if (!credit) throw new Error(`${slug}: no translation credit for ${work}`);
    const wslug = workSlug(work, taken);
    taken.add(wslug);
    // A work may carry the original language beside the translation: the credit names the
    // edition the Chinese or the Greek came from, and a passage carries `text_zh` where the
    // original for it is known. A passage without one is a passage nobody could align, which
    // is a normal state and not a gap.
    const { original, ...translation } = credit;
    const body = {
      slug,
      work,
      work_slug: wslug,
      translation_credit: translation,
      ...(original ? { original_credit: original } : {}),
      passages: list,
    };
    fs.writeFileSync(path.join(dir, `${wslug}.json`), JSON.stringify(body, null, 2) + "\n", "utf8");
    const paired = list.filter((p) => p.text_zh).length;
    works.push({
      work,
      slug: wslug,
      file: `${wslug}.json`,
      passages: list.length,
      words: list.reduce((n, p) => n + wordCount(p.text), 0),
      translator: credit.translator,
      year: credit.year,
      source_url: credit.source_url,
      ...(credit.note ? { note: credit.note } : {}),
      ...(paired ? { paired, original: original.title } : {}),
    });
  }
  fs.writeFileSync(
    path.join(dir, "index.json"),
    JSON.stringify({ slug, works }, null, 2) + "\n",
    "utf8",
  );
  // A work file left behind by an earlier build would still be served and still be listed
  // by anything that reads the directory, so the shelf is swept to what the index names.
  const keep = new Set(["index.json", ...works.map((w) => w.file)]);
  for (const f of fs.readdirSync(dir)) if (f.endsWith(".json") && !keep.has(f)) fs.rmSync(path.join(dir, f));
  return works;
}

// Validate the passage corpus and the retrieval over it.
//
//     node engine/test-retrieve.mjs
//
// Exits 1 on the first kind of failure that would put something untrue on the site: a
// corpus file that does not parse, a passage citing a work its philosopher does not have,
// a translation credit without a source, a passage far outside the length band, or a
// retrieval that comes back empty for a subject the corpus is tagged for.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DIR, corpusSlugs, readIndex, readWork, workSlug } from "./corpus.mjs";
import { creditFor, retrieve, tokenize } from "./retrieve.mjs";
import { ownPages, passageBlock, systemPrompt } from "./lib.mjs";

// United States copyright runs 95 years from publication, so the newest translation that is
// clear today is the one published 95 years ago. Computed rather than written down: a
// hardcoded year silently rejects a legitimate edition every 1 January.
const PUBLIC_DOMAIN_THROUGH = new Date().getUTCFullYear() - 96;

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const MIN_WORDS = 50;
const MAX_WORDS = 400;
// A work file is what a reader downloads to open one book. Past this it is a shelf again.
const MAX_WORK_BYTES = 400 * 1024;

const philosophers = JSON.parse(fs.readFileSync(path.join(ROOT, "docs", "data", "philosophers.json"), "utf8"));
const topics = JSON.parse(fs.readFileSync(path.join(ROOT, "docs", "data", "topics.json"), "utf8"));
const bySlug = Object.fromEntries(philosophers.map((p) => [p.slug, p]));

let failed = 0;
const check = (ok, label, detail) => {
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${label}${detail ? `  ${detail}` : ""}`);
};

const slugs = corpusSlugs();
check(slugs.length > 0, "a corpus exists", `${slugs.length} philosophers`);

let totalPassages = 0;
let totalBytes = 0;

const heaviest = { file: null, bytes: 0 };

for (const slug of slugs) {
  let index;
  let corpus;
  try {
    index = readIndex(slug);
    corpus = { translation_credits: [], passages: [] };
    for (const w of index.works) {
      const file = path.join(DIR, slug, w.file);
      const bytes = fs.statSync(file).size;
      totalBytes += bytes;
      if (bytes > heaviest.bytes) { heaviest.file = `${slug}/${w.file}`; heaviest.bytes = bytes; }
      const held = readWork(slug, w.slug);
      corpus.translation_credits.push(held.translation_credit);
      corpus.passages.push(...held.passages);
    }
  } catch (e) {
    check(false, `${slug} parses`, e.message);
    continue;
  }

  const p = bySlug[slug];
  if (!p) {
    check(false, `${slug} is a philosopher in philosophers.json`);
    continue;
  }

  const problems = [];
  const works = new Set(p.works);
  const seen = new Set();
  let short = 0;
  let long = 0;
  const topicsUsed = new Set();

  for (const [i, x] of corpus.passages.entries()) {
    if (!works.has(x.work)) problems.push(`passage ${i} cites a work not in philosophers.json: ${x.work}`);
    if (typeof x.text !== "string" || !x.text.trim()) problems.push(`passage ${i} has no text`);
    if (!Array.isArray(x.topics) || !x.topics.length) problems.push(`passage ${i} has no topics`);
    const n = String(x.text).trim().split(/\s+/).length;
    if (n < MIN_WORDS) short++;
    if (n > MAX_WORDS) long++;
    const key = String(x.text).slice(0, 60);
    if (seen.has(key)) problems.push(`passage ${i} repeats an earlier one`);
    seen.add(key);
    for (const t of x.topics ?? []) topicsUsed.add(t);
  }
  for (const c of corpus.translation_credits ?? []) {
    if (!works.has(c.work)) problems.push(`credit names a work not in philosophers.json: ${c.work}`);
    if (!c.translator || !c.year) problems.push(`credit for ${c.work} lacks a translator or a year`);
    if (!/^https?:\/\//.test(c.source_url ?? "")) problems.push(`credit for ${c.work} lacks a source url`);
    if (c.year > PUBLIC_DOMAIN_THROUGH) problems.push(`credit for ${c.work} is dated ${c.year}, which is not clear of copyright before ${PUBLIC_DOMAIN_THROUGH + 96}`);
  }
  // The index is what every page reads before it fetches anything, so it has to agree with
  // the files on disk: one entry per work, the count and the credit the file itself carries.
  const taken = new Set();
  for (const w of index.works) {
    const held = readWork(slug, w.slug);
    if (!held) { problems.push(`${w.slug}.json missing`); continue; }
    if (held.work !== w.work) problems.push(`${w.file} holds ${held.work}, the index says ${w.work}`);
    if (held.passages.length !== w.passages) problems.push(`${w.file} holds ${held.passages.length} passages, the index says ${w.passages}`);
    if (held.passages.some((x) => x.work !== w.work)) problems.push(`${w.file} holds a passage from another work`);
    if (w.file !== `${w.slug}.json`) problems.push(`${w.work} is indexed as ${w.file} under the slug ${w.slug}`);
    if (w.slug !== workSlug(w.work, taken)) problems.push(`${w.work} is filed as ${w.slug}`);
    if (held.translation_credit?.work !== w.work) problems.push(`${w.file} carries no credit of its own`);
    taken.add(w.slug);
  }
  if (index.works.length !== new Set(index.works.map((w) => w.work)).size) problems.push("a work is indexed twice");
  if (short) problems.push(`${short} passages under ${MIN_WORDS} words`);
  if (long) problems.push(`${long} passages over ${MAX_WORDS} words`);
  if (!corpus.passages.length) problems.push("no passages");

  totalPassages += corpus.passages.length;
  check(
    problems.length === 0,
    `${slug}: ${corpus.passages.length} passages, ${topicsUsed.size} subjects`,
    problems.slice(0, 3).join("; "),
  );
}

check(totalBytes < 25 * 1024 * 1024, "the corpus stays under 25MB", `${(totalBytes / 1024 / 1024).toFixed(1)}MB, ${totalPassages} passages`);
check(
  heaviest.bytes < MAX_WORK_BYTES,
  "no single work file passes 400KB",
  `heaviest ${heaviest.file} at ${Math.round(heaviest.bytes / 1024)}KB`,
);

// Retrieval has to find a passage from its own wording. Twelve words out of a passage,
// asked back, must bring that same passage into the top four.
for (const slug of slugs) {
  const corpus = { passages: readIndex(slug).works.flatMap((w) => readWork(slug, w.slug).passages) };
  const step = Math.max(1, Math.floor(corpus.passages.length / 12));
  let asked = 0;
  let found = 0;
  for (let i = 0; i < corpus.passages.length; i += step) {
    const want = corpus.passages[i];
    const query = want.text.trim().split(/\s+/).slice(6, 18).join(" ");
    if (tokenize(query).length < 4) continue;
    asked++;
    if (retrieve(slug, query, 4).some((h) => h.text === want.text)) found++;
  }
  check(asked > 0 && found / asked >= 0.9, `${slug} finds its own passages`, `${found} of ${asked}`);
}

// And it has to be useful against the questions the heartbeat actually draws from. A corpus
// need not answer every subject in the pool, because a book of logic has nothing to say
// about love, but most of the pool should reach something.
const questions = topics.map((t) => t.question);
for (const slug of slugs) {
  let hit = 0;
  for (const q of questions) {
    const hits = retrieve(slug, q, 4);
    if (hits.length && hits.every((h) => h.text && h.work)) hit++;
  }
  check(hit / questions.length >= 0.6, `${slug} answers the topic pool`, `${hit} of ${questions.length} questions`);
}

// A shelf is only a shelf if the retriever reaches all of it. Before the corpus grew, most
// philosophers held one or two works and this could not be asked; now Plato holds
// twenty-three, and a work nothing ever retrieves is a work the philosophers never quote.
// A work under ten passages is exempt: it can lose every query to a longer one and still be
// worth holding.
for (const slug of slugs) {
  const reached = new Set();
  for (const q of questions) for (const h of retrieve(slug, q, 4)) reached.add(h.work);
  const missed = readIndex(slug)
    .works.filter((w) => w.passages >= 10 && !reached.has(w.work))
    .map((w) => w.slug);
  check(missed.length === 0, `${slug}: every work of ten passages or more is reachable`, missed.slice(0, 3).join(", "));
}

// A philosopher with no corpus is a normal state, not an error.
const noCorpus = philosophers.map((p) => p.slug).filter((s) => !slugs.includes(s));
check(
  noCorpus.every((s) => retrieve(s, "what is the good life", 4).length === 0),
  "philosophers without a corpus retrieve nothing",
  `${noCorpus.length} of ${philosophers.length}`,
);

check(tokenize("The Sufferings of a Philosopher").join(" ") === "suffer philosopher", "the tokenizer stems and drops stop words", tokenize("The Sufferings of a Philosopher").join(" "));

// The prompt actually carries the pages, cited, with the instruction that binds a quotation
// to them. No model is called: this is the string the model would be given.
{
  const slug = "marcus-aurelius";
  const phil = bySlug[slug];
  const pages = ownPages(slug, "Is it possible to find meaning in work?", [
    { speaker: "zhuangzi", content: "Meaning is not something work contains, like rice in a box." },
  ]);
  check(pages.length > 0, "retrieval finds pages for a real question", `${pages.length} passages`);
  const block = passageBlock(slug, pages);
  const cited = pages.every((x) => block.includes(x.work) && (!x.ref || block.includes(x.ref)));
  const credit = creditFor(slug, pages[0]?.work);
  check(cited, "every page in the prompt carries its work and reference");
  check(block.includes(`translated by ${credit?.translator}`), "the prompt names the translator", credit?.translator);
  check(
    /must be copied exactly from this list/.test(block),
    "the prompt binds direct quotation to the retrieved pages",
  );
  const words = block.trim().split(/\s+/).length;
  check(words < 2100, "the page block stays near the word cap", `${words} words`);

  const system = systemPrompt(phil, philosophers, pages);
  const rules = [1, 2, 3, 4, 5, 6, 7, 8].every((n) => system.includes(`\n${n}. `));
  check(rules, "rules 1 to 8 survive the injection");
  check(system.indexOf("## Rules") < system.indexOf("## Your own pages"), "the pages come after the rules");
  const bare = systemPrompt(phil, philosophers);
  check(!bare.includes("## Your own pages"), "a prompt without pages carries no empty section");
}

console.log(failed ? `\n${failed} checks failed` : `\nthe corpus and its retrieval hold: ${slugs.length} philosophers, ${totalPassages} passages`);
process.exit(failed ? 1 : 0);

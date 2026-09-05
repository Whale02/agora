// Every quotation in every conversation, checked against the corpus it claims to come from.
//
//     node engine/test-quotes.mjs
//     node engine/test-quotes.mjs docs/data/conversations/2026-09-05-kind-or-honest.json
//
// A philosopher in a thread may argue from his pages without quoting them, and that is a
// normal state. What he may not do is put words in quotation marks, or set a line of Chinese
// beside his English, that the library does not hold. This walks every message, pulls the
// spans that are presented as quotation, and exits 1 on any that is not in the corpus word
// for word. It also reports the longest run each message shares with its speaker's own
// pages, because a quotation embedded without marks is still a quotation and the number says
// whether a thread is reading the library or talking around it.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { corpusSlugs, readIndex, readWork } from "./corpus.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONVERSATIONS = path.join(ROOT, "docs", "data", "conversations");

// A quoted span is short enough to be a phrase and long enough to be a claim. Under these a
// pair of quotation marks is scare quotes or a word being named, not a citation.
const MIN_WORDS = 4;
const MIN_HANZI = 6;

const CJK = /[㐀-䶿一-鿿]/;

// English, reduced to what a reader would call the same words: case, punctuation and the
// scan's spacing around its quotation marks all come out.
const flatEn = (s) =>
  String(s)
    .toLowerCase()
    .replace(/[‘’“”]/g, "'")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

// Chinese, reduced the same way: the punctuation a transcription chooses is not the text.
const flatZh = (s) => String(s).replace(/[^㐀-䶿一-鿿]/g, "");

const enWords = (s) => flatEn(s).split(" ").filter(Boolean);

// The whole library, per philosopher and once more all together, so a span can be looked for
// in the speaker's own pages first and in everyone else's after.
const shelves = new Map();
for (const slug of corpusSlugs()) {
  const en = [];
  const zh = [];
  for (const w of readIndex(slug).works) {
    const file = readWork(slug, w.slug);
    if (!file) continue;
    for (const p of file.passages) {
      en.push({ work: w.work, flat: flatEn(p.text) });
      if (p.text_original) zh.push({ work: w.work, flat: flatZh(p.text_original) });
    }
  }
  shelves.set(slug, { en, zh });
}

const holds = (slug, span) => {
  const shelf = shelves.get(slug);
  if (!shelf) return null;
  if (CJK.test(span)) {
    const want = flatZh(span);
    return want ? (shelf.zh.find((p) => p.flat.includes(want))?.work ?? null) : null;
  }
  const want = flatEn(span);
  return want ? (shelf.en.find((p) => p.flat.includes(want))?.work ?? null) : null;
};

const holdsAnywhere = (span) => {
  for (const slug of shelves.keys()) {
    const work = holds(slug, span);
    if (work) return { slug, work };
  }
  return null;
};

// The longest run of words this message shares with the philosopher's own pages, found by
// growing a run from each starting word for as long as the corpus still holds it.
function longestRun(slug, text) {
  const shelf = shelves.get(slug);
  if (!shelf) return { words: 0 };
  const words = enWords(text);
  let best = { words: 0, said: "", work: null };
  for (let i = 0; i < words.length; i++) {
    if (words.length - i <= best.words) break;
    let hit = null;
    for (let n = best.words + 1; i + n <= words.length; n++) {
      const want = words.slice(i, i + n).join(" ");
      const work = shelf.en.find((p) => p.flat.includes(want))?.work;
      if (!work) break;
      hit = { words: n, said: want, work };
    }
    if (hit) best = hit;
  }
  return best;
}

// The spans a message presents as quotation are what sits inside a pair of double quotation
// marks and any run of Chinese, since these threads set the Chinese beside the English
// exactly when a Chinese thinker is quoting himself.
//
// Quotation marks do two jobs. They cite a text, and they name a form of words the speaker is
// about to examine: the maxim "I may make an exception of myself" is Kant putting a maxim
// into words, not Kant quoting a page. A naming word directly in front of the quote is the
// mark of the second, and only the first is checked against the library.
const NAMES_A_FORM_OF_WORDS = /\b(maxim|maxims|phrase|phrasing|rule|term|terms|word|words|formula|formulation|question|slogan|so-called|called|name|names|named)\b[\s:,]*$/i;

function quotedSpans(content) {
  const out = [];
  const text = String(content);
  for (const m of text.matchAll(/["“]([^"“”]+)["”]/g)) {
    if (enWords(m[1]).length < MIN_WORDS) continue;
    const before = text.slice(Math.max(0, m.index - 40), m.index);
    out.push({ span: m[1].trim(), mention: NAMES_A_FORM_OF_WORDS.test(before) });
  }
  for (const m of text.matchAll(/[㐀-䶿一-鿿、。，：；？！「」『』‘’]+/g)) {
    if (flatZh(m[0]).length >= MIN_HANZI) out.push({ span: m[0].trim(), mention: false });
  }
  return out;
}

const only = process.argv.slice(2);
const files = (only.length ? only : fs.readdirSync(CONVERSATIONS).filter((f) => f.endsWith(".json")).map((f) => path.join(CONVERSATIONS, f))).sort();

let checked = 0;
let failures = 0;
let quoting = 0;
let mentions = 0;
const report = [];
for (const file of files) {
  const convo = JSON.parse(fs.readFileSync(file, "utf8"));
  const name = path.basename(file);
  let spansHere = 0;
  let longest = { words: 0 };
  for (const [i, m] of (convo.messages ?? []).entries()) {
    if (m.speaker_type !== "philosopher") continue;
    const slug = m.speaker;
    for (const { span, mention } of quotedSpans(m.content)) {
      if (mention) {
        mentions++;
        report.push(`  ${name} #${i} ${slug} names a form of words rather than citing one: ${JSON.stringify(span.slice(0, 60))}`);
        continue;
      }
      // A philosopher may quote what somebody at this table has already said, and that is not
      // a citation of the library. The span is compared in the script it is written in: an
      // English span reduces to nothing under the Chinese normaliser, and an empty needle is
      // inside every string, which would quietly excuse every quotation in the thread.
      const wantEn = flatEn(span);
      const wantZh = flatZh(span);
      const saidHere = (convo.messages ?? [])
        .slice(0, i)
        .some((earlier) =>
          wantZh ? flatZh(earlier.content).includes(wantZh) : wantEn && flatEn(earlier.content).includes(wantEn),
        );
      if (saidHere) continue;
      checked++;
      spansHere++;
      const own = holds(slug, span);
      if (own) continue;
      const elsewhere = holdsAnywhere(span);
      if (elsewhere) {
        report.push(`  ${name} #${i} ${slug} quotes ${elsewhere.slug}, ${elsewhere.work}: ${JSON.stringify(span.slice(0, 60))}`);
        continue;
      }
      failures++;
      report.push(`FAIL ${name} #${i} ${slug}: ${JSON.stringify(span.slice(0, 90))} is in no corpus`);
    }
    const run = longestRun(slug, m.content);
    if (run.words > longest.words) longest = { ...run, slug };
  }
  if (spansHere) quoting++;
  console.log(
    `${name.padEnd(48)} ${String(spansHere).padStart(3)} quoted, longest shared run ${String(longest.words).padStart(3)} words` +
      (longest.work ? ` (${longest.slug}, ${longest.work})` : ""),
  );
}

for (const line of report) console.log(line);
console.log(
  `\n${files.length} conversations, ${quoting} of them quoting, ${checked} quoted spans checked, ${failures} not in the corpus`,
);
process.exit(failures ? 1 : 0);

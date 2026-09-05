// Regenerate the status table inside SOURCES.md from the corpus on disk.
//
// The table says, philosopher by philosopher, how many works and passages the plaza holds
// and who translated them. Typing that by hand is how a document starts lying: the last
// version of it still said fourteen philosophers and 3,338 passages. This reads the corpus
// files and rewrites the block between the two markers, and nothing else in the file.
//
//     node scripts/build-sources-table.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { corpusSlugs, readIndex } from "../engine/corpus.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const FILE = path.join(ROOT, "SOURCES.md");
const OPEN = "<!-- generated: what the plaza holds -->";
const CLOSE = "<!-- end generated -->";

const roster = JSON.parse(fs.readFileSync(path.join(ROOT, "docs", "data", "philosophers.json"), "utf8"));
const held = new Set(corpusSlugs());

const rows = [];
for (const p of roster) {
  if (!held.has(p.slug)) continue;
  const index = readIndex(p.slug);
  const passages = index.works.reduce((n, w) => n + w.passages, 0);
  const years = index.works.map((w) => w.year);
  const translators = [...new Set(index.works.map((w) => w.translator))];
  rows.push({
    name: p.name_en,
    works: index.works.length,
    passages,
    span: Math.min(...years) === Math.max(...years) ? `${years[0]}` : `${Math.min(...years)} to ${Math.max(...years)}`,
    who: translators.length > 3 ? `${translators.slice(0, 3).join(", ")} and ${translators.length - 3} more` : translators.join(", "),
  });
}
rows.sort((a, b) => b.passages - a.passages);

const unquoted = roster.filter((p) => !held.has(p.slug));

const pad = (s, n) => String(s).padEnd(n);
const w1 = Math.max(...rows.map((r) => r.name.length), 10);
const table = [
  `    ${pad("Philosopher", w1)}  Works  Passages  Translations`,
  ...rows.map(
    (r) => `    ${pad(r.name, w1)}  ${String(r.works).padStart(5)}  ${String(r.passages).padStart(8)}  ${r.who}, ${r.span}`,
  ),
];

const totalWorks = rows.reduce((n, r) => n + r.works, 0);
const totalPassages = rows.reduce((n, r) => n + r.passages, 0);

const block = [
  OPEN,
  "",
  `${rows.length} of the ${roster.length} are quoted, from ${totalWorks} works and ${totalPassages.toLocaleString("en-US")} passages.`,
  "",
  ...table,
  "",
  `The other ${unquoted.length} are listed and unquoted: ${unquoted.map((p) => p.name_en).join(", ")}.`,
  "Socrates wrote nothing, and his profile points at the dialogues in which Plato records him.",
  "The rest wrote or write in copyright.",
  "",
  CLOSE,
].join("\n");

const src = fs.readFileSync(FILE, "utf8");
const from = src.indexOf(OPEN);
const to = src.indexOf(CLOSE);
if (from < 0 || to < 0) throw new Error(`SOURCES.md is missing the generated markers`);
fs.writeFileSync(FILE, src.slice(0, from) + block + src.slice(to + CLOSE.length), "utf8");
console.log(`SOURCES.md: ${rows.length} quoted, ${unquoted.length} listed and unquoted, ${totalWorks} works, ${totalPassages} passages`);

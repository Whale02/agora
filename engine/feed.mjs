// Build an Atom feed from the conversation index so readers can subscribe.
// Called after reindex; writes docs/feed.xml.
import fs from "node:fs";
import { PATHS, SITE } from "./config.mjs";
import { readJSON, philosophers, bySlug } from "./lib.mjs";

const esc = (s) =>
  String(s).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);

const index = readJSON(PATHS.index);
const all = bySlug(philosophers());
const conversations = index.conversations.slice(0, 20); // last 20

const updated = conversations[0]?.updated_at ?? new Date().toISOString();

const entries = conversations.map((c) => {
  const names = c.participants
    .map((s) => all[s]?.name_en ?? s)
    .join(", ");
  const url = `${SITE.url}/#/c/${c.id}`;
  return `  <entry>
    <title>${esc(c.topic)}</title>
    <link href="${esc(url)}" rel="alternate"/>
    <id>urn:agora:${esc(c.id)}</id>
    <updated>${c.updated_at}</updated>
    <summary>${esc(names)} discuss: ${esc(c.preview)}</summary>
    <category term="${esc(c.category ?? "general")}"/>
  </entry>`;
}).join("\n");

const feed = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${SITE.title}</title>
  <subtitle>Twenty-five philosophers from twenty-five centuries, arguing every four hours.</subtitle>
  <link href="${SITE.url}/feed.xml" rel="self"/>
  <link href="${SITE.url}" rel="alternate"/>
  <id>urn:agora:feed</id>
  <updated>${updated}</updated>
  <author><name>${SITE.title}</name></author>
${entries}
</feed>
`;

fs.writeFileSync("docs/feed.xml", feed, "utf8");
console.log(`feed.xml: ${conversations.length} entries, updated ${updated}`);

const REPO = "Whale02/agora";
const NEW_ISSUE = `https://github.com/${REPO}/issues/new`;

import { lang, onLang, setLang, subject as inWords, t } from "./i18n.mjs";

const $ = (sel, el = document) => el.querySelector(sel);
const main = $("#main");
const cache = new Map();

async function load(path) {
  if (cache.has(path)) return cache.get(path);
  const res = await fetch(path);
  if (!res.ok) throw new Error(`${res.status} loading ${path}`);
  const data = await res.json();
  cache.set(path, data);
  return data;
}

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const philosophersP = () => load("data/philosophers.json");
const indexP = () => load("data/index.json");

const glyph = (p) =>
  p.name_zh
    ? p.name_zh[0]
    : p.name_en.split(/[\s-]/).filter((w) => /^[A-Z]/.test(w)).slice(0, 2).map((w) => w[0]).join("");

const seat = (p, size = "") =>
  `<span class="seat ${size}" style="--seat:${esc(p.accent)}" title="${esc(p.name_en)}" aria-hidden="true">${esc(glyph(p))}</span>`;

const heatLevel = (heat) => (heat >= 0.65 ? 3 : heat >= 0.4 ? 2 : 1);

function heatMark(heat) {
  const level = heatLevel(heat);
  const word = t(`heat.${level}`);
  const strokes = [0, 1, 2]
    .map((i) => `<line class="stroke${i < level ? " on" : ""}" x1="${4 + i * 7}" y1="14" x2="${9 + i * 7}" y2="2" stroke-width="2.4" stroke-linecap="round"/>`)
    .join("");
  return `<span class="heat h${level}" title="${esc(t("heat.title"))}"><svg width="26" height="16" viewBox="0 0 26 16" aria-hidden="true">${strokes}</svg>${word}</span>`;
}

function ago(iso) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 3600) return t("ago.min", Math.max(1, Math.floor(s / 60)));
  if (s < 86400) return t("ago.hour", Math.floor(s / 3600));
  const d = Math.floor(s / 86400);
  if (d === 1) return t("ago.yesterday");
  if (d < 30) return t("ago.days", d);
  return new Date(iso).toLocaleDateString(lang() === "zh" ? "zh-Hans" : undefined, { month: "short", day: "numeric" });
}

const paragraphs = (text) => text.split(/\n\n+/).map((p) => `<p>${esc(p)}</p>`).join("");

function toast(msg) {
  const t = $(".toast");
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => (t.hidden = true), 2400);
}

function setNav(name, title) {
  document.querySelectorAll("[data-nav]").forEach((a) => {
    if (a.dataset.nav === name) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
  document.title = title ? t("doc.title.on", title) : t("doc.title");
}

/* ---------- plaza ---------- */

const plazaState = { category: null, type: null, sort: "recent", q: "" };

// The engine writes two kinds of conversation; the hub mockup's type chip carries them.
const typeLabel = (kind) => t(`type.${kind}`) === `type.${kind}` ? String(kind).replaceAll("_", " ") : t(`type.${kind}`);

const chips = (items, key, current) =>
  items
    .map(
      ([value, label]) =>
        `<button class="chip" data-${key}="${esc(value ?? "")}" aria-pressed="${current === value}">${esc(label)}</button>`,
    )
    .join("");

const DAY = 86400000;

async function renderPlaza() {
  setNav("plaza");
  main.innerHTML = `<p class="loading">${esc(t("loading.plaza"))}</p>`;
  const [idx, phils] = await Promise.all([indexP(), philosophersP()]);
  const by = Object.fromEntries(phils.map((p) => [p.slug, p]));
  const all = idx.conversations;
  const categories = [...new Set(all.map((c) => c.category).filter(Boolean))];
  const types = [...new Set(all.map((c) => c.type).filter(Boolean))];

  main.innerHTML = `
    <section class="canopy scene s-plaza split">
      <h1>${esc(t("plaza.h1"))}</h1>
      <p>${esc(t("plaza.lede"))}</p>
      <a class="ask" href="#/ask">${esc(t("plaza.ask"))}</a>
    </section>
    <div class="lead-slot"></div>
    <div class="filters">
      <label class="search">
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6"/><path d="M15.5 15.5 20 20"/></svg>
        <input type="search" id="plaza-q" placeholder="${esc(t("plaza.search.ph"))}" aria-label="${esc(t("plaza.search.aria"))}">
      </label>
      <div class="chiprow" role="group" aria-label="${esc(t("filter.subject"))}">
        ${chips([[null, t("filter.allsubjects")], ...categories.map((c) => [c, inWords(c)])], "cat", plazaState.category)}
      </div>
      ${
        types.length > 1
          ? `<div class="chiprow" role="group" aria-label="${esc(t("filter.kind"))}">
              ${chips([[null, t("filter.anykind")], ...types.map((k) => [k, typeLabel(k)])], "kind", plazaState.type)}
            </div>`
          : ""
      }
      <div class="chiprow sort" role="group" aria-label="${esc(t("filter.sort"))}">
        ${chips([["recent", t("sort.recent")], ["heat", t("sort.heat")]], "sort", plazaState.sort)}
      </div>
    </div>
    <p class="tally" role="status"></p>
    <ul class="tables"></ul>
    <div class="empty" hidden></div>`;

  const q = $("#plaza-q", main);
  q.value = plazaState.q;
  q.addEventListener("input", () => {
    plazaState.q = q.value;
    paint();
  });
  main.querySelectorAll("[data-cat]").forEach((b) =>
    b.addEventListener("click", () => {
      plazaState.category = b.dataset.cat || null;
      paint();
    }),
  );
  main.querySelectorAll("[data-kind]").forEach((b) =>
    b.addEventListener("click", () => {
      plazaState.type = b.dataset.kind || null;
      paint();
    }),
  );
  main.querySelectorAll("[data-sort]").forEach((b) =>
    b.addEventListener("click", () => {
      plazaState.sort = b.dataset.sort;
      paint();
    }),
  );

  async function paint() {
    const needle = plazaState.q.trim().toLowerCase();
    const list = all
      .filter((c) => !plazaState.category || c.category === plazaState.category)
      .filter((c) => !plazaState.type || c.type === plazaState.type)
      .filter((c) => !needle || haystack(c, by).includes(needle))
      .sort((a, b) => (plazaState.sort === "heat" ? b.heat - a.heat : b.updated_at.localeCompare(a.updated_at)));

    // The hottest table leads the plaza; its exchange is readable before anything else.
    const lead = [...list].sort((a, b) => b.heat - a.heat)[0];
    const rest = list.filter((c) => c !== lead);

    for (const b of main.querySelectorAll("[data-cat]")) {
      b.setAttribute("aria-pressed", String((b.dataset.cat || null) === plazaState.category));
    }
    for (const b of main.querySelectorAll("[data-kind]")) {
      b.setAttribute("aria-pressed", String((b.dataset.kind || null) === plazaState.type));
    }
    for (const b of main.querySelectorAll("[data-sort]")) {
      b.setAttribute("aria-pressed", String(b.dataset.sort === plazaState.sort));
    }

    $(".lead-slot", main).innerHTML = lead ? await leadTablet(lead, by) : "";
    $(".tally", main).textContent = tally(list);
    $(".tables", main).innerHTML = rest.map((c) => tablet(c, by)).join("");

    const empty = $(".empty", main);
    empty.hidden = list.length > 0;
    empty.innerHTML = list.length
      ? ""
      : needle
        ? `<h2>${esc(t("empty.nomatch.h"))}</h2><p>${esc(t("empty.nomatch.p", plazaState.q.trim()))}</p>`
        : `<h2>${esc(t("empty.notables.h"))}</h2><p>${esc(t("empty.notables.p"))}</p>`;
  }

  await paint();
}

// What the search reads: the question, the last thing said, who is seated, the subject.
function haystack(c, by) {
  const names = c.participants.flatMap((s) => [by[s]?.name_en, by[s]?.name_zh, s]).filter(Boolean);
  return [c.topic, c.preview, c.category, typeLabel(c.type), ...names].join(" ").toLowerCase();
}

// The count strip from the hub mockup, carrying the numbers this site can know for certain.
function tally(list) {
  const now = Date.now();
  const today = list.filter((c) => now - new Date(c.updated_at).getTime() < DAY).length;
  const seated = list.filter((c) => c.has_user).length;
  return [
    t("tally.tables", list.length),
    t("tally.today", today),
    seated ? t("tally.seated", seated) : t("tally.noseat"),
  ].join(" · ");
}

const trim = (text, n) => {
  const cut = text.replace(/\s+/g, " ").trim();
  return cut.length > n ? cut.slice(0, n).replace(/\s\S*$/, "") + "…" : cut;
};

// The lead table: the plaza's hottest exchange, its last two turns readable in the first viewport.
async function leadTablet(c, by) {
  let turns = [];
  try {
    const convo = await load(`data/conversations/${c.id}.json`);
    turns = convo.messages.slice(-2);
  } catch {
    return "";
  }
  const seats = c.participants.map((s) => by[s]).filter(Boolean);
  const live = turns
    .map((m) => {
      const p = by[m.speaker];
      const name = m.speaker_type === "user" ? m.speaker : p?.name_en ?? m.speaker;
      return `<div class="turn" style="--speaker:${esc(p?.accent ?? "var(--gold)")}">
        <span class="name">${esc(name)}</span>
        <p>${esc(trim(m.content, 190))}</p>
      </div>`;
    })
    .join("");
  return `<article class="tablet lead h${heatLevel(c.heat)}">
    <a class="cover" href="#/c/${esc(c.id)}" aria-label="${esc(t("tablet.enteraria", c.topic))}"></a>
    <div class="meta">
      <span class="seats">${seats.map((p) => seat(p)).join("")}</span>
      <span class="kind">${esc(typeLabel(c.type))}</span>
      ${heatMark(c.heat)}
    </div>
    <h2>${esc(c.topic)}</h2>
    <div class="live">${live}</div>
    <p class="enter">${esc(t("tablet.enter"))}</p>
  </article>`;
}

// One row per table, the hub mockup's list: who is seated, the question, the kind, the heat,
// how much has been said, when it last moved.
function tablet(c, by) {
  const seats = c.participants.map((s) => by[s]).filter(Boolean);
  const lastSpeaker = by[c.last_speaker]?.name_en;
  return `<li><article class="table-row h${heatLevel(c.heat)}">
    <a class="cover" href="#/c/${esc(c.id)}" aria-label="${esc(t("tablet.readaria", c.topic))}"></a>
    <span class="seats">${seats.map((p) => seat(p)).join("")}</span>
    <div class="what">
      <h2>${esc(c.topic)}</h2>
      <p class="voices">${seats.map((p) => esc(p.name_en)).join(" · ")}${c.has_user ? ` · ${esc(t("tablet.visitor"))}` : ""}</p>
      <p class="said">${esc(trim(c.preview, 118))}${lastSpeaker ? `<span class="who">${esc(lastSpeaker)}</span>` : ""}</p>
    </div>
    <div class="meta">
      <span class="kind">${esc(typeLabel(c.type))}</span>
      ${heatMark(c.heat)}
      <span class="count">${esc(t("tablet.exchanges", c.message_count))}</span>
      <span class="when">${ago(c.updated_at)}</span>
    </div>
  </article></li>`;
}

/* ---------- the room: one conversation, read ---------- */

// Every philosopher now has commissioned portrait art: eight from the engineer handoff, ten
// from the second commission, seven from the third. The set stays rather than becoming an
// assumption, so a twenty-sixth philosopher added without art falls back to the medallion the
// stylesheet cuts from their accent colour instead of requesting a file that is not there.
const PLATES = new Set([
  "socrates",
  "marcus-aurelius",
  "laozi",
  "zhuangzi",
  "nietzsche",
  "camus",
  "fromm",
  "naval",
  "plato",
  "seneca",
  "schopenhauer",
  "wang-yangming",
  "kant",
  "aristotle",
  "kierkegaard",
  "confucius",
  "wittgenstein",
  "epicurus",
  "zhuxi",
  "weil",
  "arendt",
  "beauvoir",
  "munger",
  "han",
  "taleb",
]);

const face = (p, size = "") =>
  PLATES.has(p.slug)
    ? `<span class="face ${size}" style="--seat:${esc(p.accent)}" aria-hidden="true"><img src="assets/p/${esc(p.slug)}.webp" alt="" loading="lazy" width="512" height="512"></span>`
    : seat(p, size);

async function renderConversation(id) {
  setNav("plaza");
  main.innerHTML = `<p class="loading">${esc(t("loading.table"))}</p>`;
  let convo;
  try {
    convo = await load(`data/conversations/${id}.json`);
  } catch {
    return renderMissing(t("room.missing.h"), t("room.missing.p"));
  }
  const phils = await philosophersP();
  const by = Object.fromEntries(phils.map((p) => [p.slug, p]));
  const seats = convo.participants.map((s) => by[s]).filter(Boolean);
  setNav("plaza", convo.topic);

  main.innerHTML = `
    <article class="thread">
      <p class="crumb"><a href="#/">${esc(t("room.back"))}</a></p>
      <header class="q scene s-thread split">
        <span class="kind">${esc(typeLabel(convo.type))}</span>
        <h1>${esc(convo.topic)}</h1>
        <div class="standing">
          <span class="seats">${seats.map((p) => seat(p)).join("")}</span>
          ${heatMark(convo.heat)}
          <span>${esc(t("tablet.exchanges", convo.messages.length))}</span>
          <span>${esc(t("room.began", ago(convo.created_at)))}</span>
        </div>
      </header>

      <section class="bench" aria-label="${esc(t("room.seated"))}">
        ${seats.map((p) => benchCard(p, convo.category)).join("")}
      </section>

      <div class="room">
        <div class="floor">
          <ol class="exchange">${convo.messages.map((m) => utterance(m, by)).join("")}</ol>
          <div class="sitdown scene s-rotunda centered">
            <p>${esc(t("room.open"))}</p>
            <button class="btn" data-join>${esc(t("room.sit"))}</button>
            <div class="actions">
              <button class="btn quiet" data-share>${esc(t("room.share"))}</button>
            </div>
          </div>
        </div>
        <aside class="apse" aria-labelledby="apse-t">
          <h2 id="apse-t">${esc(t("room.wrote"))}</h2>
          <div class="apse-body"><p class="waiting">${esc(t("loading.theirpages"))}</p></div>
        </aside>
      </div>
    </article>`;

  const door = $("[data-join]", main);
  door.addEventListener("click", () => ritual(convo, seats, door));
  $("[data-share]", main).addEventListener("click", async () => {
    const url = `${location.origin}${location.pathname.replace(/index\.html$/, "")}c/${convo.id}.html`;
    try {
      if (navigator.share) await navigator.share({ title: convo.topic, url });
      else {
        await navigator.clipboard.writeText(url);
        toast(t("room.shared"));
      }
    } catch { /* user dismissed */ }
  });

  // The sources rail fills after the thread is readable, so the reading never waits on it.
  fillSources(convo, seats);
}

// The seated rail from the room mockup. Nothing on the card is invented. Four of the topic
// pool's thirteen subjects match a key in the positions object, and where one does the card
// carries that documented position; otherwise it carries how this philosopher argues, which
// is the other thing the mockup's line under a name is doing.
function benchCard(p, category) {
  const stance = p.positions?.[category];
  const line = stance
    ? `<p class="stance"><span class="on">${esc(t("bench.on", inWords(category)))}</span>${esc(stance)}</p>`
    : p.voice
      ? `<p class="stance manner">${esc(p.voice)}</p>`
      : "";
  return `<article class="seated" style="--speaker:${esc(p.accent)}">
    <a class="cover" href="#/p/${esc(p.slug)}" aria-label="${esc(p.name_en)}"></a>
    ${face(p)}
    <div class="said-by">
      <span class="name">${esc(p.name_en)}</span>
      <span class="school">${esc(p.tradition)}</span>
      ${line}
    </div>
  </article>`;
}

const listWorks = (works, n = 3) => {
  const names = works.map((w) => shortWork(w.work));
  if (names.length <= n) return names.join(", ");
  return `${names.slice(0, n).join(", ")} ${t("credit.more", names.length - n)}`;
};

// Who translated the shelf. One or two names read as a credit; ten read as a list nobody
// finishes, so past three the line counts them and gives the span of years instead.
const creditLine = (credits) => {
  const who = [...new Set(credits.map((c) => c.translator))];
  const years = credits.map((c) => c.year);
  const from = Math.min(...years);
  const to = Math.max(...years);
  const when = from === to ? `${from}` : t("credit.span", from, to);
  if (who.length <= 3) return `${who.join(", ")}, ${when}`;
  return `${who.slice(0, 2).join(", ")} ${t("credit.others", who.length - 2)}, ${when}`;
};

// The room mockup's sources rail, carrying the corpus this repository holds.
async function fillSources(convo, seats) {
  const body = $(".apse-body", main);
  if (!body) return;
  let manifest;
  try {
    manifest = await load("data/passages.json");
  } catch {
    manifest = { philosophers: [] };
  }
  const held = Object.fromEntries(manifest.philosophers.map((p) => [p.slug, p]));
  const subject = convo.category;

  const cards = seats.map((p) => {
    const m = held[p.slug];
    if (!m) {
      return `<article class="source none">
        <h3><a href="#/p/${esc(p.slug)}">${esc(p.name_en)}</a></h3>
        <p class="credit">${esc(listWorks(p.works.map((w) => ({ work: w })), 2))}</p>
        <p class="counts">${esc(t("rail.listed", p.name_en))}</p>
      </article>`;
    }
    const onSubject = m.topics.find((t) => t.topic === subject)?.count ?? 0;
    return `<article class="source">
      <h3><a href="#/p/${esc(p.slug)}">${esc(p.name_en)}</a></h3>
      <p class="credit">${esc(listWorks(m.works))}, ${esc(t("credit.by", creditLine(m.translation_credits), ""))}</p>
      <p class="counts">${esc(t("count.passages", m.passages))}${onSubject ? ` · ${esc(t("count.passages.on", onSubject, inWords(subject)))}` : ""}</p>
      <button class="btn quiet small" data-passages="${esc(p.slug)}">
        ${esc(onSubject ? t("rail.readon", p.name_en, inWords(subject)) : t("rail.read", p.name_en))}
      </button>
      <div class="passages" hidden></div>
    </article>`;
  });

  body.innerHTML = cards.join("");

  body.querySelectorAll("[data-passages]").forEach((b) =>
    b.addEventListener("click", async () => {
      const slug = b.dataset.passages;
      const drawer = b.nextElementSibling;
      if (!drawer.hidden) {
        drawer.hidden = true;
        b.textContent = b.dataset.label ?? b.textContent;
        return;
      }
      b.dataset.label ??= b.textContent.trim();
      b.textContent = "Fetching the pages…";
      b.disabled = true;
      try {
        const chosen = pickWork(held[slug].works, subject);
        const file = await workP(slug, chosen.file);
        const picked = pickPassages(file.passages, subject, 3);
        drawer.innerHTML = picked.length
          ? picked.map((x) => passageCard(x, file.translation_credit, file.original_credit)).join("")
          : `<p class="counts">${esc(t("rail.nothing", inWords(subject)))}</p>`;
        drawer.hidden = false;
        b.textContent = "Close";
      } catch {
        b.textContent = "Those pages did not load";
      } finally {
        b.disabled = false;
      }
    }),
  );
}

// Prefer passages already tagged with this conversation's subject, then fill from the rest,
// and take the shorter ones so a rail stays a rail.
function pickPassages(passages, subject, n) {
  const onSubject = passages.filter((p) => (p.topics ?? []).includes(subject));
  const pool = onSubject.length ? onSubject : passages;
  return [...pool].sort((a, b) => a.text.length - b.text.length).slice(0, n);
}

// A passage, with the philosopher's own language above the English wherever the corpus
// holds it. The original is the text; the translation is one reading of it, so the original
// goes first and the translator is named on the English, the edition on the original.
function passageCard(x, credit, original) {
  return `<figure class="passage">
    ${x.text_original ? `<blockquote class="original" lang="${esc(original?.lang ?? "")}">${esc(trim(x.text_original, 200))}</blockquote>` : ""}
    <blockquote>${esc(trim(x.text, 320))}</blockquote>
    <figcaption>
      ${esc(shortWork(x.work))}${x.ref ? `, ${esc(x.ref)}` : ""}${credit ? `, translated by ${esc(credit.translator)}, ${credit.year}` : ""}
      ${credit?.source_url ? `<a href="${esc(credit.source_url)}" rel="noopener">source</a>` : ""}
      ${x.text_original && original ? `<span class="from-original">${esc(original.title)}${original.source_url ? `, <a href="${esc(original.source_url)}" rel="noopener">${esc(sourceName(original.source_url))}</a>` : ""}</span>` : ""}
    </figcaption>
  </figure>`;
}

function utterance(m, by) {
  if (m.speaker_type === "user") {
    return `<li><article class="utterance visitor">
      <div class="said"><span class="name">${esc(m.speaker)}</span><span class="school">${esc(t("utterance.visitor"))}</span></div>
      <div class="body">${paragraphs(m.content)}</div>
    </article></li>`;
  }
  const p = by[m.speaker];
  if (!p) return "";
  return `<li><article class="utterance" style="--speaker:${esc(p.accent)}">
    <div class="said">
      ${seat(p)}
      <span class="name"><a href="#/p/${esc(p.slug)}">${esc(p.name_en)}</a></span>
      <span class="school">${esc(p.tradition)}</span>
    </div>
    <div class="body">${paragraphs(m.content)}</div>
  </article></li>`;
}

// `opener` is passed in rather than read off document.activeElement, which is the body when
// the button is activated by anything other than a pointer.
function ritual(convo, seats, opener) {
  const wrap = document.createElement("div");
  wrap.className = "ritual-backdrop";
  wrap.innerHTML = `<div class="ritual" role="dialog" aria-modal="true" aria-labelledby="ritual-t">
    <h2 id="ritual-t">${esc(t("ritual.h"))}</h2>
    <p>${esc(convo.topic)}</p>
    <div class="table-of">${seats.map((p) => seat(p)).join("")}<span>${esc(t("ritual.who", seats.map((p) => p.name_en).join(", ")))}</span></div>
    <p class="how">${esc(t("ritual.how"))}</p>
    <div class="row">
      <button class="btn quiet" data-x>${esc(t("ritual.stay"))}</button>
      <a class="btn" data-go rel="noopener" href="${NEW_ISSUE}?template=join.yml&title=${encodeURIComponent(`[Join] ${convo.id}`)}">${esc(t("ritual.go"))}</a>
    </div>
  </div>`;
  document.body.appendChild(wrap);
  function close() {
    document.removeEventListener("keydown", onKey);
    wrap.remove();
    if (opener instanceof HTMLElement) opener.focus();
  }
  function onKey(e) {
    if (e.key === "Escape") return close();
    if (e.key !== "Tab") return;
    const f = [...wrap.querySelectorAll("button, a[href]")];
    const edge = e.shiftKey ? f[0] : f[f.length - 1];
    if (document.activeElement === edge) {
      e.preventDefault();
      (e.shiftKey ? f[f.length - 1] : f[0]).focus();
    }
  }
  document.addEventListener("keydown", onKey);
  $("[data-x]", wrap).addEventListener("click", close);
  wrap.addEventListener("click", (e) => e.target === wrap && close());
  $("[data-go]", wrap).focus();
}

/* ---------- philosophers ---------- */

async function renderRoster() {
  setNav("philosophers", t("roster.title"));
  main.innerHTML = `<p class="loading">${esc(t("loading.roll"))}</p>`;
  const phils = await philosophersP();
  main.innerHTML = `
    <section class="roster-head scene s-roster split">
      <h1>${esc(t("roster.h1"))}</h1>
      <p>${esc(t("roster.lede"))}</p>
    </section>
    <ul class="roster">
      ${phils
        .map(
          (p) => `<li><a href="#/p/${esc(p.slug)}">
            ${face(p, "lg")}
            <span><span class="name">${esc(p.name_en)}</span>${p.name_zh ? `<span class="zh">${esc(p.name_zh)}</span>` : ""}
            <span class="line">${esc(p.short_bio)}</span></span>
          </a></li>`,
        )
        .join("")}
    </ul>`;
}

async function renderPhilosopher(slug) {
  setNav("philosophers");
  main.innerHTML = `<p class="loading">${esc(t("loading.crowd"))}</p>`;
  const [phils, idx] = await Promise.all([philosophersP(), indexP()]);
  const p = phils.find((x) => x.slug === slug);
  if (!p) return renderMissing(t("phil.missing.h"), t("phil.missing.p"));
  const by = Object.fromEntries(phils.map((x) => [x.slug, x]));
  setNav("philosophers", p.name_en);
  const theirs = idx.conversations.filter((c) => c.participants.includes(slug));

  main.innerHTML = `
    <p class="crumb"><a href="#/philosophers">${esc(t("phil.back"))}</a></p>
    <header class="figure scene s-figure">
      <div class="portrait">
        ${face(p, "xl")}
        ${PLATES.has(p.slug) ? `<p class="drawn">${esc(t("phil.drawn"))}</p>` : ""}
      </div>
      <div class="titles">
        <h1>${esc(p.name_en)}${p.name_zh ? `<span class="zh">${esc(p.name_zh)}</span>` : ""}</h1>
        <p class="school">${esc(p.tradition)}</p>
        <p class="bio">${esc(p.short_bio)}</p>
        <ul class="topics">${p.key_topics.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
      </div>
      <aside class="era" aria-label="${esc(t("phil.wherearia"))}">
        <dl>
          <dt>${esc(t("phil.era"))}</dt><dd>${esc(p.era)}</dd>
          <dt>${esc(t("phil.tradition"))}</dt><dd>${esc(p.tradition)}</dd>
          <dt>${esc(t("phil.inplaza"))}</dt><dd>${esc(theirs.length ? t("phil.tables", theirs.length) : t("phil.notable"))}</dd>
          <dt>${esc(t("phil.workslisted"))}</dt><dd data-corpus>${p.works.length}</dd>
        </dl>
        <a class="btn" href="#/ask/${esc(p.slug)}">${esc(t("phil.ask", p.name_en))}</a>
      </aside>
    </header>

    <div class="dossier">
      <div class="col-main">
        <section class="identity">
          ${paragraphs(p.identity)}
        </section>
        <h2>${esc(t("phil.positions"))}</h2>
        <dl class="positions">
          ${Object.entries(p.positions)
            .map(([k, v]) => `<dt>${esc(t("bench.on", inWords(k.replaceAll("_", " "))))}</dt><dd>${esc(v)}</dd>`)
            .join("")}
        </dl>
        ${
          theirs.length
            ? `<h2>${esc(t("phil.attables"))}</h2><ul class="tables">${theirs.map((c) => tablet(c, by)).join("")}</ul>`
            : `<h2>${esc(t("phil.attables"))}</h2><p class="none">${esc(t("phil.notseated", p.name_en))}</p>`
        }
      </div>

      <aside class="col-side">
        <h2>${esc(t("phil.sources"))}</h2>
        <div class="works"><ul>${p.works.map((w) => `<li>${esc(w)}</li>`).join("")}</ul></div>
        ${p.sep ? `<p class="sep-link">${esc(t("phil.sep", p.name_en))}<a href="${esc(p.sep)}" rel="noopener">${esc(t("phil.sep.link"))}</a>.</p>` : ""}
        <h2>${esc(t("phil.inplaza"))}</h2>
        <ul class="kin">
          ${p.relationships
            .map((r) => {
              const o = by[r.slug];
              return o
                ? `<li><a href="#/p/${esc(o.slug)}">${esc(o.name_en)}</a><span class="rel">${esc(r.kind)}, ${esc(r.note)}</span></li>`
                : "";
            })
            .join("")}
        </ul>
      </aside>
    </div>`;

  fillProfileSources(p);
}

// The mockup's sources card, filled from the corpus this repository holds. Nothing appears
// here that the passage files do not already contain.
async function fillProfileSources(p) {
  let manifest;
  try {
    manifest = await load("data/passages.json");
  } catch {
    return;
  }
  const m = manifest.philosophers.find((x) => x.slug === p.slug);
  const works = $(".works", main);
  if (!works) return;
  if (!m) {
    works.insertAdjacentHTML(
      "beforeend",
      `<p class="none">${esc(t("rail.listed.long", p.name_en))}</p>`,
    );
    await fillRecordOf(p, works);
    return;
  }
  const counted = new Map(m.works.map((w) => [w.work, w.count]));
  works.innerHTML = `<ul>${p.works
    .map((w) => {
      const n = counted.get(w);
      return `<li>${esc(w)}${n ? `<span class="rel">${esc(t("count.passages", n))}</span>` : ""}</li>`;
    })
    .join("")}</ul>
    <p class="credit">${esc(t("phil.held", m.passages, creditLine(m.translation_credits)))}</p>
    <button class="btn quiet small" data-passages="${esc(p.slug)}">${esc(t("phil.readown"))}</button>
    <div class="passages" hidden></div>`;

  const count = $("[data-corpus]", main);
  if (count) count.textContent = t("phil.corpus", p.works.length, m.passages);

  $("[data-passages]", works).addEventListener("click", async (e) => {
    const b = e.currentTarget;
    const drawer = $(".passages", works);
    if (!drawer.hidden) {
      drawer.hidden = true;
      b.textContent = t("phil.readown");
      return;
    }
    b.textContent = t("rail.fetching");
    b.disabled = true;
    try {
      const chosen = pickWork(m.works, p.key_topics[0]);
      const file = await workP(p.slug, chosen.file);
      const picked = pickPassages(file.passages, p.key_topics[0], 3);
      drawer.innerHTML = picked.map((x) => passageCard(x, file.translation_credit, file.original_credit)).join("");
      drawer.hidden = false;
      b.textContent = "Close";
    } catch {
      b.textContent = "Those pages did not load";
    } finally {
      b.disabled = false;
    }
  });
}

// A thinker the plaza cannot quote may still be in the corpus, written about by someone it
// can. Socrates wrote nothing at all, and what survives of him is Plato's record. The
// dialogues below and their counts come out of mentions.json, which the manifest build
// writes by counting the passages that name him; nothing here is typed.
async function fillRecordOf(p, works) {
  let mentions;
  try {
    mentions = (await load("data/mentions.json")).philosophers[p.slug];
  } catch {
    return;
  }
  if (!mentions?.length) return;

  const [phils, manifest] = await Promise.all([philosophersP(), manifestP()]);
  const by = Object.fromEntries(phils.map((x) => [x.slug, x]));
  const writers = [...new Set(mentions.map((x) => x.slug))];
  const main_writer = writers
    .map((slug) => ({ slug, count: mentions.filter((x) => x.slug === slug).reduce((n, x) => n + x.count, 0) }))
    .sort((a, b) => b.count - a.count)[0];
  const theirs = mentions.filter((x) => x.slug === main_writer.slug);
  const rest = mentions.filter((x) => x.slug !== main_writer.slug);
  const writer = by[main_writer.slug];
  if (!writer) return;

  works.insertAdjacentHTML(
    "beforeend",
    `<div class="record-of">
      <h3>${esc(t("record.h", writer.name_en, p.name_en))}</h3>
      <p>${esc(t("record.p", p.name_en, writer.name_en, theirs.length, commas(main_writer.count)))}</p>
      <ul class="of">
        ${theirs
          .map(
            (x) => `<li><a href="#/read/${esc(x.slug)}/${esc(x.work_slug)}">${esc(shortWork(x.work))}</a><span class="rel">${esc(t("count.passages", x.count))}</span></li>`,
          )
          .join("")}
      </ul>
      ${
        rest.length
          ? `<p class="counts">${esc(t("record.more", commas(rest.reduce((n, x) => n + x.count, 0)), [...new Set(rest.map((x) => x.slug))].length))}</p>`
          : ""
      }
      <button class="btn quiet small" data-record="${esc(p.slug)}">${esc(t("record.read", writer.name_en))}</button>
      <div class="passages" hidden></div>
    </div>`,
  );

  const holder = $(".record-of", works);
  $("[data-record]", holder).addEventListener("click", async (e) => {
    const b = e.currentTarget;
    const drawer = $(".passages", holder);
    if (!drawer.hidden) {
      drawer.hidden = true;
      b.textContent = t("record.read", writer.name_en);
      return;
    }
    b.textContent = t("rail.fetching");
    b.disabled = true;
    try {
      const held = manifest.philosophers.find((x) => x.slug === main_writer.slug);
      const chosen = held.works.find((w) => w.slug === theirs[0].work_slug);
      const file = await workP(main_writer.slug, chosen.file);
      const needle = new RegExp("\\b" + p.name_en + "\\b");
      const picked = file.passages.filter((x) => needle.test(x.text)).slice(0, 3);
      drawer.innerHTML = picked.map((x) => passageCard(x, file.translation_credit, file.original_credit)).join("");
      drawer.hidden = false;
      b.textContent = "Close";
    } catch {
      b.textContent = "Those pages did not load";
    } finally {
      b.disabled = false;
    }
  });
}

/* ---------- the library: sources and the reader ---------- */

const manifestP = () => load("data/passages.json");

// One work, not a philosopher's whole shelf. The manifest already carries the counts, the
// credits and the file name for every work held, so a page that wants three passages from
// the Republic fetches the Republic.
const workP = (slug, file) => load(`data/passages/${slug}/${file}`);

// The work most likely to speak to a subject: one that lists it, largest first, and
// otherwise the largest work on the shelf.
function pickWork(works, subject) {
  const on = works.filter((w) => (w.topics ?? []).includes(subject));
  return [...(on.length ? on : works)].sort((a, b) => b.count - a.count)[0];
}

// A philosopher's era string is prose. This pulls the first year out of it, negative for BC,
// so the shelf and the timeline can stand in order without a second field in the data.
function eraYear(era) {
  const bc = /\bBC\b/.test(era);
  const century = /(\d+)(?:st|nd|rd|th)\s+century/i.exec(era);
  if (century) {
    const c = Number(century[1]);
    return bc ? -(c * 100) : (c - 1) * 100;
  }
  const first = /(\d{1,4})/.exec(era);
  if (!first) return 0;
  const n = Number(first[1]);
  return bc ? -n : n;
}

const commas = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

// Which library a source url points at. Only the four the sourcing law allows can appear,
// and a url from anywhere else is named by its host rather than dressed up.
function sourceName(url) {
  const host = /^https?:\/\/([^/]+)/.exec(url ?? "")?.[1] ?? "";
  if (/gutenberg\.org$/.test(host)) return "Project Gutenberg";
  if (/wikisource\.org$/.test(host)) return "Wikisource";
  if (/archive\.org$/.test(host)) return "the Internet Archive";
  if (/ctext\.org$/.test(host)) return "the Chinese Text Project";
  if (/zeno\.org$/.test(host)) return "zeno.org";
  return host.replace(/^www\./, "");
}

// How many of the twenty-five the plaza can quote. The sentence that opens the library says
// it in words, and the number has to come from the manifest rather than from a copy edit.
const NUMBERS = ["None", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen", "Twenty"];
const held = (n) => NUMBERS[n] ?? String(n);

// Every work in the library, flattened, in the order the thinkers lived.
function shelf(manifest, by) {
  const out = [];
  for (const m of manifest.philosophers) {
    const p = by[m.slug];
    if (!p) continue;
    for (const w of m.works) {
      const credit = m.translation_credits.find((c) => c.work === w.work);
      out.push({ ...w, work_slug: w.slug, slug: m.slug, phil: p, credit, year: eraYear(p.era) });
    }
  }
  return out.sort((a, b) => a.year - b.year || a.phil.name_en.localeCompare(b.phil.name_en) || b.count - a.count);
}

// A work title carries its own gloss in philosophers.json for the compiled sources, which
// reads well in a list of works and badly in a citation.
const shortWork = (w) => w.replace(/,\s+(?:my|as|especially|including|published|compiled|set|books|written|recorded|together|with)\b.*$/, "");

const sourcesState = { q: "", who: null, subject: null };

async function renderSources() {
  setNav("sources", t("sources.title"));
  main.innerHTML = `<p class="loading">${esc(t("loading.library"))}</p>`;
  const [manifest, phils, idx] = await Promise.all([manifestP(), philosophersP(), indexP()]);
  const by = Object.fromEntries(phils.map((p) => [p.slug, p]));
  const all = shelf(manifest, by);
  const subjects = [...new Set(all.flatMap((w) => w.topics))].sort();
  const passages = manifest.philosophers.reduce((n, m) => n + m.passages, 0);
  const words = manifest.philosophers.reduce((n, m) => n + m.words, 0);

  // The day's passage, chosen by the date so everyone sees the same one and nobody has to
  // be tracked to make it change.
  const daily = (await dailyPages(manifest, by, 1)).map((d) => pageCard(d, { label: t("lib.daily") })).join("");

  main.innerHTML = `
    <section class="canopy scene s-library split">
      <h1>${esc(t("lib.h1"))}</h1>
      <p>${esc(t("lib.lede", held(manifest.philosophers.length), commas(passages), all.length))}</p>
    </section>
    ${daily}
    <div class="filters">
      <label class="search">
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6"/><path d="M15.5 15.5 20 20"/></svg>
        <input type="search" id="lib-q" placeholder="${esc(t("lib.search.ph"))}" aria-label="${esc(t("lib.search.aria"))}">
      </label>
      <div class="chiprow" role="group" aria-label="${esc(t("filter.thinker"))}">
        ${chips([[null, t("filter.everyone")], ...[...new Set(all.map((w) => w.slug))].map((s) => [s, by[s].name_en])], "who", sourcesState.who)}
      </div>
      <div class="chiprow" role="group" aria-label="${esc(t("filter.subject"))}">
        ${chips([[null, t("filter.anysubject")], ...subjects.map((s) => [s, inWords(s)])], "subj", sourcesState.subject)}
      </div>
    </div>
    <p class="tally" role="status"></p>
    <ul class="shelf"></ul>
    <div class="empty" hidden></div>
    <section class="record">
      <h2>${esc(t("lib.record.h"))}</h2>
      <p class="note">${esc(t("lib.record.note"))}</p>
      <div class="scroller">
        <table>
          <thead>
            <tr><th>${esc(t("th.thinker"))}</th><th>${esc(t("th.work"))}</th><th>${esc(t("th.translator"))}</th><th>${esc(t("th.year"))}</th><th>${esc(t("th.passages"))}</th><th>${esc(t("th.where"))}</th></tr>
          </thead>
          <tbody>
            ${all
              .map(
                (w) => `<tr>
                  <td><a href="#/p/${esc(w.slug)}">${esc(w.phil.name_en)}</a></td>
                  <td><a href="#/read/${esc(w.slug)}/${esc(w.work_slug)}">${esc(shortWork(w.work))}</a></td>
                  <td>${w.credit ? esc(w.credit.translator) : "—"}</td>
                  <td>${w.credit ? w.credit.year : "—"}</td>
                  <td class="num">${commas(w.count)}</td>
                  <td>${w.credit ? `<a href="${esc(w.credit.source_url)}" rel="noopener">${esc(sourceName(w.credit.source_url))}</a>${w.credit.note ? `<span class="edition">${esc(w.credit.note)}</span>` : ""}` : "—"}</td>
                </tr>`,
              )
              .join("")}
          </tbody>
        </table>
      </div>
    </section>

    <section class="ages">
      <h2>${esc(t("lib.ages"))}</h2>
      <ol>
        ${manifest.philosophers
          .map((m) => by[m.slug])
          .filter(Boolean)
          .sort((a, b) => eraYear(a.era) - eraYear(b.era))
          .map(
            (p) => `<li><a href="#/p/${esc(p.slug)}">${seat(p)}<span class="name">${esc(p.name_en)}</span><span class="when">${esc(p.era)}</span></a></li>`,
          )
          .join("")}
      </ol>
    </section>`;

  const q = $("#lib-q", main);
  q.value = sourcesState.q;
  q.addEventListener("input", () => {
    sourcesState.q = q.value;
    paint();
  });
  main.querySelectorAll("[data-who]").forEach((b) =>
    b.addEventListener("click", () => {
      sourcesState.who = b.dataset.who || null;
      paint();
    }),
  );
  main.querySelectorAll("[data-subj]").forEach((b) =>
    b.addEventListener("click", () => {
      sourcesState.subject = b.dataset.subj || null;
      paint();
    }),
  );

  function paint() {
    const needle = sourcesState.q.trim().toLowerCase();
    const list = all
      .filter((w) => !sourcesState.who || w.slug === sourcesState.who)
      .filter((w) => !sourcesState.subject || w.topics.includes(sourcesState.subject))
      .filter(
        (w) =>
          !needle ||
          `${w.work} ${w.phil.name_en} ${w.phil.name_zh ?? ""} ${w.credit?.translator ?? ""} ${w.topics.join(" ")}`
            .toLowerCase()
            .includes(needle),
      );

    for (const b of main.querySelectorAll("[data-who]")) {
      b.setAttribute("aria-pressed", String((b.dataset.who || null) === sourcesState.who));
    }
    for (const b of main.querySelectorAll("[data-subj]")) {
      b.setAttribute("aria-pressed", String((b.dataset.subj || null) === sourcesState.subject));
    }

    $(".tally", main).textContent = t(
      "lib.tally",
      list.length,
      commas(list.reduce((n, w) => n + w.count, 0)),
      commas(list.reduce((n, w) => n + w.words, 0)),
    );
    $(".shelf", main).innerHTML = list.map((w) => volume(w, idx)).join("");
    const empty = $(".empty", main);
    empty.hidden = list.length > 0;
    empty.innerHTML = list.length ? "" : `<h2>${esc(t("lib.empty.h"))}</h2><p>${esc(t("lib.empty.p"))}</p>`;
  }

  paint();
}

function volume(w, idx) {
  const tables = idx.conversations.filter((c) => w.topics.includes(c.category)).length;
  return `<li><article class="volume">
    <a class="cover" href="#/read/${esc(w.slug)}/${esc(w.work_slug)}" aria-label="${esc(t("vol.readaria", shortWork(w.work)))}"></a>
    ${face(w.phil)}
    <div class="spine">
      <h2>${esc(shortWork(w.work))}</h2>
      <p class="by"><span class="who">${esc(w.phil.name_en)}</span> · <span class="when">${esc(w.phil.era)}</span></p>
      ${w.credit ? `<p class="credit">${esc(t("credit.by", w.credit.translator, w.credit.year))} · <a href="${esc(w.credit.source_url)}" rel="noopener">${esc(sourceName(w.credit.source_url))}</a>${w.credit.note ? `<span class="edition">${esc(w.credit.note)}</span>` : ""}</p>` : ""}
      <ul class="topics">${w.topics.slice(0, 5).map((x) => `<li>${esc(inWords(x))}</li>`).join("")}</ul>
    </div>
    <div class="tallies">
      <span><b>${w.count}</b> ${esc(t("vol.passages"))}</span>
      <span><b>${commas(w.words)}</b> ${esc(t("vol.words"))}</span>
      ${tables ? `<span><b>${tables}</b> ${esc(t("vol.tables", tables))}</span>` : ""}
    </div>
  </article></li>`;
}

/* ---------- the reader ---------- */

const READER_PAGE = 12;

// A book is read a stretch at a time. The stretches are fixed length so every corpus gets
// the same treatment, and each is labelled by the references at its ends, so the nav reads
// "Book I to Book III" rather than "page 2".
function stretches(passages) {
  const out = [];
  for (let i = 0; i < passages.length; i += READER_PAGE) {
    const part = passages.slice(i, i + READER_PAGE);
    const first = part[0]?.ref;
    const last = part.at(-1)?.ref;
    out.push({
      from: i,
      to: i + part.length,
      label: !first ? t("reader.range", i + 1, i + part.length) : first === last ? first : t("reader.range", first, last),
    });
  }
  return out;
}

async function renderReader(slug, workArg, sectionArg) {
  setNav("sources");
  main.innerHTML = `<p class="loading">${esc(t("loading.page"))}</p>`;
  const [manifest, phils, idx] = await Promise.all([manifestP(), philosophersP(), indexP()]);
  const by = Object.fromEntries(phils.map((p) => [p.slug, p]));
  const m = manifest.philosophers.find((x) => x.slug === slug);
  const p = by[slug];
  if (!m || !p) {
    return renderMissing("Nothing on that shelf", "The plaza holds no passages under that name. The library lists what it does hold.");
  }
  // A work is addressed by its own slug, so a link keeps working when the shelf grows. The
  // numeric form the library shipped before the split still resolves.
  const work =
    m.works.find((w) => w.slug === workArg) ??
    m.works[Math.min(Math.max(0, Number(workArg) || 0), m.works.length - 1)];
  const n = work.slug;
  setNav("sources", shortWork(work.work));

  let file;
  try {
    file = await workP(slug, work.file);
  } catch {
    return renderMissing("That book will not open", "The passages for this thinker did not load. The library page lists the rest.");
  }
  const credit = file.translation_credit;
  const passages = file.passages;
  const parts = stretches(passages);
  const sec = Math.min(Math.max(0, Number(sectionArg) || 0), parts.length - 1);
  const part = parts[sec];
  const shown = passages.slice(part.from, part.to);

  // What is being argued at the plaza on the subjects this book touches. Topic overlap is
  // the whole of the relation; nothing here is a commentary on the text.
  const related = idx.conversations
    .filter((c) => work.topics.includes(c.category))
    .slice(0, 5);

  main.innerHTML = `
    <p class="crumb"><a href="#/sources">${esc(t("reader.back"))}</a></p>
    <header class="folio scene s-library split">
      <h1>${esc(shortWork(work.work))}</h1>
      <p class="by"><a href="#/p/${esc(p.slug)}">${esc(p.name_en)}</a>${p.name_zh ? ` <span class="zh">${esc(p.name_zh)}</span>` : ""} · ${esc(p.era)}</p>
      ${credit ? `<p class="credit">${esc(t("reader.credit", credit.translator, credit.year))} <a href="${esc(credit.source_url)}" rel="noopener">${esc(t("reader.edition"))}</a>.${credit.note ? ` ${esc(credit.note)}` : ""}</p>` : ""}
      ${file.original_credit ? `<p class="credit">${esc(t("reader.original", ""))}<span lang="${esc(file.original_credit.lang ?? "")}">${esc(file.original_credit.title)}</span>${file.original_credit.edition ? `, ${esc(file.original_credit.edition)}` : ""}. <a href="${esc(file.original_credit.source_url)}" rel="noopener">${esc(t("reader.transcribed"))}</a>. ${esc(t("reader.aligned", work.paired ?? 0, passages.length))}${file.original_credit.note ? ` ${esc(file.original_credit.note)}` : ""}</p>` : ""}
      <p class="counts">${esc(t("reader.counts", passages.length, commas(work.words)))}</p>
    </header>

    ${
      m.works.length > 1
        ? `<nav class="volumes" aria-label="${esc(t("reader.works.aria", p.name_en))}">
            ${m.works
              .map(
                (w) =>
                  `<a href="#/read/${esc(slug)}/${esc(w.slug)}/0"${w.slug === n ? ' aria-current="page"' : ""}>${esc(shortWork(w.work))}<span>${w.count}</span></a>`,
              )
              .join("")}
          </nav>`
        : ""
    }

    ${
      parts.length > 1
        ? `<nav class="stretches" aria-label="${esc(t("reader.sections.aria", shortWork(work.work)))}">
            ${parts
              .map(
                (x, i) =>
                  `<a href="#/read/${esc(slug)}/${n}/${i}"${i === sec ? ' aria-current="page"' : ""}>${esc(x.label)}</a>`,
              )
              .join("")}
          </nav>`
        : ""
    }

    <div class="room">
      <div class="floor">
        <p class="reading">${esc(t("reader.reading", part.from + 1, part.to, passages.length))}</p>
        <ol class="pages">
          ${shown
            .map(
              (x, i) => `<li id="p${part.from + i + 1}">
                <div class="lineno">${part.from + i + 1}</div>
                <div class="page">
                  <p class="where">${x.ref ? esc(x.ref) : esc(shortWork(x.work))}</p>
                  ${x.text_original ? `<p class="body original" lang="${esc(file.original_credit?.lang ?? "")}">${esc(x.text_original)}</p>` : ""}
                  <p class="body">${esc(x.text)}</p>
                  <ul class="topics">${(x.topics ?? []).map((x2) => `<li>${esc(inWords(x2))}</li>`).join("")}</ul>
                </div>
              </li>`,
            )
            .join("")}
        </ol>
        ${
          parts.length > 1
            ? `<nav class="turn">
                ${sec > 0 ? `<a href="#/read/${esc(slug)}/${n}/${sec - 1}">← ${esc(parts[sec - 1].label)}</a>` : "<span></span>"}
                ${sec < parts.length - 1 ? `<a href="#/read/${esc(slug)}/${n}/${sec + 1}">${esc(parts[sec + 1].label)} →</a>` : "<span></span>"}
              </nav>`
            : ""
        }
      </div>
      <aside class="apse" aria-labelledby="apse-t">
        <h2 id="apse-t">${esc(t("reader.beside"))}</h2>
        <article class="source">
          <h3>${esc(t("reader.about"))}</h3>
          <ul class="topics">${work.topics.map((x) => `<li>${esc(inWords(x))}</li>`).join("")}</ul>
          <p class="counts">${esc(t("reader.subjects"))}</p>
        </article>
        ${
          related.length
            ? `<article class="source">
                <h3>${esc(t("reader.argued"))}</h3>
                <p class="counts">${esc(t("reader.argued.note"))}</p>
                <ul class="kin">
                  ${related
                    .map(
                      (c) => `<li><a href="#/c/${esc(c.id)}">${esc(c.topic)}</a><span class="rel">${esc(inWords(c.category ?? ""))} · ${esc(t("tablet.exchanges", c.message_count))}</span></li>`,
                    )
                    .join("")}
                </ul>
              </article>`
            : ""
        }
        ${
          credit
            ? `<article class="source">
                <h3>${esc(t("reader.cite"))}</h3>
                <p class="credit" id="cite-line">${esc(p.name_en)}, ${esc(shortWork(work.work))}, ${esc(t("credit.by", credit.translator, credit.year))}. ${esc(credit.source_url)}</p>
                <button class="btn quiet small" data-cite>${esc(t("reader.copycite"))}</button>
              </article>`
            : ""
        }
      </aside>
    </div>`;

  const cite = $("[data-cite]", main);
  if (cite) {
    cite.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText($("#cite-line", main).textContent.trim());
        toast(t("cite.copied"));
      } catch {
        toast(t("cite.failed"));
      }
    });
  }
}

/* ---------- the study ---------- */

// The day's philosopher and a few of their pages, chosen by the date. One corpus file is
// fetched, not the whole shelf, and nobody is tracked to make the choice.
async function dailyPages(manifest, by, count = 1) {
  const day = Math.floor(Date.now() / 86400000);
  const held = manifest.philosophers;
  if (!held.length) return [];
  const m = held[day % held.length];
  const p = by[m.slug];
  if (!p) return [];
  const work = m.works[day % m.works.length];
  let file;
  try {
    file = await workP(m.slug, work.file);
  } catch {
    return [];
  }
  const out = [];
  for (let i = 0; i < count; i++) {
    out.push({
      phil: p,
      slug: m.slug,
      passage: file.passages[(day * 7919 + i * 2711) % file.passages.length],
      credit: file.translation_credit,
      work: work.slug,
    });
  }
  return out;
}

function pageCard(d, { label } = {}) {
  return `<figure class="daily scene s-marble split">
    ${label ? `<p class="label">${esc(label)}</p>` : ""}
    <blockquote>${esc(trim(d.passage.text, 460))}</blockquote>
    <figcaption>
      <a href="#/p/${esc(d.slug)}">${esc(d.phil.name_en)}</a>, ${esc(shortWork(d.passage.work))}${d.passage.ref ? `, ${esc(d.passage.ref)}` : ""}${d.credit ? esc(t("credit.byline", d.credit.translator, d.credit.year)) : ""}
    </figcaption>
    <a class="btn" href="#/read/${esc(d.slug)}/${esc(d.work)}">${esc(t("page.readon", shortWork(d.passage.work)))}</a>
  </figure>`;
}

async function renderStudy() {
  setNav("study", t("study.title"));
  main.innerHTML = `<p class="loading">${esc(t("loading.lamp"))}</p>`;
  const [idx, phils, manifest] = await Promise.all([indexP(), philosophersP(), manifestP()]);
  const by = Object.fromEntries(phils.map((p) => [p.slug, p]));
  const held = Object.fromEntries(manifest.philosophers.map((m) => [m.slug, m]));

  const exchanges = idx.conversations.reduce((n, c) => n + c.message_count, 0);
  const passages = manifest.philosophers.reduce((n, m) => n + m.passages, 0);
  const works = manifest.philosophers.reduce((n, m) => n + m.works.length, 0);

  const recent = [...idx.conversations]
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    .slice(0, 5);

  // Where to start: the thinkers the plaza is arguing with most, then the deepest shelves.
  const seatedCount = new Map();
  for (const c of idx.conversations) for (const s of c.participants) seatedCount.set(s, (seatedCount.get(s) ?? 0) + 1);
  const doors = phils
    .map((p) => ({ p, tables: seatedCount.get(p.slug) ?? 0, passages: held[p.slug]?.passages ?? 0 }))
    .sort((a, b) => b.tables - a.tables || b.passages - a.passages)
    .slice(0, 8);

  main.innerHTML = `
    <section class="canopy scene s-library split">
      <h1>${esc(t("study.title"))}</h1>
      <p>${esc(t("study.lede"))}</p>
    </section>

    <div class="ledger">
      <span><b>${commas(idx.conversations.length)}</b> ${esc(t("study.tablesopen"))}</span>
      <span><b>${commas(exchanges)}</b> ${esc(t("study.exchanges"))}</span>
      <span><b>${commas(passages)}</b> ${esc(t("study.passages"))}</span>
      <span><b>${commas(works)}</b> ${esc(t("study.works"))}</span>
      <span><b>${commas(phils.length)}</b> ${esc(t("study.philosophers"))}</span>
    </div>

    <div class="desk">
      <section class="col-main">
        <h2>${esc(t("study.lately"))}</h2>
        <ul class="tables">${recent.map((c) => tablet(c, by)).join("")}</ul>
        <p class="more"><a href="#/">${esc(t("study.all"))}</a></p>
      </section>
      <aside class="col-side">
        <h2>${esc(t("study.today"))}</h2>
        <div class="today"><p class="waiting">${esc(t("loading.todaypages"))}</p></div>
        <h2>${esc(t("study.start"))}</h2>
        <ul class="doors">
          ${doors
            .map(
              ({ p, tables, passages: n }) => `<li><a href="#/p/${esc(p.slug)}">
                ${face(p)}
                <span class="who"><span class="name">${esc(p.name_en)}</span>
                <span class="rel">${esc(tables ? t("phil.tables", tables) : t("phil.notable"))}${n ? ` · ${esc(t("count.passages", commas(n)))}` : ""}</span></span>
              </a></li>`,
            )
            .join("")}
        </ul>
      </aside>
    </div>`;

  const pages = await dailyPages(manifest, by, 2);
  const slot = $(".today", main);
  if (slot) {
    slot.innerHTML = pages.length
      ? pages.map((d) => pageCard(d)).join("")
      : `<p class="waiting">${t("study.nolib", "#/sources")}</p>`;
  }
}

/* ---------- bringing a question ---------- */

// What the engine does when a visitor's issue arrives: it scores every philosopher on the
// subjects their own entry lists against the words of the question, leans toward pairs
// already in declared tension, keeps some room for chance so tables vary, and seats three.
// This mirrors the scoring so a visitor can see which words are calling whom. It cannot
// mirror the chance, and the copy says so.
function calls(question, phils) {
  const text = question.toLowerCase();
  return phils
    .map((p) => {
      const hits = p.key_topics.filter((t) => text.includes(t.toLowerCase()));
      return { p, hits };
    })
    .filter((x) => x.hits.length)
    .sort((a, b) => b.hits.length - a.hits.length || a.p.name_en.localeCompare(b.p.name_en));
}

const SYMPOSIUM_SEATS = 3;

async function renderAsk(slug) {
  setNav("plaza", t("ask.title"));
  main.innerHTML = `<p class="loading">${esc(t("loading.clearing"))}</p>`;
  const phils = await philosophersP();
  const guest = slug ? phils.find((p) => p.slug === slug) : null;
  if (slug && !guest) return renderMissing(t("phil.missing.h"), t("phil.missing.p"));

  main.innerHTML = `
    <section class="canopy scene s-sanctuary split">
      <h1>${esc(guest ? t("ask.h1.guest", guest.name_en) : t("ask.h1"))}</h1>
      <p>${esc(guest ? t("ask.lede.guest", SYMPOSIUM_SEATS, guest.name_en) : t("ask.lede", SYMPOSIUM_SEATS))}</p>
    </section>

    <div class="room">
      <div class="floor">
        <ol class="steps">
          <li>
            <h2><span class="n">1</span> ${esc(t("ask.step1"))}</h2>
            <textarea id="ask-q" maxlength="300" rows="3" placeholder="${esc(
              guest ? t("ask.q.ph.guest", guest.name_en) : t("ask.q.ph"),
            )}"></textarea>
            <p class="hint">${t("ask.count", `<span id="ask-count">0</span>`)}</p>
          </li>
          <li>
            <h2><span class="n">2</span> ${esc(t("ask.step2"))}</h2>
            <p class="hint">${esc(t("ask.step2.hint"))}</p>
            ${
              guest
                ? `<p class="hint pinned">${t("ask.pinned", esc(guest.name_en), guest.key_topics.map((k) => `<b>${esc(k)}</b>`).join(", "))}</p>`
                : ""
            }
            <ul class="calls"></ul>
          </li>
          <li>
            <h2><span class="n">3</span> ${esc(t("ask.step3"))}</h2>
            <textarea id="ask-ctx" rows="4" placeholder="${esc(t("ask.ctx.ph"))}"></textarea>
            <p class="hint">${esc(t("ask.step3.hint"))}</p>
          </li>
          <li>
            <h2><span class="n">4</span> ${esc(t("ask.step4"))}</h2>
            <p class="hint">${esc(t("ask.step4.hint"))}</p>
            <pre class="wire" id="ask-wire"></pre>
            <a class="btn" id="ask-go" rel="noopener" href="${NEW_ISSUE}?template=symposium.yml">${esc(t("ask.go"))}</a>
            <p class="hint">${esc(t("ask.step4.after"))}</p>
          </li>
        </ol>
      </div>

      <aside class="apse" aria-labelledby="ask-t">
        <h2 id="ask-t">${esc(t("ask.sofar"))}</h2>
        <article class="source">
          <h3>${esc(t("ask.yours"))}</h3>
          <p class="counts" id="ask-echo">${esc(t("ask.nothing"))}</p>
        </article>
        <article class="source">
          <h3>${esc(t("ask.how"))}</h3>
          <p class="counts">${esc(t("ask.how.p", SYMPOSIUM_SEATS))}</p>
        </article>
        ${
          guest
            ? `<article class="source">
                <h3>${esc(guest.name_en)}</h3>
                <p class="credit">${esc(guest.short_bio)}</p>
                <p class="counts"><a href="#/p/${esc(guest.slug)}">${esc(t("ask.guest.link"))}</a></p>
              </article>`
            : ""
        }
      </aside>
    </div>`;

  const q = $("#ask-q", main);
  const ctx = $("#ask-ctx", main);
  if (guest) ctx.value = t("ask.ctx.pre", guest.name_en);

  function paint() {
    const question = q.value.trim();
    $("#ask-count", main).textContent = String(q.value.length);
    $("#ask-echo", main).textContent = question || t("ask.nothing");

    const called = calls(question, phils);
    $(".calls", main).innerHTML = question
      ? called.length
        ? called
            .slice(0, 6)
            .map(
              ({ p, hits }) => `<li><a href="#/p/${esc(p.slug)}">
                ${face(p)}
                <span class="who"><span class="name">${esc(p.name_en)}</span>
                <span class="rel">${hits.map((h) => esc(h)).join(", ")}</span></span>
              </a></li>`,
            )
            .join("")
        : `<li class="none">${esc(t("ask.none"))}</li>`
      : `<li class="none">${esc(t("ask.writefirst"))}</li>`;

    const title = `[Symposium] ${question}`;
    const body = ctx.value.trim();
    $("#ask-wire", main).textContent = `title:   ${title}\n\ncontext: ${body || "(empty)"}`;
    const url = new URL(NEW_ISSUE);
    url.searchParams.set("template", "symposium.yml");
    url.searchParams.set("title", title);
    if (body) url.searchParams.set("context", body);
    const go = $("#ask-go", main);
    go.href = url.toString();
    go.classList.toggle("quiet", !question);
    go.textContent = question ? t("ask.go") : t("ask.go.empty");
  }

  q.addEventListener("input", paint);
  ctx.addEventListener("input", paint);
  paint();
  q.focus();
}

/* ---------- about ---------- */

function renderAbout() {
  setNav("about", t("about.title"));
  main.innerHTML = `
    <header class="about-head scene s-library split">
      <h1>${esc(t("about.h1"))}</h1>
      <p>${esc(t("about.lede"))}</p>
    </header>
    <article class="about">
      <p>${esc(t("about.p1"))}</p>
      <h2>${esc(t("about.how"))}</h2>
      <p>${esc(t("about.how.p"))}</p>
      <p class="plain">${esc(t("about.how.plain"))}</p>
      <h2>${esc(t("about.voices"))}</h2>
      <p>${esc(t("about.voices.p"))}</p>
      <p class="plain">${esc(t("about.voices.plain"))}</p>
      <h2>${esc(t("about.quote"))}</h2>
      <p>${esc(t("about.quote.p"))} <a href="#/sources">${esc(t("about.quote.link"))}</a>.</p>
      <h2>${esc(t("about.source"))}</h2>
      <p class="plain">${esc(t("about.source.pre"))}<a href="https://github.com/${REPO}" rel="noopener">GitHub</a>${esc(t("about.source.post"))}</p>
    </article>
    <div class="invite scene s-sanctuary centered">
      <p>${esc(t("about.invite"))}</p>
      <a class="btn" href="#/ask">${esc(t("about.invite.btn"))}</a>
    </div>`;
}

function renderMissing(title, body) {
  main.innerHTML = `<div class="err"><h2>${esc(title)}</h2><p>${esc(body)}</p><p><a class="btn quiet" href="#/">${esc(t("err.back"))}</a></p></div>`;
}

/* ---------- router ---------- */

async function route() {
  const hash = location.hash.replace(/^#/, "") || "/";
  const [, view, arg, arg2, arg3] = hash.split("/");
  window.scrollTo(0, 0);
  try {
    if (view === "" || view === undefined) await renderPlaza();
    else if (view === "c" && arg) await renderConversation(decodeURIComponent(arg));
    else if (view === "philosophers") await renderRoster();
    else if (view === "p" && arg) await renderPhilosopher(decodeURIComponent(arg));
    else if (view === "sources") await renderSources();
    else if (view === "study") await renderStudy();
    else if (view === "ask") await renderAsk(arg ? decodeURIComponent(arg) : null);
    else if (view === "read" && arg) await renderReader(decodeURIComponent(arg), arg2, arg3);
    else if (view === "about") renderAbout();
    else renderMissing(t("err.lost.h"), t("err.lost.p"));
  } catch (err) {
    console.error(err);
    main.innerHTML = `<div class="err"><h2>${esc(t("err.unreachable.h"))}</h2><p>${esc(t("err.unreachable.p", err.message))}</p><button onclick="location.reload()">${esc(t("err.tryagain"))}</button></div>`;
  }
}

/* ---------- which language the plaza speaks ---------- */

// The shell is static markup, so it carries its keys on the elements themselves and is
// repainted whenever the reading changes. The main panel is repainted by re-running the
// route, which is cheap: every fetch it makes is already in the cache.
function paintShell() {
  for (const el of document.querySelectorAll("[data-i18n]")) el.textContent = t(el.dataset.i18n);
  const button = $("[data-lang]");
  if (button) {
    button.textContent = t("lang.other");
    button.setAttribute("aria-label", t("lang.aria"));
    button.lang = lang() === "zh" ? "en" : "zh-Hans";
  }
}

$("[data-lang]")?.addEventListener("click", () => setLang(lang() === "zh" ? "en" : "zh"));
onLang(() => {
  paintShell();
  route();
});
paintShell();

addEventListener("hashchange", route);
route();

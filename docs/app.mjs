const REPO = "Whale02/agora";
const NEW_ISSUE = `https://github.com/${REPO}/issues/new`;

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
  const word = ["calm", "warm", "heated"][level - 1];
  const strokes = [0, 1, 2]
    .map((i) => `<line class="stroke${i < level ? " on" : ""}" x1="${4 + i * 7}" y1="14" x2="${9 + i * 7}" y2="2" stroke-width="2.4" stroke-linecap="round"/>`)
    .join("");
  return `<span class="heat h${level}" title="disagreement in this thread"><svg width="26" height="16" viewBox="0 0 26 16" aria-hidden="true">${strokes}</svg>${word}</span>`;
}

function ago(iso) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 3600) return `${Math.max(1, Math.floor(s / 60))} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  const d = Math.floor(s / 86400);
  return d === 1 ? "yesterday" : d < 30 ? `${d} days ago` : new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
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
  document.title = title ? `${title} · Agora` : "Agora · where philosophers are already talking";
}

/* ---------- plaza ---------- */

const plazaState = { category: null, type: null, sort: "recent", q: "" };

// The engine writes two kinds of conversation; the hub mockup's type chip carries them.
const TYPE_LABEL = { heartbeat: "symposium", user_initiated: "a visitor's question" };
const typeLabel = (t) => TYPE_LABEL[t] ?? String(t).replaceAll("_", " ");

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
  main.innerHTML = `<p class="loading">Opening the plaza…</p>`;
  const [idx, phils] = await Promise.all([indexP(), philosophersP()]);
  const by = Object.fromEntries(phils.map((p) => [p.slug, p]));
  const all = idx.conversations;
  const categories = [...new Set(all.map((c) => c.category).filter(Boolean))];
  const types = [...new Set(all.map((c) => c.type).filter(Boolean))];

  main.innerHTML = `
    <section class="canopy scene s-plaza split">
      <h1>The philosophers are already talking.</h1>
      <p>Twenty-five thinkers from twenty-five centuries share one plaza. Wander between the tables, listen, and when you have something to say, sit down.</p>
      <a class="ask" href="${NEW_ISSUE}?template=symposium.yml" rel="noopener">Or bring them a question of your own →</a>
    </section>
    <div class="lead-slot"></div>
    <div class="filters">
      <label class="search">
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6"/><path d="M15.5 15.5 20 20"/></svg>
        <input type="search" id="plaza-q" placeholder="Search a topic, a philosopher, a phrase" aria-label="Search the plaza">
      </label>
      <div class="chiprow" role="group" aria-label="Filter by subject">
        ${chips([[null, "All subjects"], ...categories.map((c) => [c, c])], "cat", plazaState.category)}
      </div>
      ${
        types.length > 1
          ? `<div class="chiprow" role="group" aria-label="Filter by kind">
              ${chips([[null, "Any kind"], ...types.map((t) => [t, typeLabel(t)])], "kind", plazaState.type)}
            </div>`
          : ""
      }
      <div class="chiprow sort" role="group" aria-label="Sort">
        ${chips([["recent", "Latest"], ["heat", "Most heated"]], "sort", plazaState.sort)}
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
        ? `<h2>Nothing under that</h2><p>No table matches ${esc(plazaState.q.trim())}. Try a philosopher's name, or a word one of them would use.</p>`
        : `<h2>No tables here yet</h2><p>No conversation under this filter so far. The heartbeat brings new ones every few hours.</p>`;
  }

  await paint();
}

// What the search reads: the question, the last thing said, who is seated, the subject.
function haystack(c, by) {
  const names = c.participants.flatMap((s) => [by[s]?.name_en, by[s]?.name_zh, s]).filter(Boolean);
  return [c.topic, c.preview, c.category, typeLabel(c.type), ...names].join(" ").toLowerCase();
}

// The count strip from the hub mockup, carrying the numbers this site can actually know.
function tally(list) {
  const now = Date.now();
  const today = list.filter((c) => now - new Date(c.updated_at).getTime() < DAY).length;
  const seated = list.filter((c) => c.has_user).length;
  return [
    `${list.length} ${list.length === 1 ? "table" : "tables"} open`,
    `${today} moved in the last day`,
    seated ? `${seated} with a visitor seated` : "no visitor seated yet",
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
    <a class="cover" href="#/c/${esc(c.id)}" aria-label="Enter: ${esc(c.topic)}"></a>
    <div class="meta">
      <span class="seats">${seats.map((p) => seat(p)).join("")}</span>
      <span class="kind">${esc(typeLabel(c.type))}</span>
      ${heatMark(c.heat)}
    </div>
    <h2>${esc(c.topic)}</h2>
    <div class="live">${live}</div>
    <p class="enter">Enter the conversation →</p>
  </article>`;
}

// One row per table, the hub mockup's list: who is seated, the question, the kind, the heat,
// how much has been said, when it last moved.
function tablet(c, by) {
  const seats = c.participants.map((s) => by[s]).filter(Boolean);
  const lastSpeaker = by[c.last_speaker]?.name_en;
  return `<li><article class="table-row h${heatLevel(c.heat)}">
    <a class="cover" href="#/c/${esc(c.id)}" aria-label="Read: ${esc(c.topic)}"></a>
    <span class="seats">${seats.map((p) => seat(p)).join("")}</span>
    <div class="what">
      <h2>${esc(c.topic)}</h2>
      <p class="voices">${seats.map((p) => esc(p.name_en)).join(" · ")}${c.has_user ? " · a visitor" : ""}</p>
      <p class="said">${esc(trim(c.preview, 118))}${lastSpeaker ? `<span class="who">${esc(lastSpeaker)}</span>` : ""}</p>
    </div>
    <div class="meta">
      <span class="kind">${esc(typeLabel(c.type))}</span>
      ${heatMark(c.heat)}
      <span class="count">${c.message_count} exchanges</span>
      <span class="when">${ago(c.updated_at)}</span>
    </div>
  </article></li>`;
}

/* ---------- the room: one conversation, read ---------- */

// The eight philosophers the engineer handoff drew. Everyone else keeps the medallion the
// stylesheet cuts from their accent colour.
const PLATES = new Set([
  "socrates",
  "marcus-aurelius",
  "laozi",
  "zhuangzi",
  "nietzsche",
  "camus",
  "fromm",
  "naval",
]);

const face = (p, size = "") =>
  PLATES.has(p.slug)
    ? `<span class="face ${size}" style="--seat:${esc(p.accent)}" aria-hidden="true"><img src="assets/p/${esc(p.slug)}.webp" alt="" loading="lazy" width="356" height="300"></span>`
    : seat(p, size);

async function renderConversation(id) {
  setNav("plaza");
  main.innerHTML = `<p class="loading">Approaching the table…</p>`;
  let convo;
  try {
    convo = await load(`data/conversations/${id}.json`);
  } catch {
    return renderMissing("This table is empty", "No conversation lives at this address. It may have a typo, or the plaza has been rearranged.");
  }
  const phils = await philosophersP();
  const by = Object.fromEntries(phils.map((p) => [p.slug, p]));
  const seats = convo.participants.map((s) => by[s]).filter(Boolean);
  setNav("plaza", convo.topic);

  main.innerHTML = `
    <article class="thread">
      <p class="crumb"><a href="#/">← Back to the plaza</a></p>
      <header class="q scene s-thread split">
        <span class="kind">${esc(typeLabel(convo.type))}</span>
        <h1>${esc(convo.topic)}</h1>
        <div class="standing">
          <span class="seats">${seats.map((p) => seat(p)).join("")}</span>
          ${heatMark(convo.heat)}
          <span>${convo.messages.length} exchanges</span>
          <span>began ${ago(convo.created_at)}</span>
        </div>
      </header>

      <section class="bench" aria-label="Seated at this table">
        ${seats.map((p) => benchCard(p, convo.category)).join("")}
      </section>

      <div class="room">
        <div class="floor">
          <ol class="exchange">${convo.messages.map((m) => utterance(m, by)).join("")}</ol>
          <div class="sitdown scene s-rotunda centered">
            <p>The table is still open. When you speak, every philosopher seated here answers you directly.</p>
            <button class="btn" data-join>Sit down at this table</button>
            <div class="actions">
              <button class="btn quiet" data-share>Share this conversation</button>
            </div>
          </div>
        </div>
        <aside class="apse" aria-labelledby="apse-t">
          <h2 id="apse-t">What they wrote</h2>
          <div class="apse-body"><p class="waiting">Looking through their pages…</p></div>
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
        toast("Link copied. It carries a preview of this exchange.");
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
    ? `<p class="stance"><span class="on">On ${esc(category)}</span>${esc(stance)}</p>`
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
  const names = works.map((w) => w.work);
  if (names.length <= n) return names.join(", ");
  return `${names.slice(0, n).join(", ")} and ${names.length - n} more`;
};

const creditLine = (credits) => {
  const who = [...new Set(credits.map((c) => `${c.translator}, ${c.year}`))];
  return who.join("; ");
};

// The room mockup's sources rail, carrying the corpus this repository actually holds.
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
        <p class="counts">Listed, not quoted. The plaza carries no passages from ${esc(p.name_en)}.</p>
      </article>`;
    }
    const onSubject = m.topics.find((t) => t.topic === subject)?.count ?? 0;
    return `<article class="source">
      <h3><a href="#/p/${esc(p.slug)}">${esc(p.name_en)}</a></h3>
      <p class="credit">${esc(listWorks(m.works))}, translated by ${esc(creditLine(m.translation_credits))}</p>
      <p class="counts">${m.passages} passages${onSubject ? ` · ${onSubject} on ${esc(subject)}` : ""}</p>
      <button class="btn quiet small" data-passages="${esc(p.slug)}">
        ${onSubject ? `Read from ${esc(p.name_en)} on ${esc(subject)}` : `Read from ${esc(p.name_en)}`}
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
        const corpus = await load(`data/passages/${slug}.json`);
        const picked = pickPassages(corpus.passages, subject, 3);
        drawer.innerHTML = picked.length
          ? picked.map((x) => passageCard(x, corpus)).join("")
          : `<p class="counts">Nothing in this corpus touches ${esc(subject)}.</p>`;
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

function passageCard(x, corpus) {
  const credit = corpus.translation_credits.find((c) => c.work === x.work);
  return `<figure class="passage">
    <blockquote>${esc(trim(x.text, 320))}</blockquote>
    <figcaption>
      ${esc(x.work)}, ${esc(x.ref)}${credit ? `, translated by ${esc(credit.translator)}, ${credit.year}` : ""}
      ${credit?.source_url ? `<a href="${esc(credit.source_url)}" rel="noopener">source</a>` : ""}
    </figcaption>
  </figure>`;
}

function utterance(m, by) {
  if (m.speaker_type === "user") {
    return `<li><article class="utterance visitor">
      <div class="said"><span class="name">${esc(m.speaker)}</span><span class="school">visitor to the agora</span></div>
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
    <h2 id="ritual-t">You are about to sit down</h2>
    <p>${esc(convo.topic)}</p>
    <div class="table-of">${seats.map((p) => seat(p)).join("")}<span>${seats.map((p) => esc(p.name_en)).join(", ")} will answer you.</span></div>
    <p class="how">Your words travel through GitHub: open the prepared form, write what you would say at the table, and submit. The philosophers reply within a few minutes and the thread updates here.</p>
    <div class="row">
      <button class="btn quiet" data-x>Stay standing</button>
      <a class="btn" data-go rel="noopener" href="${NEW_ISSUE}?template=join.yml&title=${encodeURIComponent(`[Join] ${convo.id}`)}">Take a seat</a>
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
  setNav("philosophers", "Philosophers");
  main.innerHTML = `<p class="loading">Calling the roll…</p>`;
  const phils = await philosophersP();
  main.innerHTML = `
    <section class="roster-head scene s-roster split">
      <h1>The twenty-five</h1>
      <p>Chosen so that every pair can find a real disagreement. Each is an AI character grounded in the thinker's actual writings, and each knows exactly who else is in this plaza.</p>
    </section>
    <ul class="roster">
      ${phils
        .map(
          (p) => `<li><a href="#/p/${esc(p.slug)}">
            ${seat(p, "lg")}
            <span><span class="name">${esc(p.name_en)}</span>${p.name_zh ? `<span class="zh">${esc(p.name_zh)}</span>` : ""}
            <span class="line">${esc(p.short_bio)}</span></span>
          </a></li>`,
        )
        .join("")}
    </ul>`;
}

async function renderPhilosopher(slug) {
  setNav("philosophers");
  main.innerHTML = `<p class="loading">Finding them in the crowd…</p>`;
  const [phils, idx] = await Promise.all([philosophersP(), indexP()]);
  const p = phils.find((x) => x.slug === slug);
  if (!p) return renderMissing("Not in this plaza", "No philosopher answers to that name here.");
  const by = Object.fromEntries(phils.map((x) => [x.slug, x]));
  setNav("philosophers", p.name_en);
  const theirs = idx.conversations.filter((c) => c.participants.includes(slug));

  main.innerHTML = `
    <p class="crumb"><a href="#/philosophers">← All philosophers</a></p>
    <header class="figure scene s-figure split">
      ${seat(p, "xl")}
      <div>
        <h1>${esc(p.name_en)}${p.name_zh ? `<span class="zh">${esc(p.name_zh)}</span>` : ""}</h1>
        <p class="school">${esc(p.tradition)} · ${esc(p.era)}</p>
      </div>
    </header>
    <div class="profile">
      <p class="bio">${esc(p.short_bio)}</p>
      ${paragraphs(p.identity).replace(/<p>/g, '<p class="bio">')}
      <h2>Positions</h2>
      <dl class="positions">
        ${Object.entries(p.positions)
          .map(([k, v]) => `<dt>On ${esc(k.replaceAll("_", " "))}</dt><dd>${esc(v)}</dd>`)
          .join("")}
      </dl>
      <h2>Sources</h2>
      <ul>${p.works.map((w) => `<li>${esc(w)}</li>`).join("")}</ul>
      <h2>In this plaza</h2>
      <ul>
        ${p.relationships
          .map((r) => {
            const o = by[r.slug];
            return o
              ? `<li><span class="rel">${esc(r.kind)}</span> <a href="#/p/${esc(o.slug)}">${esc(o.name_en)}</a>, <span class="rel">${esc(r.note)}</span></li>`
              : "";
          })
          .join("")}
      </ul>
      ${
        theirs.length
          ? `<h2>At these tables</h2><ul class="tables">${theirs.map((c) => tablet(c, by)).join("")}</ul>`
          : ""
      }
    </div>`;
}

/* ---------- about ---------- */

function renderAbout() {
  setNav("about", "About");
  main.innerHTML = `
    <header class="about-head scene s-library split">
      <h1>An open plaza of ideas</h1>
      <p>The agora was the open square of a Greek city: public, messy, democratic. Anyone could walk in and hear the sharpest minds of the city disagreeing. This is a small digital one, twenty-five philosophers from twenty-five centuries, talking to each other continuously, whether or not anyone is watching.</p>
    </header>
    <article class="about">
      <p>The most valuable thinking rarely happens when you ask a question and receive an answer. It happens when you overhear a disagreement between people smarter than you, and are forced to take a side.</p>
      <h2>How it works</h2>
      <p>A heartbeat fires every four hours. It draws a question from the pool, seats the two to four thinkers with the most at stake in it, and lets them talk. Every conversation stays open: sit down at any table and each philosopher seated there answers you directly. Or bring the plaza a question of your own and watch a debate begin.</p>
      <p class="plain">Participation runs through GitHub issues; your GitHub name is your name at the table, which keeps the plaza spam-free with no accounts to manage.</p>
      <h2>What these voices are</h2>
      <p>Each philosopher is an AI character grounded in the thinker's actual writings, with their documented positions, their real sources, and their honest relationships to the other twenty-four. They cite only works that exist, and they are under instruction to concede a point they cannot counter.</p>
      <p class="plain">They are characters, not the people. Several of the modeled thinkers are alive; nothing said here should be quoted as a statement by the real person. The full sourcing policy is in the repository.</p>
      <h2>Open source</h2>
      <p class="plain">The plaza, the heartbeat, and every philosopher definition are MIT-licensed on <a href="https://github.com/${REPO}" rel="noopener">GitHub</a>. Deploy your own, or add the thinker you think is missing.</p>
      <div class="invite scene s-sanctuary centered">
        <p>The plaza takes questions from anyone. Yours becomes a table, and the thinkers with the most at stake in it sit down.</p>
        <a class="btn" href="${NEW_ISSUE}?template=symposium.yml" rel="noopener">Bring the plaza a question</a>
      </div>
    </article>`;
}

function renderMissing(title, body) {
  main.innerHTML = `<div class="err"><h2>${esc(title)}</h2><p>${esc(body)}</p><p><a class="btn quiet" href="#/">Back to the plaza</a></p></div>`;
}

/* ---------- router ---------- */

async function route() {
  const hash = location.hash.replace(/^#/, "") || "/";
  const [, view, arg] = hash.split("/");
  window.scrollTo(0, 0);
  try {
    if (view === "" || view === undefined) await renderPlaza();
    else if (view === "c" && arg) await renderConversation(decodeURIComponent(arg));
    else if (view === "philosophers") await renderRoster();
    else if (view === "p" && arg) await renderPhilosopher(decodeURIComponent(arg));
    else if (view === "about") renderAbout();
    else renderMissing("Lost in the stoa", "That path leads nowhere in this plaza.");
  } catch (err) {
    console.error(err);
    main.innerHTML = `<div class="err"><h2>The plaza is unreachable</h2><p>Something failed while loading: ${esc(err.message)}</p><button onclick="location.reload()">Try again</button></div>`;
  }
}

addEventListener("hashchange", route);
route();

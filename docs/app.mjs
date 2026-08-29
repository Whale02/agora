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

const plazaState = { category: null, sort: "recent" };

async function renderPlaza() {
  setNav("plaza");
  main.innerHTML = `<p class="loading">Opening the plaza…</p>`;
  const [idx, phils] = await Promise.all([indexP(), philosophersP()]);
  const by = Object.fromEntries(phils.map((p) => [p.slug, p]));
  const categories = [...new Set(idx.conversations.map((c) => c.category).filter(Boolean))];

  const list = idx.conversations
    .filter((c) => !plazaState.category || c.category === plazaState.category)
    .sort((a, b) => (plazaState.sort === "heat" ? b.heat - a.heat : b.updated_at.localeCompare(a.updated_at)));

  // The hottest table leads the plaza; its exchange is readable before anything else.
  const lead = [...list].sort((a, b) => b.heat - a.heat)[0];
  const rest = list.filter((c) => c !== lead);
  const leadHTML = lead ? await leadTablet(lead, by) : "";

  const chips = (items, key, current) =>
    items
      .map(
        ([value, label]) =>
          `<button class="chip" data-${key}="${esc(value ?? "")}" aria-pressed="${current === value}">${esc(label)}</button>`,
      )
      .join("");

  main.innerHTML = `
    <section class="forum">
      <div class="invocation">
        <h1>The philosophers are already talking.</h1>
        <p>Twenty-five thinkers from twenty-five centuries share one plaza. Wander between the tables, listen, and when you have something to say, sit down.</p>
        <a class="ask" href="${NEW_ISSUE}?template=symposium.yml" rel="noopener">Or bring them a question of your own →</a>
      </div>
      ${leadHTML}
    </section>
    <div class="filters" role="toolbar" aria-label="Filter conversations">
      ${chips([[null, "All"], ...categories.map((c) => [c, c])], "cat", plazaState.category)}
      <span class="sort">${chips([["recent", "Latest"], ["heat", "Most heated"]], "sort", plazaState.sort)}</span>
    </div>
    ${
      rest.length || lead
        ? `<ul class="tables">${rest.map((c) => tablet(c, by)).join("")}</ul>`
        : `<div class="empty"><h2>No tables here yet</h2><p>No conversation under this topic so far. The heartbeat brings new ones every few hours.</p></div>`
    }`;

  main.querySelectorAll("[data-cat]").forEach((b) =>
    b.addEventListener("click", () => {
      plazaState.category = b.dataset.cat || null;
      renderPlaza();
    }),
  );
  main.querySelectorAll("[data-sort]").forEach((b) =>
    b.addEventListener("click", () => {
      plazaState.sort = b.dataset.sort;
      renderPlaza();
    }),
  );
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
      ${heatMark(c.heat)}
    </div>
    <h2>${esc(c.topic)}</h2>
    <div class="live">${live}</div>
    <p class="enter">Enter the conversation →</p>
  </article>`;
}

function tablet(c, by) {
  const seats = c.participants.map((s) => by[s]).filter(Boolean);
  const lastSpeaker = by[c.last_speaker]?.name_en;
  return `<li><article class="tablet h${heatLevel(c.heat)}">
    <a class="cover" href="#/c/${esc(c.id)}" aria-label="Read: ${esc(c.topic)}"></a>
    <div class="meta">
      <span class="seats">${seats.map((p) => seat(p)).join("")}</span>
      ${heatMark(c.heat)}
    </div>
    <h2>${esc(c.topic)}</h2>
    <p class="voices">${seats.map((p) => esc(p.name_en)).join(" · ")}${c.has_user ? " · a visitor" : ""}</p>
    <blockquote>${esc(c.preview)}${lastSpeaker ? `<span class="who">— ${esc(lastSpeaker)}, just now at this table</span>` : ""}</blockquote>
    <div class="foot"><span>${c.message_count} exchanges</span><span>${ago(c.updated_at)}</span></div>
  </article></li>`;
}

/* ---------- conversation ---------- */

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
      <header class="q">
        <h1>${esc(convo.topic)}</h1>
        <div class="standing">
          <span class="seats">${seats.map((p) => seat(p)).join("")}</span>
          ${heatMark(convo.heat)}
          <span>${convo.messages.length} exchanges · began ${ago(convo.created_at)}</span>
        </div>
      </header>
      <ol class="exchange">${convo.messages.map((m) => utterance(m, by)).join("")}</ol>
      <div class="sitdown">
        <p>The table is still open. When you speak, every philosopher seated here answers you directly.</p>
        <button class="btn" data-join>Sit down at this table</button>
        <div class="actions">
          <button class="btn quiet" data-share>Share this conversation</button>
        </div>
      </div>
    </article>`;

  $("[data-join]", main).addEventListener("click", () => ritual(convo, seats));
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
      <span class="name"><a href="#/p/${esc(p.slug)}">${esc(p.name_en)}</a></span>
      <span class="school">${esc(p.tradition)}</span>
    </div>
    <div class="body">${paragraphs(m.content)}</div>
  </article></li>`;
}

function ritual(convo, seats) {
  const wrap = document.createElement("div");
  wrap.className = "ritual-backdrop";
  wrap.innerHTML = `<div class="ritual" role="dialog" aria-modal="true" aria-labelledby="ritual-t">
    <h2 id="ritual-t">You are about to sit down</h2>
    <p>“${esc(convo.topic)}”</p>
    <div class="table-of">${seats.map((p) => seat(p)).join("")}<span>${seats.map((p) => esc(p.name_en)).join(", ")} will answer you.</span></div>
    <p class="how">Your words travel through GitHub: open the prepared form, write what you would say at the table, and submit. The philosophers reply within a few minutes and the thread updates here.</p>
    <div class="row">
      <button class="btn quiet" data-x>Stay standing</button>
      <a class="btn" data-go rel="noopener" href="${NEW_ISSUE}?template=join.yml&title=${encodeURIComponent(`[Join] ${convo.id}`)}">Take a seat</a>
    </div>
  </div>`;
  document.body.appendChild(wrap);
  const opener = document.activeElement;
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
    <section class="roster-head">
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
    <header class="figure">
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
              ? `<li><span class="kind">${esc(r.kind)}</span> <a href="#/p/${esc(o.slug)}">${esc(o.name_en)}</a>, <span class="kind">${esc(r.note)}</span></li>`
              : "";
          })
          .join("")}
      </ul>
      ${
        theirs.length
          ? `<h2>At these tables</h2><ul class="tables" style="list-style:none;padding:0">${theirs.map((c) => tablet(c, by)).join("")}</ul>`
          : ""
      }
    </div>`;
}

/* ---------- about ---------- */

function renderAbout() {
  setNav("about", "About");
  main.innerHTML = `
    <article class="about">
      <h1>An open plaza of ideas</h1>
      <p>The agora was the open square of a Greek city: public, messy, democratic. Anyone could walk in and hear the sharpest minds of the city disagreeing. This is a small digital one, twenty-five philosophers from twenty-five centuries, talking to each other continuously, whether or not anyone is watching.</p>
      <p>The most valuable thinking rarely happens when you ask a question and receive an answer. It happens when you overhear a disagreement between people smarter than you, and are forced to take a side.</p>
      <h2>How it works</h2>
      <p>A heartbeat fires every four hours. It draws a question from the pool, seats the two to four thinkers with the most at stake in it, and lets them talk. Every conversation stays open: sit down at any table and each philosopher seated there answers you directly. Or bring the plaza a question of your own and watch a debate begin.</p>
      <p class="plain">Participation runs through GitHub issues; your GitHub name is your name at the table, which keeps the plaza spam-free with no accounts to manage.</p>
      <h2>What these voices are</h2>
      <p>Each philosopher is an AI character grounded in the thinker's actual writings, with their documented positions, their real sources, and their honest relationships to the other twenty-four. They cite only works that exist, and they are under instruction to concede a point they cannot counter.</p>
      <p class="plain">They are characters, not the people. Several of the modeled thinkers are alive; nothing said here should be quoted as a statement by the real person. The full sourcing policy is in the repository.</p>
      <h2>Open source</h2>
      <p class="plain">The plaza, the heartbeat, and every philosopher definition are MIT-licensed on <a href="https://github.com/${REPO}" rel="noopener">GitHub</a>. Deploy your own, or add the thinker you think is missing.</p>
      <p><a class="btn" href="${NEW_ISSUE}?template=symposium.yml" rel="noopener">Bring the plaza a question</a></p>
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

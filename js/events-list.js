import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  db,
  qs,
  escapeHtml,
  toDate,
  eventPhase,
  startCountdown,
  formatCardDate,
  formatLongDate,
  coverOf,
  genreEmoji
} from "./app.js";
import { initLayout } from "./layout.js";
import { HOST_NAME, DEFAULT_COVER } from "./site-config.js";

const FILTERS = ["all", "upcoming", "completed"];
let filter = FILTERS.includes(qs("filter")) ? qs("filter") : "all";
let events = []; // { id, ...data } ordinati per startAt asc
const statsCache = new Map(); // eventId -> { participants, films, nicknames: [{uid,nickname}], votersCount }
let stopCountdown = null;

const $ = (id) => document.getElementById(id);

// Colori ciclici (pill genere / cerchio host) come nelle card Stitch.
const GENRE_TEXT = ["text-tertiary", "text-secondary", "text-primary"];
const HOST_CIRCLE = [
  "bg-tertiary-container text-on-tertiary-container",
  "bg-secondary-container text-on-secondary-container",
  "bg-primary-container text-on-primary-container"
];
const DOT_COLORS = ["bg-primary", "bg-secondary", "bg-tertiary", "bg-surface-tint", "bg-primary-fixed", "bg-secondary-fixed"];

initLayout({ active: filter === "completed" ? "archivio" : "serate" });

// ---------------------------------------------------------------- dati

async function loadStats(ev) {
  if (statsCache.has(ev.id)) return statsCache.get(ev.id);
  const stats = { participants: 0, films: 0, nicknames: [], votersCount: 0 };
  try {
    const snap = await getDocs(collection(db, "events", ev.id, "participants"));
    snap.forEach((d) => {
      const p = d.data();
      stats.participants += 1;
      stats.films += Number(p.filmCount) || 0;
      stats.nicknames.push({ uid: d.id, nickname: p.nickname || "" });
    });
    if (eventPhase(ev) === "completed") {
      const votes = await getDocs(collection(db, "events", ev.id, "votes"));
      stats.votersCount = votes.size;
    }
  } catch (e) {
    console.warn("Statistiche non disponibili per", ev.id, e);
  }
  statsCache.set(ev.id, stats);
  return stats;
}

function subscribeEvents() {
  const q = query(collection(db, "events"), where("status", "==", "published"));
  onSnapshot(
    q,
    (snap) => {
      events = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((e) => toDate(e.startAt))
        .sort((a, b) => toDate(a.startAt) - toDate(b.startAt));
      render();
      Promise.all(events.map(loadStats)).then(render);
    },
    (err) => {
      console.error(err);
      $("events-grid").innerHTML = emptyBox("Impossibile caricare le serate. Riprova tra poco.");
    }
  );
}

// ---------------------------------------------------------------- render

function emptyBox(text) {
  return `<div class="col-span-full w-full p-space-md rounded-xl bg-surface-container-low flex flex-col sm:flex-row items-center justify-between gap-space-sm text-on-surface-variant"><span class="font-body-sm text-body-sm">${escapeHtml(text)}</span></div>`;
}

function render() {
  const now = new Date();
  const withPhase = events.map((ev) => ({ ev, phase: eventPhase(ev, now), stats: statsCache.get(ev.id) }));
  const nUpcoming = withPhase.filter((x) => x.phase !== "completed").length;
  const nCompleted = withPhase.length - nUpcoming;

  const count = $("stat-events-count");
  if (count) count.textContent = withPhase.length === 1 ? "1 serata" : `${withPhase.length} serate`;

  renderFeatured(withPhase.find((x) => x.phase !== "completed"));
  renderFilters(withPhase.length, nUpcoming, nCompleted);
  renderGrid(withPhase);
}

function renderFeatured(item) {
  const section = $("serata-imminente");
  if (stopCountdown) {
    stopCountdown();
    stopCountdown = null;
  }
  if (!item) {
    section.hidden = true;
    return;
  }
  const { ev, phase } = item;
  const stats = item.stats || { participants: 0, films: 0, nicknames: [] };
  const start = toDate(ev.startAt);
  const host = ev.hostName || HOST_NAME;
  const href = "event.html?id=" + encodeURIComponent(ev.id);
  section.hidden = false;

  $("featured-audience").textContent = `Serata Aperta per Amici di ${host}`;
  const cover = $("featured-cover");
  cover.onerror = () => {
    cover.onerror = null;
    cover.src = DEFAULT_COVER;
  };
  cover.src = coverOf(ev);
  const live = phase === "live";
  $("featured-lock-icon").textContent = live ? "lock_open" : "lock";
  $("featured-lock-title").textContent = live ? "Caveau Aperto" : "Caveau Sigillato";
  $("featured-lock-count").textContent = live
    ? `${stats.films} ${stats.films === 1 ? "Titolo Svelato" : "Titoli Svelati"}`
    : `${stats.films} ${stats.films === 1 ? "Titolo Segreto" : "Titoli Segreti"} in attesa`;
  const genre = $("featured-genre");
  genre.textContent = ev.genre ? `${genreEmoji(ev.genre)} ${ev.genre}` : "";
  genre.parentElement.hidden = !ev.genre;
  $("featured-host").textContent = `${host} (Host)`;
  $("featured-date").textContent = formatLongDate(start);
  $("featured-title").textContent = ev.title || "";
  const desc = $("featured-desc");
  desc.textContent = ev.description || "";
  desc.hidden = !ev.description;

  $("featured-countdown-box").hidden = live;
  if (!live) {
    stopCountdown = startCountdown(
      start,
      { h: $("countdown-hours"), m: $("countdown-minutes"), s: $("countdown-seconds") },
      render
    );
  }

  $("featured-participants-label").textContent = `Partecipanti Confermati (${stats.participants})`;
  $("featured-participants").innerHTML = stats.nicknames.length
    ? stats.nicknames
        .map((p, i) => {
          const star = p.uid === ev.createdBy ? ' <span class="text-primary font-bold text-xs">★</span>' : "";
          return `<span class="inline-flex items-center gap-space-xs px-space-md py-space-xs bg-surface-container-high text-on-surface rounded-full font-label-md text-label-md font-medium">
<span class="w-2 h-2 rounded-full ${DOT_COLORS[i % DOT_COLORS.length]}"></span> ${escapeHtml(p.nickname)}${star}
</span>`;
        })
        .join("")
    : '<span class="font-body-sm text-body-sm text-on-surface-variant">Nessun partecipante ancora. Sii il primo!</span>';

  $("featured-cta-join").href = href;
  $("featured-cta-details").href = href;
  const joinLabel = $("featured-cta-join").querySelector("span:last-child");
  if (joinLabel) joinLabel.textContent = live ? "Entra & Vota" : "Partecipa & Proponi Film";
}

function renderFilters(all, upcoming, completed) {
  const labels = { all: `Tutte (${all})`, upcoming: `In arrivo (${upcoming})`, completed: `Concluse (${completed})` };
  document.querySelectorAll("#event-filters .filter-btn").forEach((btn) => {
    const f = btn.dataset.filter;
    btn.textContent = labels[f];
    const active = f === filter;
    btn.classList.toggle("active", active);
    btn.classList.toggle("bg-surface-container-high", active);
    btn.classList.toggle("text-primary", active);
    btn.classList.toggle("shadow-sm", active);
    btn.classList.toggle("text-on-surface-variant", !active);
  });
}

function renderGrid(withPhase) {
  const list = withPhase.filter(({ phase }) => {
    if (filter === "upcoming") return phase !== "completed";
    if (filter === "completed") return phase === "completed";
    return true;
  });
  const grid = $("events-grid");
  if (!list.length) {
    grid.innerHTML = emptyBox(
      withPhase.length ? "Nessuna serata in questa categoria." : "Nessuna serata in programma"
    );
    return;
  }
  grid.innerHTML = list.map((x, i) => renderEventCard(x.ev, x.stats || {}, x.phase, i)).join("");
}

function renderEventCard(ev, stats, phase, index) {
  const start = toDate(ev.startAt);
  const href = "event.html?id=" + encodeURIComponent(ev.id);
  const host = ev.hostName || HOST_NAME;
  const initial = escapeHtml((host || "?").trim().charAt(0).toUpperCase());
  const color = GENRE_TEXT[index % GENRE_TEXT.length];
  const participants = stats.participants || 0;
  const films = stats.films || 0;
  const img = escapeHtml(coverOf(ev));
  const onerr = `this.onerror=null;this.src='${DEFAULT_COVER}'`;
  const desc = ev.description
    ? `<p class="font-body-sm text-body-sm text-on-surface-variant mt-space-xs line-clamp-2">
                ${escapeHtml(ev.description)}
              </p>`
    : "";

  if (phase === "completed") {
    const scr = ev.screening;
    const trophy = scr
      ? `<span class="inline-flex items-center gap-space-xs bg-primary-container text-on-primary-container px-space-sm py-1 rounded-md font-bold">
<span class="material-symbols-outlined text-[14px]">trophy</span>
                Film Visto: ${escapeHtml(scr.title)}
              </span>`
      : "<span></span>";
    const votes = scr
      ? `<span class="inline-flex items-center gap-space-xs bg-surface-container-highest/90 px-space-sm py-1 rounded-md text-tertiary font-bold">
                ★ ${Number(scr.votes) || 0} voti
              </span>`
      : "";
    return `<div class="event-card completed flex flex-col bg-surface-container-low rounded-xl overflow-hidden shadow-lg transition-transform duration-300 hover:-translate-y-1 relative">
<div class="relative aspect-[16/10] bg-surface-container overflow-hidden">
<img class="w-full h-full object-cover grayscale-[30%]" alt="" src="${img}" onerror="${onerr}">
<div class="absolute inset-0 bg-gradient-to-t from-surface-container-low via-transparent to-transparent"></div>
<div class="absolute top-space-md left-space-md">
<span class="px-space-md py-space-xs bg-surface-container-highest/90 text-on-surface font-label-sm text-label-sm rounded-full font-bold flex items-center gap-1">
<span class="material-symbols-outlined text-[14px] text-primary">check_circle</span>
                Serata Conclusa
              </span>
</div>
<div class="absolute bottom-space-sm left-space-md right-space-md flex items-center justify-between text-on-surface font-label-sm text-label-sm">
${trophy}
${votes}
</div>
</div>
<div class="p-space-lg flex-1 flex flex-col justify-between gap-space-md">
<div>
<h3 class="font-headline-md text-headline-md text-on-surface font-bold">
                ${escapeHtml(ev.title)}
              </h3>
${desc}
</div>
<div class="flex items-center justify-between pt-space-xs">
<div class="flex items-center gap-space-xs">
<div class="w-7 h-7 rounded-full bg-surface-variant flex items-center justify-center text-on-surface-variant text-xs font-bold">
                  ${initial}
                </div>
<span class="font-label-sm text-label-sm text-on-surface-variant">Host: <strong>${escapeHtml(host)}</strong></span>
</div>
<div class="inline-flex items-center gap-space-xs text-on-surface-variant font-label-sm text-label-sm">
<span class="material-symbols-outlined text-[16px]">how_to_vote</span>
<span class=""><strong>${stats.votersCount || 0}</strong> votanti</span>
</div>
</div>
<a class="w-full inline-flex items-center justify-center gap-space-xs py-space-sm px-space-md bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface font-label-md text-label-md font-medium rounded-lg transition-colors shadow-sm" href="${href}">
<span class="material-symbols-outlined text-[16px]">history_edu</span>
<span class="">Rivedi la Serata</span>
</a>
</div>
</div>`;
  }

  const live = phase === "live";
  const genre = ev.genre
    ? `<div class="absolute top-space-md left-space-md">
<span class="px-space-md py-space-xs bg-surface-container-lowest/80 backdrop-blur-md ${color} font-label-sm text-label-sm rounded-full font-bold">
                ${escapeHtml(ev.genre)}
              </span>
</div>`
    : "";
  return `<div class="event-card upcoming flex flex-col bg-surface-container-low rounded-xl overflow-hidden shadow-lg transition-transform duration-300 hover:-translate-y-1">
<div class="relative aspect-[16/10] bg-surface-container overflow-hidden">
<img class="w-full h-full object-cover" alt="" src="${img}" onerror="${onerr}">
<div class="absolute inset-0 bg-gradient-to-t from-surface-container-low via-transparent to-transparent"></div>
${genre}
<div class="absolute bottom-space-sm left-space-md right-space-md flex items-center justify-between text-on-surface font-label-sm text-label-sm">
<span class="inline-flex items-center gap-space-xs bg-surface-container-highest/90 px-space-sm py-1 rounded-md">
<span class="material-symbols-outlined text-[14px] ${color}">calendar_today</span>
                ${escapeHtml(formatCardDate(start))}
              </span>
<span class="inline-flex items-center gap-space-xs bg-surface-container-highest/90 px-space-sm py-1 rounded-md text-primary font-semibold">
<span class="material-symbols-outlined text-[14px]">${live ? "lock_open" : "lock"}</span>
                ${films} ${live ? (films === 1 ? "Film Svelato" : "Film Svelati") : films === 1 ? "Film Segreto" : "Film Segreti"}
              </span>
</div>
</div>
<div class="p-space-lg flex-1 flex flex-col justify-between gap-space-md">
<div>
<h3 class="font-headline-md text-headline-md text-on-surface font-bold">
                ${escapeHtml(ev.title)}
              </h3>
${desc}
</div>
<div class="flex items-center justify-between pt-space-xs">
<div class="flex items-center gap-space-xs">
<div class="w-7 h-7 rounded-full ${HOST_CIRCLE[index % HOST_CIRCLE.length]} flex items-center justify-center text-xs font-bold">
                  ${initial}
                </div>
<span class="font-label-sm text-label-sm text-on-surface-variant">Host: <strong>${escapeHtml(host)}</strong></span>
</div>
<div class="inline-flex items-center gap-space-xs text-on-surface-variant font-label-sm text-label-sm">
<span class="material-symbols-outlined text-[16px] text-primary">group</span>
<span class=""><strong>${participants}</strong> ${participants === 1 ? "partecipante" : "partecipanti"}</span>
</div>
</div>
<a class="w-full inline-flex items-center justify-center gap-space-xs py-space-sm px-space-md bg-surface-container-high hover:bg-surface-container-highest text-primary font-label-md text-label-md font-bold rounded-lg transition-colors shadow-sm" href="${href}">
<span class="">${live ? "Entra nel Caveau" : "Proponi i tuoi Titoli"}</span>
<span class="material-symbols-outlined text-[16px]">arrow_forward</span>
</a>
</div>
</div>`;
}

function bindFilters() {
  const box = $("event-filters");
  box.addEventListener("click", (e) => {
    const btn = e.target.closest(".filter-btn");
    if (!btn) return;
    filter = btn.dataset.filter;
    render();
  });
}

bindFilters();
render();
subscribeEvents();

import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  db,
  escapeHtml,
  toDate,
  eventPhase,
  startCountdown,
  formatLongDate,
  coverOf,
  genreEmoji
} from "./app.js";
import { initLayout } from "./layout.js";
import { HOST_NAME, DEFAULT_COVER } from "./site-config.js";

let events = []; // { id, ...data } ordinati per startAt asc
const statsCache = new Map(); // eventId -> { participants, films, nicknames: [{uid,nickname}], votersCount }
let stopCountdown = null;

const $ = (id) => document.getElementById(id);

const DOT_COLORS = ["bg-primary", "bg-secondary", "bg-tertiary", "bg-surface-tint", "bg-primary-fixed", "bg-secondary-fixed"];

initLayout({ active: "serate" });

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
    }
  );
}

// ---------------------------------------------------------------- render

function render() {
  const now = new Date();
  const withPhase = events.map((ev) => ({ ev, phase: eventPhase(ev, now), stats: statsCache.get(ev.id) }));

  const count = $("stat-events-count");
  if (count) count.textContent = withPhase.length === 1 ? "1 serata" : `${withPhase.length} serate`;

  renderFeatured(withPhase.find((x) => x.phase !== "completed"));
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

render();
subscribeEvents();

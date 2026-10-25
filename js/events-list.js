import {
  collection,
  query,
  where,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  db,
  escapeHtml,
  toDate,
  eventPhase,
  formatLongDate,
  formatMetaDate,
  coverOf,
  genreEmoji,
  waitForUser,
  avatarHtml
} from "./app.js";
import { initLayout } from "./layout.js";
import { HOST_NAME, DEFAULT_COVER, MAX_FILMS } from "./site-config.js";

let events = []; // { id, ...data } ordinati per startAt asc
let loaded = false;
let unsubscribe = null;
let loadTimer = null;
const LOAD_TIMEOUT_MS = 10000;

// Partecipanti della sola serata in evidenza (live via onSnapshot).
let statsFor = null; // eventId osservato
let stopStats = null;
let stats = null; // null = in arrivo, { failed: true } = lettura fallita, altrimenti dati
let myUid = null;
let stopCountdown = null;
let lastPhase = null; // { id, phase } per animare lo sblocco una sola volta
let statsTimer = null;
let featuredId = null;
const STATS_TIMEOUT_MS = 6000;
const DEFAULT_SUB = "Proponi fino a 5 film in segreto: all'ora stabilita il caveau si apre e si vota.";

const $ = (id) => document.getElementById(id);

const MAX_TICKETS = 8;

initLayout({ active: "bacheca" });

// ---------------------------------------------------------------- dati

function watchStats(eventId) {
  if (statsFor === eventId) return;
  if (stopStats) stopStats();
  clearTimeout(statsTimer);
  statsFor = eventId;
  stats = null;
  // una lettura lenta non deve restare uno scheletro per sempre
  statsTimer = setTimeout(() => {
    if (stats === null) {
      stats = { timedOut: true };
      render();
    }
  }, STATS_TIMEOUT_MS);
  stopStats = onSnapshot(
    collection(db, "events", eventId, "participants"),
    (snap) => {
      clearTimeout(statsTimer);
      const people = [];
      let films = 0;
      snap.forEach((d) => {
        const p = d.data();
        const filmCount = Number(p.filmCount) || 0;
        films += filmCount;
        people.push({ uid: d.id, nickname: p.nickname || "", avatar: p.avatar || "", filmCount });
      });
      stats = { people, films };
      render();
    },
    (e) => {
      clearTimeout(statsTimer);
      console.warn("Partecipanti non disponibili per", eventId, e);
      stats = { failed: true };
      render();
    }
  );
}

function retryStats() {
  const id = featuredId;
  if (stopStats) stopStats();
  stopStats = null;
  statsFor = null;
  if (id) watchStats(id);
  render();
}

function setLoadState(state) {
  const loading = $("home-loading");
  const error = $("home-error");
  if (loading) loading.hidden = state !== "loading";
  if (error) error.hidden = state !== "error";
}

function showLoadError() {
  clearTimeout(loadTimer);
  loaded = false;
  if (stopCountdown) {
    stopCountdown();
    stopCountdown = null;
  }
  $("serata-imminente").hidden = true;
  $("other-events").hidden = true;
  $("home-empty").hidden = true;
  setLoadState("error");
}

function subscribeEvents() {
  loaded = false;
  setLoadState("loading");
  // Offline Firestore non segnala errori: dopo un po' meglio dirlo che girare a vuoto.
  clearTimeout(loadTimer);
  loadTimer = setTimeout(showLoadError, LOAD_TIMEOUT_MS);
  const q = query(collection(db, "events"), where("status", "==", "published"));
  unsubscribe = onSnapshot(
    q,
    (snap) => {
      clearTimeout(loadTimer);
      loaded = true;
      setLoadState("ready");
      events = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((e) => toDate(e.startAt))
        .sort((a, b) => toDate(a.startAt) - toDate(b.startAt));
      render();
    },
    (err) => {
      console.error(err);
      showLoadError();
    }
  );
}

// ---------------------------------------------------------------- render

// "In corso ora", "Oggi", "Domani", "Fra 3 giorni"
function statusLabel(start, live) {
  if (live) return "In corso ora";
  const day = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((day(start) - day(new Date())) / 86400000);
  if (days <= 0) return "Oggi";
  if (days === 1) return "Domani";
  return `Fra ${days} giorni`;
}

// Oltre le 48 ore: giorni / ore / minuti. Prima: ore / minuti / secondi.
function startHomeCountdown(target, onDone) {
  const els = [$("countdown-hours"), $("countdown-minutes"), $("countdown-seconds")];
  const labels = [$("countdown-label-1"), $("countdown-label-2"), $("countdown-label-3")];
  let done = false;
  let timer = null;
  const pad = (n) => String(n).padStart(2, "0");
  const tick = () => {
    const diff = Math.max(0, Math.floor((target.getTime() - Date.now()) / 1000));
    const far = diff >= 48 * 3600;
    const values = far
      ? [Math.floor(diff / 86400), Math.floor((diff % 86400) / 3600), Math.floor((diff % 3600) / 60)]
      : [Math.floor(diff / 3600), Math.floor((diff % 3600) / 60), diff % 60];
    const names = far ? ["GIORNI", "ORE", "MIN"] : ["ORE", "MIN", "SEC"];
    els.forEach((el, i) => {
      if (el) el.textContent = pad(values[i]);
    });
    labels.forEach((el, i) => {
      if (el) el.textContent = names[i];
    });
    if (diff <= 0 && !done) {
      done = true;
      clearInterval(timer);
      if (onDone) onDone();
    }
  };
  tick();
  if (!done) timer = setInterval(tick, 1000);
  return () => {
    done = true;
    clearInterval(timer);
  };
}

function render() {
  if (!loaded) return;
  const now = new Date();
  const upcoming = events
    .map((ev) => ({ ev, phase: eventPhase(ev, now) }))
    .filter((x) => x.phase !== "completed");
  renderFeatured(upcoming[0]);
  renderOthers(upcoming.slice(1, 4));
}

function renderOthers(items) {
  const box = $("other-events");
  if (!items.length) {
    box.hidden = true;
    return;
  }
  box.hidden = false;
  $("other-events-list").innerHTML = items
    .map(({ ev, phase }) => {
      const href = "event.html?id=" + encodeURIComponent(ev.id);
      const start = toDate(ev.startAt);
      return `<a class="flex items-center justify-between gap-space-md px-space-md py-space-sm min-h-[56px] bg-surface-container-low hover:bg-surface-container-high rounded-lg transition-colors" href="${href}">
<span class="flex flex-col min-w-0">
<span class="font-label-lg text-label-lg text-on-surface truncate">${escapeHtml(ev.title || "Serata")}</span>
<span class="font-label-md text-label-md text-on-surface-variant">${escapeHtml(formatLongDate(start))}</span>
</span>
<span class="flex items-center gap-space-xs font-label-md text-label-md text-primary whitespace-nowrap shrink-0">${escapeHtml(statusLabel(start, phase === "live"))}<span class="material-symbols-outlined text-[20px]" aria-hidden="true">chevron_right</span></span>
</a>`;
    })
    .join("");
}

function renderFeatured(item) {
  const section = $("serata-imminente");
  const empty = $("home-empty");
  if (empty) empty.hidden = !!item;
  if (stopCountdown) {
    stopCountdown();
    stopCountdown = null;
  }
  if (!item) {
    section.hidden = true;
    $("home-sub").textContent = DEFAULT_SUB;
    clearTimeout(statsTimer);
    if (stopStats) stopStats();
    stopStats = null;
    statsFor = null;
    featuredId = null;
    stats = null;
    return;
  }
  const { ev, phase } = item;
  featuredId = ev.id;
  watchStats(ev.id);
  const start = toDate(ev.startAt);
  const host = ev.hostName || HOST_NAME;
  const baseHref = "event.html?id=" + encodeURIComponent(ev.id);
  const live = phase === "live";
  const unavailable = !!(stats && (stats.failed || stats.timedOut));
  const ready = !!(stats && stats.people);
  const people = ready ? stats.people : [];
  const films = ready ? stats.films : 0;
  const me = people.find((p) => p.uid === myUid);
  section.hidden = false;
  $("home-sub").textContent = live ? "Il caveau è aperto. Si vota." : DEFAULT_SUB;

  // stato e data (il rosso solo se la serata e' live)
  $("featured-status").textContent = statusLabel(start, live);
  $("featured-status").classList.toggle("text-secondary", live);
  $("featured-status").classList.toggle("text-primary", !live);
  $("featured-status-ping").hidden = !live;
  $("featured-status-dot").classList.toggle("bg-secondary-container", live);
  $("featured-status-dot").classList.toggle("bg-primary", !live);
  $("featured-date").textContent = formatLongDate(start);
  const genre = $("featured-genre");
  genre.textContent = ev.genre ? `${genreEmoji(ev.genre)} ${ev.genre}` : "";
  genre.hidden = !ev.genre;
  $("featured-title").textContent = ev.title || "";
  const desc = $("featured-desc");
  desc.textContent = ev.description || "";
  desc.hidden = !ev.description;

  // caveau: la cover si vede ma e' sfocata finche' e' sigillato (una locandina non deve far
  // leggere un titolo); si fa nitida allo sblocco, che si anima una sola volta
  const cover = $("featured-cover");
  cover.onerror = () => {
    cover.onerror = null;
    cover.src = DEFAULT_COVER;
  };
  cover.src = coverOf(ev);
  cover.classList.toggle("blur-[8px]", !live);
  cover.classList.toggle("scale-110", !live);
  const justUnlocked = live && lastPhase && lastPhase.id === ev.id && lastPhase.phase !== "live";
  lastPhase = { id: ev.id, phase };
  $("featured-lock-icon").textContent = live ? "lock_open" : "lock";
  $("featured-lock").classList.toggle("unlock-pop", !!justUnlocked);
  $("featured-panel").classList.toggle("unlock-flash", !!justUnlocked);
  $("featured-lock-title").textContent = live ? "Caveau Aperto" : "Caveau Sigillato";
  const plural = films === 1;
  $("featured-lock-count").textContent = !ready
    ? live
      ? "Titoli svelati"
      : "Titoli segreti in attesa"
    : live
      ? `${films} ${plural ? "Titolo Svelato" : "Titoli Svelati"}`
      : `${films} ${plural ? "Titolo Segreto" : "Titoli Segreti"} in attesa`;
  const shown = Math.min(films, MAX_TICKETS);
  $("featured-tickets").innerHTML =
    '<span class="material-symbols-outlined text-[18px]">confirmation_number</span>'.repeat(shown) +
    (films > MAX_TICKETS ? `<span class="font-label-md text-label-md">+${films - MAX_TICKETS}</span>` : "");

  // countdown (solo prima dell'inizio)
  $("featured-countdown-box").hidden = live;
  if (!live) stopCountdown = startHomeCountdown(start, render);

  // partecipanti: scheletro in arrivo, messaggio con "Riprova" se non si leggono
  $("featured-participants-label").textContent = ready ? `Partecipanti (${people.length})` : "Partecipanti";
  if (unavailable) {
    $("featured-participants").innerHTML =
      '<span class="font-body-sm text-body-sm text-on-surface-variant">Non riesco a caricare chi partecipa.</span>' +
      '<button id="stats-retry" type="button" class="min-h-[44px] inline-flex items-center gap-space-xs px-space-md py-space-xs bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-md text-label-md rounded-full transition-colors"><span class="material-symbols-outlined text-primary text-[18px]" aria-hidden="true">refresh</span>Riprova</button>';
    $("stats-retry").onclick = retryStats;
  } else {
    $("featured-participants").innerHTML = !ready
      ? '<span class="h-8 w-24 rounded-full bg-surface-container-high" aria-hidden="true"></span>'.repeat(3)
      : people.length
        ? people
            .map((p) => {
              const star = p.uid === ev.createdBy ? ' <span class="text-primary font-bold text-xs" aria-hidden="true">★</span><span class="sr-only"> host</span>' : "";
              const you = p.uid === myUid ? ' <span class="text-primary">(tu)</span>' : "";
              const avatar = p.avatar ? `<span class="inline-flex items-center justify-center h-5 w-5 shrink-0 overflow-hidden rounded-full" aria-hidden="true">${avatarHtml(p.avatar)}</span>` : '<span class="w-2 h-2 rounded-full bg-primary" aria-hidden="true"></span>';
              return `<span class="inline-flex items-center gap-space-xs px-space-md py-space-xs bg-surface-container-high text-on-surface rounded-full font-label-md text-label-md font-medium">${avatar} ${escapeHtml(p.nickname)}${star}${you}</span>`;
            })
            .join("")
        : '<span class="font-body-sm text-body-sm text-on-surface-variant">Nessun partecipante ancora. Sii il primo!</span>';
  }
  $("featured-host").textContent = host;

  // CTA: un solo bottone primario, un solo verbo; sa se ci sei gia'
  const join = $("featured-cta-join");
  const joinLabel = join.querySelector("span:last-child");
  const joinIcon = join.querySelector("span:first-child");
  let label;
  let icon;
  let href;
  if (live) {
    label = "Entra & Vota";
    icon = "how_to_vote";
    href = baseHref + "#vota";
  } else if (me) {
    label = me.filmCount > 0 ? `Hai proposto ${me.filmCount}/${MAX_FILMS}, modifica` : "Ci sei: proponi i tuoi film";
    icon = "edit";
    href = baseHref + "#proponi";
  } else {
    label = "Proponi i tuoi film";
    icon = "add_to_queue";
    href = baseHref + "#proponi";
  }
  join.href = href;
  if (joinLabel) joinLabel.textContent = label;
  if (joinIcon) joinIcon.textContent = icon;
  $("featured-cta-details").href = baseHref;
  // la spiegazione serve a chi non e' ancora dentro
  $("featured-note").hidden = !!me;
}

$("home-empty").textContent = `Nessuna serata in programma. ${HOST_NAME} la annuncia in chat.`;

$("home-retry")?.addEventListener("click", () => {
  if (unsubscribe) unsubscribe();
  subscribeEvents();
});

// chi sei (senza creare un login anonimo): serve solo a personalizzare il CTA
waitForUser().then((user) => {
  myUid = user ? user.uid : null;
  render();
});

subscribeEvents();

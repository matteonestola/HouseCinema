import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  writeBatch,
  arrayUnion,
  arrayRemove,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db, escapeHtml, toDate, formatTime, showToast, normalizeFilms } from "./app.js";
import { AVATARS, HOST_NAME, LIVE_PAGE_SIZE } from "./site-config.js";

const $ = (id) => document.getElementById(id);

const AVATAR_ON = "w-9 h-9 rounded-xl bg-surface-container-high border-2 border-primary-container text-on-surface flex items-center justify-center text-[18px] shadow-[0_0_12px_rgba(245,158,11,0.35)] ring-2 ring-primary/40 transition-all";
const AVATAR_OFF = "w-9 h-9 rounded-xl bg-surface-container-lowest hover:bg-surface-container-high text-on-surface flex items-center justify-center text-[18px] transition-all hover:scale-105";
const VOTER_TONES = [
  "bg-primary-container text-on-primary-container",
  "bg-secondary-container text-white",
  "bg-tertiary-container text-on-tertiary-container",
  "bg-surface-bright text-on-surface",
  "bg-surface-container-highest text-primary"
];
const PROPOSER_TONES = [
  "bg-tertiary-container text-on-tertiary-container",
  "bg-secondary text-on-secondary",
  "bg-primary-container text-on-primary-container",
  "bg-surface-bright text-on-surface",
  "bg-surface-container-highest text-primary"
];
const GRADIENT_SPAN = "text-transparent bg-clip-text bg-gradient-to-r from-primary via-surface-tint to-secondary";
const TAB_ON = ["bg-surface-container-highest", "text-primary", "font-bold"];
const TAB_OFF = ["text-on-surface-variant", "hover:text-on-surface"];

function hashIndex(str, mod) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h % mod;
}

export function initLive(ctx) {
  let proposals = new Map(); // uid -> { nickname, films: raw }
  let votes = new Map(); // uid -> picks[]
  let films = []; // piatto: { id,title,note, proposerUid, proposerNickname }
  let filterMode = "all";
  let search = "";
  let page = 1;
  let selectedAvatar = AVATARS[0].emoji;
  let roulettePick = null;
  let rouletteTimer = null;

  // ------------------------------------------------------------ sottoscrizioni

  onSnapshot(
    collection(db, "events", ctx.eventId, "proposals"),
    (snap) => {
      proposals = new Map();
      snap.forEach((d) => proposals.set(d.id, d.data()));
      films = [];
      proposals.forEach((p, uid) => {
        normalizeFilms(p.films).forEach((f) => films.push({ ...f, proposerUid: uid, proposerNickname: p.nickname || "" }));
      });
      render();
    },
    (err) => console.warn("proposals", err.code)
  );

  onSnapshot(
    collection(db, "events", ctx.eventId, "votes"),
    (snap) => {
      votes = new Map();
      snap.forEach((d) => votes.set(d.id, Array.isArray(d.data().picks) ? d.data().picks : []));
      render();
    },
    (err) => console.warn("votes", err.code)
  );

  // ------------------------------------------------------------ calcoli

  function tally() {
    const t = new Map();
    films.forEach((f) => t.set(f.id, { count: 0, voterUids: [] }));
    votes.forEach((picks, uid) => {
      picks.forEach((id) => {
        const e = t.get(id);
        if (e) {
          e.count += 1;
          e.voterUids.push(uid);
        }
      });
    });
    return t;
  }

  function ranked(t) {
    return [...films].sort((a, b) => {
      const d = t.get(b.id).count - t.get(a.id).count;
      return d || a.title.localeCompare(b.title, "it");
    });
  }

  function myVotes() {
    return (ctx.user && votes.get(ctx.user.uid)) || [];
  }

  // ------------------------------------------------------------ render

  function renderHeader() {
    const ev = ctx.ev;
    const start = toDate(ev.startAt);
    $("live-start-time").textContent = start ? `Ore ${formatTime(start)} Superate` : "Serata iniziata";
    $("live-couch-count").textContent = String(ctx.participants.size);
    $("live-films-count").textContent = `${films.length} film`;
    const words = (ev.title || "").trim().split(/\s+/).filter(Boolean);
    const cut = words.length > 1 ? Math.ceil(words.length / 2) : 0;
    $("live-title").innerHTML =
      (cut ? escapeHtml(words.slice(0, cut).join(" ")) + " " : "") +
      `<span class="${GRADIENT_SPAN}">${escapeHtml(words.slice(cut).join(" "))}</span>`;
    $("live-subtitle").textContent = films.length
      ? `🎉 Sigillo infranto! Tutti i ${films.length} film proposti sono stati liberati. Votate democraticamente dal divano oppure lasciate decidere al Fato Cinefilo.`
      : "🎉 Sigillo infranto! Nessun film è stato proposto per questa serata.";
    $("live-join-card").hidden = !!ctx.me;
    $("roulette-desc").textContent = `Facciamo girare il proiettore tra i ${films.length} film svelati per rompere l'indecisione!`;
  }

  function voterAvatars(uids) {
    const shown = uids.slice(0, 5);
    $("spotlight-voters").innerHTML = shown
      .map((uid, i) => {
        const p = ctx.participants.get(uid) || {};
        return `<div class="inline-block h-7 w-7 rounded-full ${VOTER_TONES[i % VOTER_TONES.length]} flex items-center justify-center text-[12px] ring-2 ring-surface shadow-sm" title="${escapeHtml(p.nickname || "")}">${escapeHtml(p.avatar || AVATARS[0].emoji)}</div>`;
      })
      .join("");
    const extra = uids.length - shown.length;
    $("spotlight-voters-extra").textContent = extra > 0 ? `+ ${extra} altri` : "";
  }

  function renderSpotlight(t) {
    const section = $("spotlight");
    const ev = ctx.ev;
    const n = ctx.participants.size;
    const scr = ev.screening;
    let film = null;
    let count = 0;
    let voterUids = [];
    if (scr) {
      film = films.find((f) => f.id === scr.filmId) || { id: scr.filmId, title: scr.title, proposerNickname: scr.proposerNickname };
      count = Number(scr.votes) || 0;
      voterUids = (t.get(scr.filmId) || { voterUids: [] }).voterUids;
    } else {
      const top = ranked(t)[0];
      if (top) {
        film = top;
        count = t.get(top.id).count;
        voterUids = t.get(top.id).voterUids;
      }
    }
    section.hidden = !film;
    if (!film) return;

    $("spotlight-badge").textContent = scr ? "FILM SCELTO" : "1° IN CLASSIFICA";
    $("spotlight-genre").textContent = ev.genre || "";
    $("spotlight-title").textContent = film.title;
    $("spotlight-votes").textContent = `${count} / ${n} voti`;
    const almost = count > 0 && count >= Math.ceil(n * 0.75);
    if (scr) {
      $("spotlight-headline-label").textContent = "Proiezione avviata";
      $("spotlight-headline").textContent = "Luci basse, si parte!";
    } else if (almost) {
      $("spotlight-headline-label").textContent = "Scelta del gruppo (Quasi unanime!)";
      $("spotlight-headline").textContent = "Il divano ha parlato chiaramente.";
    } else {
      $("spotlight-headline-label").textContent = "In testa alla classifica";
      $("spotlight-headline").textContent = count > 0 ? "Il divano sta ancora decidendo." : "Il divano non ha ancora votato.";
    }
    $("spotlight-proposer").textContent = film.proposerNickname || "";
    $("spotlight-note-wrap").innerHTML = film.note
      ? ` con la motivazione: <em id="spotlight-note" class="text-on-surface-variant font-medium">“${escapeHtml(film.note)}”</em>`
      : " (nessuna motivazione)";
    voterAvatars(voterUids);

    const btn = $("start-screening-btn");
    const note = $("start-screening-note");
    if (scr) {
      btn.hidden = true;
      note.hidden = true;
    } else {
      btn.hidden = false;
      note.hidden = ctx.isAdmin;
      const can = ctx.isAdmin;
      btn.disabled = !can;
      btn.classList.toggle("opacity-50", !can);
      btn.classList.toggle("cursor-not-allowed", !can);
      note.textContent = `Azione riservata all'Host (${ctx.ev.hostName || HOST_NAME})`;
    }
  }

  function filteredFilms(t) {
    let list = ranked(t);
    if (filterMode === "top") {
      const distinct = [...new Set(list.map((f) => t.get(f.id).count).filter((c) => c > 0))].sort((a, b) => b - a);
      const threshold = distinct.length ? distinct[Math.min(2, distinct.length - 1)] : Infinity;
      list = list.filter((f) => t.get(f.id).count > 0 && t.get(f.id).count >= threshold);
    }
    const s = search.trim().toLowerCase();
    if (s) list = list.filter((f) => `${f.title} ${f.proposerNickname} ${f.note || ""}`.toLowerCase().includes(s));
    return list;
  }

  function movieCard(f, t, isLeader, votedSet, canVote) {
    const count = t.get(f.id).count;
    const voted = votedSet.has(f.id);
    const nick = f.proposerNickname || "";
    const tone = PROPOSER_TONES[hashIndex(f.proposerUid || nick, PROPOSER_TONES.length)];
    const badge = isLeader
      ? `<div class="flex items-center justify-between gap-space-xs"><span class="px-space-sm py-space-xs rounded-md bg-primary-container text-on-primary-container font-label-sm text-label-sm font-bold shadow-md">★ #1 in Testa</span></div>`
      : "";
    const cls = voted
      ? "bg-primary-container text-on-primary-container"
      : "bg-surface-container-highest text-primary hover:bg-primary-container hover:text-on-primary-container";
    const disabled = canVote ? "" : " opacity-50 cursor-not-allowed";
    const inner = voted
      ? '<span class="material-symbols-outlined text-[18px]">check_circle</span><span>Votato! 🍿</span>'
      : '<span class="material-symbols-outlined text-[18px]">thumb_up</span><span class="">Voglio vederlo! 🍿</span>';
    return `<article class="movie-card flex flex-col rounded-xl bg-surface-container overflow-hidden shadow-lg transition-transform hover:-translate-y-1" data-votes="${count}">
<div class="p-space-md bg-surface-container-lowest border-b border-outline-variant/20 flex flex-col gap-space-xs">${badge}<div class="pt-space-xs"><h3 class="font-headline-sm text-headline-sm text-on-surface font-bold">${escapeHtml(f.title)}</h3></div></div>
<div class="p-space-md flex flex-col flex-1 justify-between gap-space-md">
<div class="flex flex-col gap-space-sm">
<div class="flex items-center justify-between gap-space-xs bg-surface-container-low px-space-sm py-space-xs rounded-lg">
<div class="flex items-center gap-space-xs">
<div class="w-6 h-6 rounded-full ${tone} flex items-center justify-center font-label-sm text-[10px] font-bold">${escapeHtml(nick.charAt(0).toUpperCase())}</div>
<span class="font-label-sm text-label-sm text-on-surface-variant">Proposto da <strong class="text-on-surface">${escapeHtml(nick)}</strong></span>
</div>
<span class="material-symbols-outlined text-primary text-[16px]">format_quote</span>
</div>
<p class="font-body-sm text-body-sm text-on-surface-variant italic">
                  ${f.note ? "“" + escapeHtml(f.note) + "”" : "Nessuna nota inserita."}
                </p>
</div>
<div class="flex items-center justify-between gap-space-sm pt-space-xs">
<button class="vote-button flex-1 inline-flex items-center justify-center gap-space-xs py-space-sm px-space-md rounded-lg ${cls}${disabled} transition-all font-label-md text-label-md font-bold" data-film-id="${escapeHtml(f.id)}" ${canVote ? "" : 'aria-disabled="true"'} type="button">${inner}</button>
<div class="flex items-center gap-1 px-space-sm py-space-xs rounded-lg bg-surface-container-low font-headline-sm text-headline-sm text-primary font-bold">
<span class="vote-count">${count}</span>
<span class="font-label-sm text-[10px] text-on-surface-variant uppercase font-medium">voti</span>
</div>
</div>
</div>
</article>`;
  }

  function emptyBox(text) {
    return `<div class="col-span-full p-space-md rounded-xl bg-surface-container-low text-on-surface-variant"><span class="font-body-sm text-body-sm">${escapeHtml(text)}</span></div>`;
  }

  function renderGrid(t) {
    const list = filteredFilms(t);
    const visible = list.slice(0, LIVE_PAGE_SIZE * page);
    const votedSet = new Set(myVotes());
    const canVote = !!ctx.me && !ctx.ev.screening;
    const leaderId = !ctx.ev.screening && films.length ? ranked(t)[0].id : null;
    const leaderHasVotes = leaderId && t.get(leaderId).count > 0;
    $("movies-container").innerHTML = visible.length
      ? visible.map((f) => movieCard(f, t, leaderHasVotes && f.id === leaderId, votedSet, canVote)).join("")
      : emptyBox(films.length ? "Nessun film corrisponde ai filtri." : "Nessun film proposto");

    document.querySelectorAll("#filter-tabs .filter-tab").forEach((tab) => {
      const on = tab.dataset.filter === filterMode;
      TAB_ON.forEach((c) => tab.classList.toggle(c, on));
      TAB_OFF.forEach((c) => tab.classList.toggle(c, !on));
      if (tab.dataset.filter === "all") tab.textContent = `Tutti i Film (${films.length})`;
    });
    $("movie-search").placeholder = `Cerca tra i ${films.length} film...`;
    $("live-pagination-text").innerHTML = `Visualizzati <strong class="text-on-surface">${visible.length} di ${list.length} film</strong> svelati dal Caveau segreto.`;
    const remaining = list.length - visible.length;
    $("live-load-more").hidden = remaining <= 0;
    $("live-load-more").textContent = `Carica gli altri ${remaining} film ↓`;
  }

  function render() {
    const t = tally();
    renderHeader();
    renderSpotlight(t);
    renderGrid(t);
  }

  // ------------------------------------------------------------ voto

  async function toggleVote(filmId) {
    if (!ctx.me) {
      showToast("Partecipa alla serata per votare", "how_to_reg");
      return false;
    }
    if (ctx.ev.screening) return false;
    const has = myVotes().includes(filmId);
    try {
      await setDoc(
        doc(db, "events", ctx.eventId, "votes", ctx.user.uid),
        { picks: has ? arrayRemove(filmId) : arrayUnion(filmId), updatedAt: serverTimestamp() },
        { merge: true }
      );
      return true;
    } catch (err) {
      console.error(err);
      showToast("Voto non registrato. Riprova.", "error");
      return false;
    }
  }

  // ------------------------------------------------------------ modali

  function openModal(el) {
    el.classList.remove("hidden");
    setTimeout(() => el.classList.remove("opacity-0"), 10);
  }
  function closeModal(el) {
    el.classList.add("opacity-0");
    setTimeout(() => el.classList.add("hidden"), 300);
  }

  function runRoulette() {
    if (!films.length) {
      showToast("Nessun film da estrarre", "casino");
      return;
    }
    const modal = $("roulette-modal");
    openModal(modal);
    $("roulette-title").textContent = "Estrazione in corso...";
    $("roulette-result-box").classList.add("hidden");
    $("accept-roulette").classList.add("hidden");
    roulettePick = null;
    clearTimeout(rouletteTimer);
    rouletteTimer = setTimeout(() => {
      roulettePick = films[Math.floor(Math.random() * films.length)];
      $("roulette-movie-name").textContent = roulettePick.title;
      $("roulette-proposer").textContent = `Proposto da ${roulettePick.proposerNickname}`;
      $("roulette-title").textContent = "Il Fato ha scelto!";
      $("roulette-result-box").classList.remove("hidden");
      $("accept-roulette").classList.remove("hidden");
    }, 1400);
  }

  async function acceptRoulette() {
    const pick = roulettePick;
    closeModal($("roulette-modal"));
    if (!pick) return;
    if (!myVotes().includes(pick.id)) await toggleVote(pick.id);
  }

  async function startScreening() {
    if (!ctx.isAdmin || ctx.ev.screening) return;
    const t = tally();
    const top = ranked(t)[0];
    if (!top) {
      showToast("Nessun film da proiettare", "error");
      return;
    }
    try {
      await updateDoc(doc(db, "events", ctx.eventId), {
        screening: {
          filmId: top.id,
          title: top.title,
          proposerNickname: top.proposerNickname || "",
          votes: t.get(top.id).count,
          startedAt: serverTimestamp()
        }
      });
    } catch (err) {
      console.error(err);
      showToast("Impossibile avviare la proiezione", "error");
    }
  }

  function maybeShowScreening() {
    const scr = ctx.ev.screening;
    if (!scr) return;
    const key = "screening-shown-" + ctx.eventId;
    let seen = false;
    try {
      seen = !!sessionStorage.getItem(key);
      if (!seen) sessionStorage.setItem(key, "1");
    } catch (e) {
      /* sessionStorage non disponibile */
    }
    if (seen) return;
    $("screening-title").textContent = `Buona Visione con '${scr.title}'`;
    $("screening-desc").textContent = `Le luci del salotto sono abbassate. L'evento è stato registrato nell'archivio storico con ${Number(scr.votes) || 0} voti a favore.`;
    openModal($("screening-modal"));
  }

  // ------------------------------------------------------------ join tardivo

  function renderLateAvatars() {
    $("live-avatar-selector").innerHTML = AVATARS.map((a) => {
      const on = a.emoji === selectedAvatar;
      return `<button class="${on ? AVATAR_ON : AVATAR_OFF}" data-avatar="${escapeHtml(a.emoji)}" title="${escapeHtml(a.title)}" type="button"><span class="transform hover:scale-110 transition-transform">${a.emoji}</span></button>`;
    }).join("");
  }

  async function submitLateJoin(e) {
    e.preventDefault();
    const nickname = $("live-nickname").value.trim();
    if (!nickname || nickname.length > 30) {
      showToast("Inserisci un nome tra 1 e 30 caratteri", "error");
      return;
    }
    try {
      const uid = ctx.user.uid;
      const pref = doc(db, "events", ctx.eventId, "proposals", uid);
      let rawFilms = [];
      try {
        const snap = await getDoc(pref);
        if (snap.exists() && Array.isArray(snap.data().films)) rawFilms = snap.data().films;
      } catch (err) {
        rawFilms = [];
      }
      const batch = writeBatch(db);
      batch.set(doc(db, "events", ctx.eventId, "participants", uid), {
        nickname,
        avatar: selectedAvatar,
        snack: "solo_presenza",
        filmCount: rawFilms.length,
        joinedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      batch.set(pref, { nickname, films: rawFilms, updatedAt: serverTimestamp() });
      await batch.commit();
      showToast("Benvenuto sul divano! Ora puoi votare.", "celebration");
    } catch (err) {
      console.error(err);
      showToast("Impossibile partecipare. Riprova.", "error");
    }
  }

  // ------------------------------------------------------------ wiring

  $("movies-container").addEventListener("click", (e) => {
    const btn = e.target.closest(".vote-button");
    if (btn) toggleVote(btn.dataset.filmId);
  });
  $("filter-tabs").addEventListener("click", (e) => {
    const tab = e.target.closest(".filter-tab");
    if (!tab) return;
    filterMode = tab.dataset.filter;
    page = 1;
    render();
  });
  $("movie-search").addEventListener("input", (e) => {
    search = e.target.value;
    page = 1;
    render();
  });
  $("live-load-more").addEventListener("click", () => {
    page += 1;
    render();
  });
  $("roulette-trigger").addEventListener("click", runRoulette);
  $("close-roulette").addEventListener("click", () => closeModal($("roulette-modal")));
  $("accept-roulette").addEventListener("click", acceptRoulette);
  $("start-screening-btn").addEventListener("click", startScreening);
  $("close-screening").addEventListener("click", () => closeModal($("screening-modal")));
  $("live-join-form").addEventListener("submit", submitLateJoin);
  $("live-avatar-selector").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-avatar]");
    if (!btn) return;
    selectedAvatar = btn.dataset.avatar;
    renderLateAvatars();
  });

  renderLateAvatars();
  render();
  maybeShowScreening();

  return {
    onParticipants() {
      render();
    },
    onEvent() {
      render();
      maybeShowScreening();
    }
  };
}

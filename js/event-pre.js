import {
  doc,
  getDoc,
  writeBatch,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  db,
  escapeHtml,
  toDate,
  startCountdown,
  formatMetaDate,
  formatTime,
  showToast,
  genFilmId,
  normalizeFilms,
  snackShort,
  coverOf,
  inviteUrl
} from "./app.js";
import { AVATARS, SPECIAL_AVATARS, SNACKS, MAX_FILMS, HOST_NAME, DEFAULT_COVER } from "./site-config.js";

const $ = (id) => document.getElementById(id);

// Classi dei bottoni avatar (export Stitch): primo = selezionato, altri = non selezionati.
const AVATAR_ON = "w-9 h-9 rounded-xl bg-surface-container-high border-2 border-primary-container text-on-surface flex items-center justify-center text-[18px] shadow-[0_0_12px_rgba(245,158,11,0.35)] ring-2 ring-primary/40 transition-all";
const AVATAR_OFF = "w-9 h-9 rounded-xl bg-surface-container-lowest hover:bg-surface-container-high text-on-surface flex items-center justify-center text-[18px] transition-all hover:scale-105";
const SPECIAL_TONES = [
  "bg-secondary-container/20 border border-secondary-container/40",
  "bg-tertiary-container/20 border border-tertiary-container/40",
  "bg-primary-container/20 border border-primary-container/40"
];
const SPECIAL_BASE = "flex items-center gap-1.5 px-space-xs py-1 rounded-lg bg-surface-container-lowest hover:bg-surface-container-high border border-outline-variant transition-all hover:border-primary text-left group";
const SPECIAL_ON = "flex items-center gap-1.5 px-space-xs py-1 rounded-lg bg-surface-container-high border border-primary transition-all text-left group";
const RING_BORDERS = ["border-secondary-container", "border-tertiary/40", "border-secondary/40", "border-outline-variant"];
const MYSTERY_TONES = [
  { grad: "from-secondary-container/40", icon: "text-primary", blur: "blur-[3px]" },
  { grad: "from-primary-container/40", icon: "text-tertiary", blur: "blur-[3px]" },
  { grad: "from-secondary-container/30", icon: "text-primary", blur: "blur-[3.5px]" },
  { grad: "from-tertiary-container/30", icon: "text-tertiary", blur: "blur-[3.5px]" }
];

export function initPre(ctx) {
  let myFilms = [];
  let editingId = null;
  let selectedAvatar = AVATARS[0].emoji;
  let formInit = false;
  let stopCountdown = null;
  let countdownFor = 0;
  let shareTimer = null;

  // ------------------------------------------------------------ hero / time-lock

  function timeText() {
    const d = toDate(ctx.ev.startAt);
    return d ? formatTime(d) : "";
  }

  function tagOf(genre) {
    return "#" + String(genre).toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_|_$/g, "");
  }

  function renderHero() {
    const ev = ctx.ev;
    const start = toDate(ev.startAt);
    const host = ev.hostName || HOST_NAME;
    $("pre-breadcrumb-title").textContent = ev.title || "";
    $("pre-tags").innerHTML = ev.genre
      ? `<span class="px-space-sm py-0.5 bg-surface-container-high text-primary font-label-sm text-label-sm font-bold tracking-wider rounded-md">${escapeHtml(tagOf(ev.genre))}</span>`
      : "";
    $("pre-title").textContent = ev.title || "";
    $("pre-host").textContent = `${host} (Host)`;
    const tagline = (ev.description || "").trim();
    const short = tagline.length > 80 ? tagline.slice(0, 79).trimEnd() + "…" : tagline;
    $("pre-tagline").textContent = short;
    $("pre-tagline").hidden = !short;
    if ($("pre-tagline").previousElementSibling) $("pre-tagline").previousElementSibling.hidden = !short;
    $("pre-when").textContent = start ? formatMetaDate(start) : "";
    $("pre-location").textContent = ev.location || "Da definire";
    const cover = $("pre-cover");
    cover.onerror = () => {
      cover.onerror = null;
      cover.src = DEFAULT_COVER;
    };
    cover.src = coverOf(ev);
    $("pre-theme").textContent = ev.genre ? tagOf(ev.genre) : ev.title || "";

    const t = timeText();
    $("pre-reveal-note").textContent = `🔒 I film proposti da tutti restano segreti e protetti fino alle ${t} spaccate. Da quel momento il caveau si aprirà per tutti i presenti, svelando la lista per il voto live!`;
    $("proposals-note").textContent = `Proponi fino a ${MAX_FILMS} film. I titoli resteranno anonimi e crittografati fino al reveal delle ${t}.`;
    $("mystery-reveal-time").textContent = `I titoli diverranno leggibili in automatico alle ore ${t}`;
    $("pre-vote-banner-title").textContent = `Come voteremo stasera alle ${t}?`;
  }

  function renderTimeLock() {
    const start = toDate(ctx.ev.startAt);
    if (!start) return;
    if (stopCountdown && countdownFor === start.getTime()) return;
    if (stopCountdown) stopCountdown();
    countdownFor = start.getTime();
    stopCountdown = startCountdown(
      start,
      { h: $("pre-countdown-hours"), m: $("pre-countdown-minutes"), s: $("pre-countdown-seconds") },
      () => ctx.route && ctx.route()
    );
  }

  // ------------------------------------------------------------ caveau

  function renderCaveauStats() {
    const list = [...ctx.participants.values()];
    const total = list.reduce((sum, p) => sum + (Number(p.filmCount) || 0), 0);
    const slots = list.length * MAX_FILMS;
    const pct = slots ? Math.round((total / slots) * 100) : 0;
    $("caveau-count").textContent = String(total);
    $("caveau-friends").textContent = `${list.length} ${list.length === 1 ? "amico partecipante" : "amici partecipanti"}`;
    $("caveau-bar").style.width = pct + "%";
    $("caveau-slots").textContent = `${total} / ${slots} slot utilizzati`;
    $("caveau-pct").textContent = `${pct}% riempimento`;
  }

  // ------------------------------------------------------------ join

  function avatarButton(a) {
    const on = a.emoji === selectedAvatar;
    return `<button class="${on ? AVATAR_ON : AVATAR_OFF}" data-avatar="${escapeHtml(a.emoji)}" title="${escapeHtml(a.title)}" type="button"><span class="transform hover:scale-110 transition-transform">${a.emoji}</span></button>`;
  }

  function renderAvatars() {
    $("avatar-selector").innerHTML = AVATARS.map(avatarButton).join("");
    $("special-avatars").innerHTML = SPECIAL_AVATARS.map(
      (a, i) => `<button class="${a.emoji === selectedAvatar ? SPECIAL_ON : SPECIAL_BASE}" data-avatar="${escapeHtml(a.emoji)}" title="${escapeHtml(a.label)}" type="button"><div class="w-6 h-6 rounded-md ${SPECIAL_TONES[i % SPECIAL_TONES.length]} flex items-center justify-center text-[13px]">${a.emoji}</div><span class="font-label-sm text-[11px] text-on-surface group-hover:text-primary transition-colors font-medium">${escapeHtml(a.label)}</span></button>`
    ).join("");
    const all = [...AVATARS.map((a) => [a.emoji, a.title]), ...SPECIAL_AVATARS.map((a) => [a.emoji, a.label])];
    const found = all.find(([e]) => e === selectedAvatar);
    $("avatar-active-label").textContent = found ? `${found[1]} attivo` : "";
    $("special-avatars-tag").textContent = ctx.ev.genre ? tagOf(ctx.ev.genre) : "";
  }

  function buildSnacks() {
    $("snack-selection").innerHTML = SNACKS.map(
      (s) => `<option value="${escapeHtml(s.id)}">${escapeHtml(s.label)}</option>`
    ).join("");
  }

  function renderJoin() {
    const me = ctx.me;
    const first = !formInit;
    if (first) {
      formInit = true;
      if (me) {
        $("participant-name").value = me.nickname || "";
        selectedAvatar = me.avatar || AVATARS[0].emoji;
        $("snack-selection").value = me.snack || "solo_presenza";
      } else {
        selectedAvatar = AVATARS[0].emoji;
        $("snack-selection").value = "popcorn";
      }
      renderAvatars();
    }
    $("proposals-section").hidden = !me;
    const rec = $("participant-recognized");
    rec.hidden = !me;
    if (me) rec.textContent = `✓ Riconosciuto da invito locale come ${me.nickname || ""}`;
    $("rsvp-submit-label").textContent = me ? "Aggiorna Partecipazione" : "Conferma Partecipazione";
    const alert = $("rsvp-status-alert");
    if (me) {
      const sn = snackShort(me.snack);
      const tail = me.snack && me.snack !== "solo_presenza" && sn ? ` Abbiamo registrato: ${sn}.` : "";
      $("rsvp-status-text").textContent = `Ottimo ${me.nickname}! Presenza confermata.${tail}`;
      alert.classList.remove("hidden");
    } else {
      alert.classList.add("hidden");
    }
  }

  async function submitJoin(e) {
    e.preventDefault();
    const nickname = $("participant-name").value.trim();
    if (!nickname || nickname.length > 30) {
      showToast("Inserisci un nome tra 1 e 30 caratteri", "error");
      return;
    }
    const snack = $("snack-selection").value;
    const btn = $("rsvp-submit");
    btn.disabled = true;
    try {
      const uid = ctx.user.uid;
      const batch = writeBatch(db);
      batch.set(doc(db, "events", ctx.eventId, "participants", uid), {
        nickname,
        avatar: selectedAvatar,
        snack,
        filmCount: myFilms.length,
        joinedAt: (ctx.me && ctx.me.joinedAt) || serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      batch.set(doc(db, "events", ctx.eventId, "proposals", uid), {
        nickname,
        films: myFilms,
        updatedAt: serverTimestamp()
      });
      await batch.commit();
      const sn = snackShort(snack);
      const tail = snack !== "solo_presenza" && sn ? ` Abbiamo registrato: ${sn}.` : "";
      $("rsvp-status-text").textContent = `Ottimo ${nickname}! Presenza confermata.${tail}`;
      $("rsvp-status-alert").classList.remove("hidden");
      $("rsvp-status-alert").scrollIntoView({ behavior: "smooth", block: "nearest" });
    } catch (err) {
      console.error(err);
      showToast(err.code === "permission-denied" ? "Il caveau è ormai sigillato" : "Impossibile salvare. Riprova.", "error");
    } finally {
      btn.disabled = false;
    }
  }

  // ------------------------------------------------------------ film

  async function loadMyFilms() {
    try {
      const snap = await getDoc(doc(db, "events", ctx.eventId, "proposals", ctx.user.uid));
      myFilms = snap.exists() ? normalizeFilms(snap.data().films) : [];
    } catch (e) {
      myFilms = [];
    }
    renderMyFilms();
  }

  function noteBox(note) {
    return note
      ? `<div class="mt-space-xs inline-flex items-center gap-1.5 px-space-sm py-1 bg-surface-container-lowest/70 rounded-md font-body-sm text-body-sm text-primary">
<span class="material-symbols-outlined text-[15px]">format_quote</span>
<span class="italic text-[13px] text-on-surface">"${escapeHtml(note)}"</span>
</div>`
      : `<div class="mt-space-xs inline-flex items-center gap-1.5 px-space-sm py-1 bg-surface-container-lowest/40 rounded-md font-body-sm text-body-sm text-on-surface-variant">
<span class="material-symbols-outlined text-[15px]">speaker_notes_off</span>
<span class="italic text-[12px]">Nessuna nota inserita</span>
</div>`;
  }

  function filmCard(f) {
    return `<div class="bg-surface-container p-space-md rounded-xl hover:bg-surface-container-high transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-space-md group">
<div class="flex items-start gap-space-md">
<div class="flex flex-col min-w-0">
<div class="flex items-center gap-space-xs flex-wrap">
<h4 class="font-headline-sm text-headline-sm text-on-surface font-bold group-hover:text-primary transition-colors">${escapeHtml(f.title)}</h4>
</div>
${noteBox(f.note)}
</div>
</div>
<div class="flex items-center gap-space-xs shrink-0 self-end sm:self-center">
<button class="p-space-xs rounded-lg hover:bg-surface-container-highest text-on-surface-variant hover:text-primary transition-colors" data-action="edit" data-id="${escapeHtml(f.id)}" title="Modifica film" type="button">
<span class="material-symbols-outlined text-[20px]">edit</span>
</button>
<button class="p-space-xs rounded-lg hover:bg-surface-container-highest text-on-surface-variant hover:text-error transition-colors" data-action="delete" data-id="${escapeHtml(f.id)}" title="Rimuovi film" type="button">
<span class="material-symbols-outlined text-[20px]">delete</span>
</button>
</div>
</div>`;
  }

  function filmForm({ idPrefix, number, hint, film, saveLabel }) {
    const formId = idPrefix === "slot" ? ' id="slot-form"' : ' id="edit-form"';
    const cancelId = idPrefix === "slot" ? "slot-cancel" : "edit-cancel";
    const saveId = idPrefix === "slot" ? "slot-save" : "edit-save";
    return `<div class="bg-surface-container-highest/40 p-space-md rounded-xl">
<div class="flex items-center justify-between mb-space-sm">
<div class="flex items-center gap-space-xs">
<span class="w-6 h-6 rounded-full bg-primary-container text-on-primary-container font-label-sm text-[11px] font-bold flex items-center justify-center">${number}</span>
<span class="font-label-lg text-label-lg font-bold text-on-surface">${escapeHtml(hint.title)}</span>
</div>
<span class="font-label-sm text-[11px] text-tertiary">${escapeHtml(hint.side)}</span>
</div>
<form class="grid grid-cols-1 md:grid-cols-12 gap-space-sm"${formId}>
<div class="md:col-span-6 flex flex-col gap-1">
<label class="font-label-sm text-[11px] text-on-surface-variant uppercase font-semibold">Titolo del Film *</label>
<input class="h-11 bg-surface-container-lowest text-on-surface px-space-md rounded-lg font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-primary-container" id="${idPrefix}-title" maxlength="120" placeholder="es. Nightmare - Dal profondo della notte" type="text" value="${escapeHtml(film ? film.title : "")}">
</div>
<div class="md:col-span-6 flex flex-col gap-1">


</div>
<div class="md:col-span-12 flex flex-col gap-1">
<label class="font-label-sm text-[11px] text-on-surface-variant uppercase font-semibold">Nota o consiglio per convincere gli amici (opzionale)</label>
<input class="h-11 bg-surface-container-lowest text-on-surface px-space-md rounded-lg font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-primary-container" id="${idPrefix}-note" maxlength="200" placeholder="es. L'esordio di Johnny Depp e la leggendaria camicia a righe!" type="text" value="${escapeHtml(film && film.note ? film.note : "")}">
</div>
<div class="md:col-span-12 flex justify-end gap-space-sm mt-space-xs">
<button class="px-space-md py-space-xs bg-surface-container hover:bg-surface-container-high text-on-surface-variant rounded-lg font-label-md text-label-md transition-colors" id="${cancelId}" type="button">
                      Annulla
                    </button>
<button class="px-space-lg py-space-xs bg-primary hover:bg-primary-fixed-dim text-on-primary font-label-md text-label-md font-bold rounded-lg shadow-md transition-all flex items-center gap-space-xs" id="${saveId}" type="submit">
<span class="material-symbols-outlined text-[18px]">add</span>
<span class="">${escapeHtml(saveLabel)}</span>
</button>
</div>
</form>
</div>`;
  }

  function slotPlaceholder(k, last) {
    return `<div class="p-space-md rounded-xl bg-surface-container-lowest/50 hover:bg-surface-container/60 transition-all flex items-center justify-between">
<div class="flex items-center gap-space-md">
<div class="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-outline">
<span class="material-symbols-outlined text-[22px]">add_circle</span>
</div>
<div>
<p class="font-label-lg text-label-lg font-semibold text-on-surface">Slot Film #${k}${last ? " (Ultimo Slot Libero)" : ""}</p>
<p class="font-body-sm text-body-sm text-on-surface-variant">Hai un'altra chicca da consigliare al gruppo?</p>
</div>
</div>
<button class="px-space-md py-space-xs bg-surface-container-high hover:bg-surface-container-highest text-primary font-label-md text-label-md font-bold rounded-lg transition-colors flex items-center gap-1" data-action="focus-slot" type="button">
<span class="">+ Aggiungi</span>
</button>
</div>`;
  }

  function renderMyFilms() {
    const n = myFilms.length;
    $("slots-used").textContent = `${n} di ${MAX_FILMS}`;
    $("slots-bar").style.width = (n / MAX_FILMS) * 100 + "%";

    $("my-films").innerHTML = myFilms
      .map((f, i) =>
        f.id === editingId
          ? filmForm({
              idPrefix: "edit",
              number: i + 1,
              hint: { title: `Modifica Film #${i + 1}`, side: "" },
              film: f,
              saveLabel: `Salva Film #${i + 1}`
            })
          : filmCard(f)
      )
      .join("");

    const area = $("slot-area");
    if (n >= MAX_FILMS) {
      area.innerHTML = "";
      return;
    }
    const left = MAX_FILMS - n - 1;
    let html = filmForm({
      idPrefix: "slot",
      number: n + 1,
      hint: { title: `Slot Film #${n + 1} (Aggiungi ora)`, side: left > 0 ? `Ancora ${left} ${left === 1 ? "slot disponibile" : "slot disponibili"}` : "Ultimo slot disponibile" },
      film: null,
      saveLabel: `Salva Film #${n + 1}`
    });
    for (let k = n + 2; k <= MAX_FILMS; k++) html += slotPlaceholder(k, k === MAX_FILMS);
    // preserva quanto digitato nel form di aggiunta se gia' presente
    const prevTitle = $("slot-title") ? $("slot-title").value : "";
    const prevNote = $("slot-note") ? $("slot-note").value : "";
    area.innerHTML = html;
    if (prevTitle || prevNote) {
      $("slot-title").value = prevTitle;
      $("slot-note").value = prevNote;
    }
  }

  async function saveFilms(nextFilms, message) {
    const me = ctx.me;
    if (!me) {
      showToast("Conferma prima la partecipazione", "error");
      return false;
    }
    try {
      const uid = ctx.user.uid;
      const batch = writeBatch(db);
      batch.set(doc(db, "events", ctx.eventId, "proposals", uid), {
        nickname: me.nickname,
        films: nextFilms,
        updatedAt: serverTimestamp()
      });
      batch.set(doc(db, "events", ctx.eventId, "participants", uid), {
        nickname: me.nickname,
        avatar: me.avatar || AVATARS[0].emoji,
        snack: me.snack || "solo_presenza",
        filmCount: nextFilms.length,
        joinedAt: me.joinedAt || serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      await batch.commit();
      myFilms = nextFilms;
      editingId = null;
      renderMyFilms();
      showToast(message || "Film salvato nel caveau segreto!", "lock");
      return true;
    } catch (err) {
      console.error(err);
      showToast(err.code === "permission-denied" ? "Il caveau è ormai sigillato" : "Impossibile salvare. Riprova.", "error");
      return false;
    }
  }

  function readFilm(prefix) {
    const title = ($(prefix + "-title").value || "").trim();
    const note = ($(prefix + "-note").value || "").trim();
    return { title, note };
  }

  function buildFilm(id, { title, note }) {
    const f = { id, title };
    if (note) f.note = note;
    return f;
  }

  function onAreaSubmit(e) {
    const form = e.target;
    if (form.id === "slot-form") {
      e.preventDefault();
      const v = readFilm("slot");
      if (!v.title) {
        showToast("Inserisci il titolo del film", "error");
        return;
      }
      if (myFilms.length >= MAX_FILMS) return;
      saveFilms([...myFilms, buildFilm(genFilmId(), v)]).then((ok) => {
        if (ok && $("slot-title")) {
          $("slot-title").value = "";
          $("slot-note").value = "";
        }
      });
    } else if (form.id === "edit-form") {
      e.preventDefault();
      const v = readFilm("edit");
      if (!v.title) {
        showToast("Inserisci il titolo del film", "error");
        return;
      }
      saveFilms(myFilms.map((f) => (f.id === editingId ? buildFilm(f.id, v) : f)));
    }
  }

  function onFilmsClick(e) {
    const cancel = e.target.closest("#slot-cancel, #edit-cancel");
    if (cancel) {
      if (cancel.id === "edit-cancel") {
        editingId = null;
        renderMyFilms();
      } else {
        $("slot-title").value = "";
        $("slot-note").value = "";
      }
      return;
    }
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const action = btn.dataset.action;
    if (action === "focus-slot") {
      const t = $("slot-title");
      if (t) {
        t.scrollIntoView({ behavior: "smooth", block: "center" });
        t.focus();
      }
    } else if (action === "edit") {
      editingId = btn.dataset.id;
      renderMyFilms();
      const t = $("edit-title");
      if (t) t.focus();
    } else if (action === "delete") {
      saveFilms(myFilms.filter((f) => f.id !== btn.dataset.id), "Film rimosso dal caveau.");
    }
  }

  // ------------------------------------------------------------ sidebar

  function renderParticipants() {
    const ev = ctx.ev;
    const list = [...ctx.participants.entries()].map(([uid, p]) => ({ uid, ...p }));
    list.sort((a, b) => {
      const ha = a.uid === ev.createdBy ? 0 : 1;
      const hb = b.uid === ev.createdBy ? 0 : 1;
      if (ha !== hb) return ha - hb;
      const ta = toDate(a.joinedAt);
      const tb = toDate(b.joinedAt);
      return (ta ? ta.getTime() : Infinity) - (tb ? tb.getTime() : Infinity);
    });
    $("participants-count").textContent = `${list.length} confermati`;
    if (!list.length) {
      $("participants-list").innerHTML = `<li class="p-space-md rounded-xl bg-surface-container-low text-on-surface-variant font-body-sm text-body-sm">Nessun partecipante ancora. Sii il primo!</li>`;
      return;
    }
    let other = 0;
    $("participants-list").innerHTML = list
      .map((p) => {
        const isMe = ctx.user && p.uid === ctx.user.uid;
        const isHost = p.uid === ev.createdBy;
        const avatar = escapeHtml(p.avatar || AVATARS[0].emoji);
        const nick = escapeHtml(p.nickname || "");
        const snack = escapeHtml(snackShort(p.snack) || "Solo presenza");
        const films = Number(p.filmCount) || 0;
        const hostBadge = isHost ? `<span class="font-label-sm text-[10px] bg-primary/20 text-primary px-1.5 rounded font-bold uppercase">Host</span>` : "";
        if (isMe) {
          return `<li class="flex items-center justify-between p-space-sm rounded-xl bg-surface-container-high shadow-[0_0_12px_rgba(245,158,11,0.15)] ring-1 ring-primary-container/40"><div class="flex items-center gap-space-sm min-w-0"><div class="relative shrink-0"><div class="w-9 h-9 rounded-full bg-primary-container/20 border-2 border-primary-container flex items-center justify-center text-[18px] shadow-[0_0_10px_rgba(245,158,11,0.3)]">${avatar}</div><span class="absolute -bottom-1 -right-1 w-3 h-3 bg-primary rounded-full ring-2 ring-surface-container-high"></span></div><div class="flex flex-col min-w-0"><div class="flex items-center gap-1.5"><span class="font-label-md text-label-md text-primary font-bold truncate">${nick} (Tu)</span>${hostBadge}<span class="font-label-sm text-[10px] bg-secondary-container/30 text-secondary px-1.5 rounded font-bold">ONLINE</span></div><span class="font-label-sm text-[11px] text-tertiary truncate">${snack}</span></div></div><span class="px-space-xs py-0.5 bg-primary-container text-on-primary-container font-label-sm text-[11px] rounded font-bold shrink-0">${films}/5 film</span></li>`;
        }
        if (isHost) {
          return `<li class="flex items-center justify-between p-space-sm rounded-xl bg-surface-container"><div class="flex items-center gap-space-sm min-w-0"><div class="relative shrink-0"><div class="w-9 h-9 rounded-full bg-primary-container/20 border-2 border-primary flex items-center justify-center text-[18px] shadow-[0_0_10px_rgba(245,158,11,0.3)]">${avatar}</div><span class="absolute -bottom-1 -right-1 w-3 h-3 bg-primary rounded-full ring-2 ring-surface-container"></span></div><div class="flex flex-col min-w-0"><div class="flex items-center gap-1.5"><span class="font-label-md text-label-md text-on-surface font-bold truncate">${nick}</span>${hostBadge}</div><span class="font-label-sm text-[11px] text-tertiary">${snack}</span></div></div><span class="px-space-xs py-0.5 bg-surface-container-high text-on-surface-variant font-label-sm text-[11px] rounded font-semibold shrink-0">${films}/5 film</span></li>`;
        }
        const border = RING_BORDERS[other++ % RING_BORDERS.length];
        return `<li class="flex items-center justify-between p-space-sm rounded-xl bg-surface-container"><div class="flex items-center gap-space-sm min-w-0"><div class="relative shrink-0"><div class="w-9 h-9 rounded-full bg-surface-container-high border-2 ${border} flex items-center justify-center text-[18px]">${avatar}</div></div><div class="flex flex-col min-w-0"><span class="font-label-md text-label-md text-on-surface font-bold truncate">${nick}</span><span class="font-label-sm text-[11px] text-on-surface-variant truncate">${snack}</span></div></div><span class="px-space-xs py-0.5 bg-surface-container-high text-on-surface-variant font-label-sm text-[11px] rounded font-semibold shrink-0">${films}/5 film</span></li>`;
      })
      .join("");
  }

  function renderMysteryCards() {
    const myUid = ctx.user && ctx.user.uid;
    const others = [...ctx.participants.entries()].filter(([uid]) => uid !== myUid);
    const withFilms = others.filter(([, p]) => (Number(p.filmCount) || 0) > 0);
    $("mystery-others").textContent = others.length
      ? `Uno sguardo d'insieme sui titoli misteriosi inseriti dagli altri ${others.length} ${others.length === 1 ? "amico" : "amici"}:`
      : "Nessun altro amico ha ancora inserito titoli misteriosi.";
    $("mystery-grid").innerHTML = withFilms
      .slice(0, 4)
      .map(([, p], i) => {
        const t = MYSTERY_TONES[i % MYSTERY_TONES.length];
        return `<div class="relative h-28 rounded-xl overflow-hidden bg-surface-container-lowest flex items-center justify-center p-space-xs text-center group">
<div class="absolute inset-0 bg-gradient-to-t ${t.grad} via-surface-container-high/60 to-transparent blur-md"></div>
<div class="relative z-10 flex flex-col items-center gap-1">
<span class="material-symbols-outlined ${t.icon} text-[24px]">lock</span>
<span class="font-label-sm text-[11px] text-on-surface font-bold ${t.blur} select-none">Titolo Segreto</span>
<span class="font-label-sm text-[10px] text-on-surface-variant">Proposto da ${escapeHtml(p.nickname || "")} (×${Number(p.filmCount) || 0})</span>
</div>
</div>`;
      })
      .join("");
  }

  function bindShare() {
    $("share-btn").addEventListener("click", () => {
      const url = inviteUrl(ctx.eventId);
      const notice = $("copied-notice");
      const btnText = $("share-text");
      const done = () => {
        notice.classList.remove("hidden");
        btnText.textContent = "Link WhatsApp Copiato!";
        clearTimeout(shareTimer);
        shareTimer = setTimeout(() => {
          notice.classList.add("hidden");
          btnText.textContent = "Copia Link Invito WhatsApp";
        }, 4000);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(done).catch(() => showToast("Link d'invito: " + url, "link"));
      } else {
        showToast("Link d'invito: " + url, "link");
      }
    });
  }

  // ------------------------------------------------------------ wiring

  buildSnacks();
  renderHero();
  renderTimeLock();
  $("rsvp-form").addEventListener("submit", submitJoin);
  $("avatar-selector").addEventListener("click", onAvatarClick);
  $("special-avatars").addEventListener("click", onAvatarClick);
  $("my-films").addEventListener("click", onFilmsClick);
  $("my-films").addEventListener("submit", onAreaSubmit);
  $("slot-area").addEventListener("click", onFilmsClick);
  $("slot-area").addEventListener("submit", onAreaSubmit);
  bindShare();
  renderJoin();
  renderCaveauStats();
  renderParticipants();
  renderMysteryCards();
  renderMyFilms();
  loadMyFilms();

  function onAvatarClick(e) {
    const btn = e.target.closest("[data-avatar]");
    if (!btn) return;
    selectedAvatar = btn.dataset.avatar;
    renderAvatars();
  }

  return {
    onParticipants() {
      renderJoin();
      renderCaveauStats();
      renderParticipants();
      renderMysteryCards();
    },
    onEvent() {
      renderHero();
      renderTimeLock();
    },
    destroy() {
      if (stopCountdown) stopCountdown();
      stopCountdown = null;
      clearTimeout(shareTimer);
    }
  };
}

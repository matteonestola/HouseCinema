import { db, ensureAnonymousUser, formatDateTime, escapeHtml, qs } from "./app.js";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const MAX_FILMS = 5;
const eventId = qs("id");

const els = {
  title: document.getElementById("event-title"),
  when: document.getElementById("event-when"),
  description: document.getElementById("event-description"),
  joinForm: document.getElementById("join-form"),
  joinedNotice: document.getElementById("joined-notice"),
  nickname: document.getElementById("nickname"),
  joinBtn: document.getElementById("join-btn"),
  joinError: document.getElementById("join-error"),
  proposalsSection: document.getElementById("proposals-section"),
  filmInputs: document.getElementById("film-inputs"),
  saveFilmsBtn: document.getElementById("save-films-btn"),
  filmsStatus: document.getElementById("films-status"),
  participantsList: document.getElementById("participants-list"),
  revealArea: document.getElementById("reveal-area"),
};

if (!eventId) {
  els.title.textContent = "Evento non trovato";
  throw new Error("Nessun id evento nell'URL");
}

let startAt = null;

function renderFilmInputs(existing = []) {
  els.filmInputs.innerHTML = "";
  for (let i = 0; i < MAX_FILMS; i++) {
    const row = document.createElement("div");
    row.className = "film-row";
    row.innerHTML = `
      <span class="num">${i + 1}.</span>
      <input type="text" maxlength="120" data-idx="${i}" placeholder="Titolo del film" value="${escapeHtml(existing[i] || "")}" />
    `;
    els.filmInputs.appendChild(row);
  }
}

function collectFilms() {
  return Array.from(els.filmInputs.querySelectorAll("input"))
    .map((i) => i.value.trim())
    .filter((v) => v.length > 0)
    .slice(0, MAX_FILMS);
}

async function loadEvent() {
  const snap = await getDoc(doc(db, "events", eventId));
  if (!snap.exists()) {
    els.title.textContent = "Evento non trovato";
    els.description.textContent = "Il link potrebbe essere sbagliato o l'evento è stato rimosso.";
    return;
  }
  const ev = snap.data();
  startAt = ev.startAt?.toDate ? ev.startAt.toDate() : new Date(ev.startAt);
  els.title.textContent = ev.title;
  els.when.textContent = formatDateTime(startAt);
  els.description.textContent = ev.description || "";
  document.title = `${ev.title} — Matteo's Cinema`;
  scheduleReveal();
}

function watchParticipants() {
  const ref = collection(db, "events", eventId, "participants");
  onSnapshot(ref, (snap) => {
    if (snap.empty) {
      els.participantsList.innerHTML = "<li>Nessun partecipante ancora. Sii il primo!</li>";
      return;
    }
    const items = [];
    snap.forEach((d) => items.push(`<li>${escapeHtml(d.data().nickname)}</li>`));
    els.participantsList.innerHTML = items.join("");
  }, (err) => {
    els.participantsList.innerHTML = `<li class="error">${escapeHtml(err.message)}</li>`;
  });
}

async function loadProposals() {
  els.revealArea.innerHTML = "<p>Carico i film proposti…</p>";
  try {
    const snap = await getDocs(collection(db, "events", eventId, "proposals"));
    const groups = [];
    snap.forEach((d) => {
      const data = d.data();
      if (data.films && data.films.length) {
        groups.push(`<li><strong>${escapeHtml(data.nickname)}</strong>: ${data.films.map(escapeHtml).join(", ")}</li>`);
      }
    });
    els.revealArea.innerHTML = groups.length
      ? `<ul class="plain">${groups.join("")}</ul>`
      : `<div class="empty">Nessun film è stato proposto.</div>`;
  } catch (err) {
    els.revealArea.innerHTML = `<div class="error">Non riesco a mostrare i film: ${escapeHtml(err.message)}</div>`;
  }
}

function scheduleReveal() {
  if (!startAt) return;
  const diff = startAt.getTime() - Date.now();
  if (diff <= 0) {
    loadProposals();
  } else {
    els.revealArea.innerHTML = `<div class="notice">I film proposti si sveleranno il ${formatDateTime(startAt)}, all'inizio dell'evento.</div>`;
    setTimeout(loadProposals, diff + 1000);
  }
}

async function initParticipation() {
  const user = await ensureAnonymousUser();
  const participantRef = doc(db, "events", eventId, "participants", user.uid);
  const proposalsRef = doc(db, "events", eventId, "proposals", user.uid);

  const existing = await getDoc(participantRef);

  if (existing.exists()) {
    showJoined(existing.data().nickname);
    const propSnap = await getDoc(proposalsRef);
    renderFilmInputs(propSnap.exists() ? propSnap.data().films || [] : []);
  } else {
    renderFilmInputs([]);
  }

  els.joinBtn.addEventListener("click", async () => {
    const nickname = els.nickname.value.trim();
    els.joinError.innerHTML = "";
    if (!nickname) {
      els.joinError.innerHTML = `<div class="error">Inserisci un nome o nickname.</div>`;
      return;
    }
    els.joinBtn.disabled = true;
    try {
      await setDoc(participantRef, { nickname, joinedAt: serverTimestamp() });
      await setDoc(proposalsRef, { nickname, films: [], updatedAt: serverTimestamp() }, { merge: true });
      showJoined(nickname);
    } catch (err) {
      els.joinError.innerHTML = `<div class="error">${escapeHtml(err.message)}</div>`;
    } finally {
      els.joinBtn.disabled = false;
    }
  });

  els.saveFilmsBtn.addEventListener("click", async () => {
    const films = collectFilms();
    els.saveFilmsBtn.disabled = true;
    els.filmsStatus.innerHTML = "";
    try {
      await setDoc(proposalsRef, { nickname: els.nickname.dataset.current || undefined, films, updatedAt: serverTimestamp() }, { merge: true });
      els.filmsStatus.innerHTML = `<div class="notice">Film salvati.</div>`;
    } catch (err) {
      els.filmsStatus.innerHTML = `<div class="error">${escapeHtml(err.message)}</div>`;
    } finally {
      els.saveFilmsBtn.disabled = false;
    }
  });
}

function showJoined(nickname) {
  els.joinForm.style.display = "none";
  els.joinedNotice.style.display = "block";
  els.joinedNotice.textContent = `Partecipi come "${nickname}".`;
  els.nickname.dataset.current = nickname;
  els.proposalsSection.style.display = "block";
}

loadEvent();
watchParticipants();
initParticipation();

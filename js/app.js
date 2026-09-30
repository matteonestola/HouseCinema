import { firebaseConfig } from "./firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { ADMIN_UID, DEFAULT_COVER, GENRES, SNACKS } from "./site-config.js";

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Ogni visitatore (partecipante) riceve automaticamente un'identita' anonima
// stabile, senza dover inserire una password. Serve solo per far rispettare
// le regole "puoi modificare solo i tuoi film" e "massimo 5 film a testa".
export function ensureAnonymousUser() {
  return new Promise((resolve, reject) => {
    const unsub = onAuthStateChanged(auth, (user) => {
      unsub();
      if (user) {
        resolve(user);
      } else {
        signInAnonymously(auth).then((cred) => resolve(cred.user)).catch(reject);
      }
    });
  });
}

// Utente corrente (null se nessuno) senza creare un login anonimo.
export function waitForUser() {
  return new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, (user) => {
      unsub();
      resolve(user || null);
    });
  });
}

export function isAdminUser(user) {
  return !!user && !user.isAnonymous && user.uid === ADMIN_UID;
}

export function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

export function qs(name) {
  return new URLSearchParams(window.location.search).get(name);
}

// ---------------------------------------------------------------- date

export function toDate(ts) {
  if (!ts) return null;
  if (ts instanceof Date) return ts;
  if (typeof ts.toDate === "function") return ts.toDate();
  const d = new Date(ts);
  return isNaN(d.getTime()) ? null : d;
}

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
function parts(date, opts) {
  const out = {};
  for (const p of new Intl.DateTimeFormat("it-IT", opts).formatToParts(date)) out[p.type] = p.value;
  return out;
}

export function formatTime(d) {
  return new Intl.DateTimeFormat("it-IT", { hour: "2-digit", minute: "2-digit", hour12: false }).format(d);
}

// "Sab 18 Mag • 21:00"
export function formatMetaDate(d) {
  const p = parts(d, { weekday: "short", day: "numeric", month: "short" });
  return `${cap(p.weekday)} ${p.day} ${cap(p.month)} • ${formatTime(d)}`;
}

// "25 Maggio, 20:30"
export function formatCardDate(d) {
  const p = parts(d, { day: "numeric", month: "long" });
  return `${p.day} ${cap(p.month)}, ${formatTime(d)}`;
}

// "Sabato 18 Maggio, ore 21:00"
export function formatLongDate(d) {
  const p = parts(d, { weekday: "long", day: "numeric", month: "long" });
  return `${cap(p.weekday)} ${p.day} ${cap(p.month)}, ore ${formatTime(d)}`;
}

// "14 nov 2025"
export function formatShortDate(d) {
  return new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "short", year: "numeric" }).format(d);
}

export function formatDateTime(date) {
  return new Intl.DateTimeFormat("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

// "2h 15m" oppure "3g 4h"
export function timeUntilLabel(d, now = new Date()) {
  const diff = Math.max(0, d.getTime() - now.getTime());
  const totalMin = Math.floor(diff / 60000);
  const days = Math.floor(totalMin / 1440);
  const hours = Math.floor((totalMin % 1440) / 60);
  const mins = totalMin % 60;
  if (days > 0) return `${days}g ${hours}h`;
  return `${hours}h ${mins}m`;
}

// Aggiorna ogni secondo gli elementi ore/minuti/secondi (ore = totale, minimo 2 cifre).
export function startCountdown(target, { h, m, s }, onDone) {
  let done = false;
  let timer = null;
  const tick = () => {
    const diff = Math.max(0, Math.floor((target.getTime() - Date.now()) / 1000));
    const hh = Math.floor(diff / 3600);
    const mm = Math.floor((diff % 3600) / 60);
    const ss = diff % 60;
    if (h) h.textContent = String(hh).padStart(2, "0");
    if (m) m.textContent = String(mm).padStart(2, "0");
    if (s) s.textContent = String(ss).padStart(2, "0");
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

// ---------------------------------------------------------------- UI

let toastTimer = null;
export function showToast(message, icon = "check_circle") {
  const toast = document.getElementById("toast");
  if (!toast) return;
  const msg = document.getElementById("toast-message");
  const ico = document.getElementById("toast-icon");
  if (msg) msg.textContent = message;
  if (ico) ico.textContent = icon;
  toast.classList.remove("translate-y-24", "opacity-0");
  toast.classList.add("translate-y-0", "opacity-100");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("translate-y-0", "opacity-100");
    toast.classList.add("translate-y-24", "opacity-0");
  }, 2800);
}

// ---------------------------------------------------------------- dati

export function genFilmId() {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  const buf = new Uint8Array(8);
  crypto.getRandomValues(buf);
  return Array.from(buf, (b) => chars[b % chars.length]).join("");
}

// Accetta sia il formato nuovo ({id,title,note}) sia il legacy (string[]).
export function normalizeFilms(films) {
  if (!Array.isArray(films)) return [];
  return films
    .map((f, i) => {
      if (typeof f === "string") return { id: "legacy-" + i, title: f };
      if (f && typeof f === "object") {
        const out = { id: String(f.id || "legacy-" + i), title: String(f.title || "") };
        if (f.note) out.note = String(f.note);
        return out;
      }
      return null;
    })
    .filter((f) => f && f.title);
}

export function eventPhase(ev, now = new Date()) {
  const start = toDate(ev.startAt);
  if (ev.screening) return "completed";
  if (!start) return "upcoming";
  if (now.getTime() > start.getTime() + 12 * 3600 * 1000) return "completed";
  if (now.getTime() >= start.getTime()) return "live";
  return "upcoming";
}

export function genreEmoji(id) {
  const g = GENRES.find((x) => x.id === id);
  return g ? g.emoji : "🍿";
}

export function snackShort(id) {
  const s = SNACKS.find((x) => x.id === id);
  return s ? s.short : "";
}

export function coverOf(ev) {
  return (ev && ev.coverUrl) || DEFAULT_COVER;
}

export function inviteUrl(eventId) {
  return new URL("event.html?id=" + encodeURIComponent(eventId), window.location.href).href;
}

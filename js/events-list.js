import { db, formatDateTime, escapeHtml } from "./app.js";
import {
  collection,
  query,
  orderBy,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const listEl = document.getElementById("events-list");

const q = query(collection(db, "events"), orderBy("startAt", "desc"));

onSnapshot(q, (snap) => {
  if (snap.empty) {
    listEl.innerHTML = `<div class="empty">Nessun evento in programma per ora.</div>`;
    return;
  }

  const now = new Date();
  const cards = [];

  snap.forEach((docSnap) => {
    const ev = docSnap.data();
    const startAt = ev.startAt?.toDate ? ev.startAt.toDate() : new Date(ev.startAt);
    const isPast = startAt < now;

    cards.push(`
      <a class="ticket" style="display:block; text-decoration:none; ${isPast ? "opacity:0.55;" : ""}" href="event.html?id=${encodeURIComponent(docSnap.id)}">
        <div class="when">${formatDateTime(startAt)}${isPast ? " — concluso" : ""}</div>
        <h3>${escapeHtml(ev.title)}</h3>
        ${ev.description ? `<p>${escapeHtml(ev.description)}</p>` : ""}
      </a>
    `);
  });

  listEl.innerHTML = cards.join("");
}, (err) => {
  listEl.innerHTML = `<div class="error">Non riesco a caricare gli eventi: ${escapeHtml(err.message)}</div>`;
});

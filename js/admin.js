import { db, auth, formatDateTime, escapeHtml } from "./app.js";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  onSnapshot,
  Timestamp,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const els = {
  loginSection: document.getElementById("login-section"),
  adminPanel: document.getElementById("admin-panel"),
  email: document.getElementById("email"),
  password: document.getElementById("password"),
  loginBtn: document.getElementById("login-btn"),
  loginError: document.getElementById("login-error"),
  who: document.getElementById("who"),
  logoutBtn: document.getElementById("logout-btn"),
  title: document.getElementById("title"),
  description: document.getElementById("description"),
  startAt: document.getElementById("startAt"),
  createBtn: document.getElementById("create-btn"),
  createStatus: document.getElementById("create-status"),
  eventsList: document.getElementById("admin-events-list"),
};

els.loginBtn.addEventListener("click", async () => {
  els.loginError.innerHTML = "";
  els.loginBtn.disabled = true;
  try {
    await signInWithEmailAndPassword(auth, els.email.value.trim(), els.password.value);
  } catch (err) {
    els.loginError.innerHTML = `<div class="error">Accesso non riuscito: ${escapeHtml(err.message)}</div>`;
  } finally {
    els.loginBtn.disabled = false;
  }
});

els.logoutBtn.addEventListener("click", () => signOut(auth));

els.createBtn.addEventListener("click", async () => {
  const title = els.title.value.trim();
  const startAtVal = els.startAt.value;
  els.createStatus.innerHTML = "";

  if (!title || !startAtVal) {
    els.createStatus.innerHTML = `<div class="error">Titolo e data/ora sono obbligatori.</div>`;
    return;
  }

  els.createBtn.disabled = true;
  try {
    await addDoc(collection(db, "events"), {
      title,
      description: els.description.value.trim(),
      startAt: Timestamp.fromDate(new Date(startAtVal)),
      createdAt: serverTimestamp(),
      createdBy: auth.currentUser.uid,
    });
    els.title.value = "";
    els.description.value = "";
    els.startAt.value = "";
    els.createStatus.innerHTML = `<div class="notice">Evento creato.</div>`;
  } catch (err) {
    els.createStatus.innerHTML = `<div class="error">${escapeHtml(err.message)}</div>`;
  } finally {
    els.createBtn.disabled = false;
  }
});

function watchEvents() {
  const q = query(collection(db, "events"), orderBy("startAt", "desc"));
  onSnapshot(q, (snap) => {
    if (snap.empty) {
      els.eventsList.innerHTML = "<li>Nessun evento creato ancora.</li>";
      return;
    }
    const items = [];
    snap.forEach((d) => {
      const ev = d.data();
      const startAt = ev.startAt?.toDate ? ev.startAt.toDate() : new Date(ev.startAt);
      items.push(`
        <li>
          <strong>${escapeHtml(ev.title)}</strong> — ${formatDateTime(startAt)}
          <button class="danger" data-id="${d.id}" style="margin:0.3rem 0 0 0.5rem; padding:0.25rem 0.6rem;">Elimina</button>
        </li>
      `);
    });
    els.eventsList.innerHTML = items.join("");
    els.eventsList.querySelectorAll("button[data-id]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (!confirm("Eliminare questo evento? Partecipanti e film proposti resteranno nel database ma non saranno più raggiungibili da qui.")) return;
        await deleteDoc(doc(db, "events", btn.dataset.id));
      });
    });
  });
}

onAuthStateChanged(auth, (user) => {
  if (user && !user.isAnonymous) {
    els.loginSection.style.display = "none";
    els.adminPanel.style.display = "block";
    els.who.textContent = user.email;
    watchEvents();
  } else {
    els.loginSection.style.display = "block";
    els.adminPanel.style.display = "none";
  }
});

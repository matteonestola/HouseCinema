import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  writeBatch,
  serverTimestamp,
  Timestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  db,
  auth,
  isAdminUser,
  toDate,
  escapeHtml,
  formatMetaDate,
  formatShortDate,
  startCountdown,
  showToast,
  genreEmoji,
  inviteUrl
} from "./app.js";
import { initLayout } from "./layout.js";
import { HOST_NAME, DEFAULT_COVER, TITLE_MAX, REVEAL_POSTPONE_MIN } from "./site-config.js";

const $ = (id) => document.getElementById(id);

let panelReady = false;
let mode = "create";
let editingId = null;
let events = []; // { id, ...data } startAt desc
let genre = "Horror";
let stopPreviewCountdown = null;
let previewCountdownFor = 0;
let unsubParticipants = null;
let partStats = { participants: 0, films: 0 };

initLayout({ active: "organizza" });

// ---------------------------------------------------------------- auth

function showLoginError(text) {
  $("login-error-text").textContent = text;
  $("login-error").classList.remove("hidden");
}

function clearLoginError() {
  $("login-error").classList.add("hidden");
}

onAuthStateChanged(auth, (user) => {
  if (isAdminUser(user)) {
    $("login-section").hidden = true;
    $("admin-panel").hidden = false;
    clearLoginError();
    if (!panelReady) {
      panelReady = true;
      initPanel();
    }
  } else if (user && !user.isAnonymous) {
    // Utente email ma non admin
    signOut(auth).then(() => showLoginError("Account non autorizzato"));
  } else {
    $("login-section").hidden = false;
    $("admin-panel").hidden = true;
  }
});

$("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  clearLoginError();
  $("login-btn").disabled = true;
  try {
    await signInWithEmailAndPassword(auth, $("email").value.trim(), $("password").value);
  } catch (err) {
    showLoginError("Accesso non riuscito: " + (err.code || err.message));
  } finally {
    $("login-btn").disabled = false;
  }
});

$("logout-btn").addEventListener("click", () => signOut(auth));

// ---------------------------------------------------------------- pannello

async function backfillLegacyEvents() {
  try {
    const snap = await getDocs(collection(db, "events"));
    const jobs = [];
    snap.forEach((d) => {
      const data = d.data();
      if (data.status === undefined) {
        jobs.push(
          updateDoc(d.ref, {
            status: "published",
            genre: data.genre ?? "Horror",
            location: "",
            coverUrl: "",
            hostName: HOST_NAME
          })
        );
      }
    });
    await Promise.all(jobs);
    if (jobs.length) showToast(`${jobs.length} serate precedenti aggiornate`, "sync");
  } catch (err) {
    console.warn("backfill", err);
  }
}

function initPanel() {
  backfillLegacyEvents();
  watchEvents();
  bindForm();
  setMode("create");
}

function watchEvents() {
  const q = query(collection(db, "events"), orderBy("startAt", "desc"));
  onSnapshot(
    q,
    (snap) => {
      events = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      renderSelect();
      if (mode === "manage" && editingId && !events.find((e) => e.id === editingId)) {
        setMode("create");
      }
    },
    (err) => {
      console.error(err);
      showToast("Impossibile leggere le serate", "error");
    }
  );
}

function renderSelect() {
  const sel = $("manage-event-select");
  const current = editingId || sel.value;
  sel.innerHTML = events
    .map((ev) => {
      const start = toDate(ev.startAt);
      const label = `${ev.title} — ${start ? formatMetaDate(start) : "data n/d"}${ev.status === "draft" ? " [bozza]" : ""}`;
      return `<option value="${escapeHtml(ev.id)}">${escapeHtml(label)}</option>`;
    })
    .join("");
  if (current && events.find((e) => e.id === current)) sel.value = current;
}

// ---------------------------------------------------------------- form

function pad(n) {
  return String(n).padStart(2, "0");
}
function localDate(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function localTime(d) {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function setGenre(id) {
  genre = id;
  document.querySelectorAll("#category-chips .chip-item").forEach((b) => {
    const on = b.dataset.cat === id;
    b.classList.toggle("active", on);
    b.classList.toggle("bg-secondary-container", on);
    b.classList.toggle("text-on-secondary", on);
    b.classList.toggle("bg-surface-container-high", !on);
    b.classList.toggle("text-on-surface-variant", !on);
  });
}

function resetForm() {
  $("event-title").value = "";
  $("event-date").value = "";
  $("event-time").value = "";
  $("event-location").value = "";
  $("event-desc").value = "";
  $("event-cover-url").value = "";
  setGenre("Horror");
  updatePreview();
}

function fillForm(ev) {
  const start = toDate(ev.startAt);
  $("event-title").value = ev.title || "";
  $("event-date").value = start ? localDate(start) : "";
  $("event-time").value = start ? localTime(start) : "";
  $("event-location").value = ev.location || "";
  $("event-desc").value = ev.description || "";
  $("event-cover-url").value = ev.coverUrl || "";
  setGenre(ev.genre || "Horror");
  updatePreview();
}

function readForm() {
  const date = $("event-date").value;
  const time = $("event-time").value;
  return {
    title: $("event-title").value.trim(),
    genre,
    coverUrl: $("event-cover-url").value.trim(),
    startAt: date && time ? new Date(`${date}T${time}`) : null,
    location: $("event-location").value.trim(),
    description: $("event-desc").value.trim()
  };
}

function validateForm(v) {
  if (!v.title || v.title.length > TITLE_MAX) return `Il titolo è obbligatorio (max ${TITLE_MAX} caratteri)`;
  if (!v.startAt || isNaN(v.startAt.getTime())) return "Imposta data e ora di inizio";
  if (v.coverUrl && (!/^https?:\/\//i.test(v.coverUrl) || v.coverUrl.length > 500)) {
    return "L'indirizzo dell'immagine deve iniziare con http:// o https://";
  }
  if (v.location.length > 200) return "Il luogo è troppo lungo (max 200 caratteri)";
  if (v.description.length > 1000) return "La descrizione è troppo lunga (max 1000 caratteri)";
  return null;
}

async function saveEvent(status) {
  const v = readForm();
  const err = validateForm(v);
  if (err) {
    showToast(err, "error");
    return;
  }
  const data = {
    title: v.title,
    genre: v.genre,
    coverUrl: v.coverUrl,
    startAt: Timestamp.fromDate(v.startAt),
    location: v.location,
    description: v.description
  };
  $("btn-publish").disabled = true;
  $("btn-draft").disabled = true;
  try {
    if (mode === "create" || !editingId) {
      const ref = await addDoc(collection(db, "events"), {
        ...data,
        status,
        hostName: HOST_NAME,
        createdAt: serverTimestamp(),
        createdBy: auth.currentUser.uid
      });
      showToast(status === "published" ? "🎉 Serata Cinema pubblicata e inviti pronti!" : "Bozza salvata.", status === "published" ? "celebration" : "save");
      editingId = ref.id;
      setMode("manage");
      selectEvent(ref.id, { id: ref.id, ...data, status, hostName: HOST_NAME });
    } else {
      await updateDoc(doc(db, "events", editingId), { ...data, status });
      showToast(status === "published" ? "Modifiche salvate. Serata pubblicata." : "Serata spostata in bozza.", status === "published" ? "celebration" : "save");
      selectEvent(editingId, { id: editingId, ...data, status });
    }
  } catch (e) {
    console.error(e);
    showToast(e.code === "permission-denied" ? "Permesso negato: sei loggato come admin?" : "Salvataggio non riuscito", "error");
  } finally {
    $("btn-publish").disabled = false;
    $("btn-draft").disabled = false;
  }
}

// ---------------------------------------------------------------- modalita'

function setLabels(ev) {
  const pub = $("btn-publish").querySelector("span:last-child");
  const dr = $("btn-draft").querySelector("span:last-child");
  if (mode === "create" || !ev) {
    pub.textContent = "Pubblica Serata Cinema";
    dr.textContent = "Salva Bozza";
  } else if (ev.status === "draft") {
    pub.textContent = "Pubblica Serata Cinema";
    dr.textContent = "Salva Bozza";
  } else {
    pub.textContent = "Salva Modifiche";
    dr.textContent = "Sposta in Bozza";
  }
}

function setMode(next) {
  mode = next;
  const tc = $("tab-create");
  const tm = $("tab-manage");
  const on = ["bg-primary-container", "text-on-primary-container", "font-bold"];
  if (next === "create") {
    tc.classList.add(...on);
    tc.classList.remove("text-on-surface-variant");
    tm.classList.remove(...on);
    tm.classList.add("text-on-surface-variant");
    editingId = null;
    detachParticipants();
    resetForm();
    $("management-section").hidden = true;
    setLabels(null);
    $("event-title").focus({ preventScroll: true });
  } else {
    if (!editingId && !events.length) {
      showToast("Nessuna serata da gestire", "event_busy");
      setMode("create");
      return;
    }
    tm.classList.add(...on);
    tm.classList.remove("text-on-surface-variant");
    tc.classList.remove(...on);
    tc.classList.add("text-on-surface-variant");
    $("management-section").hidden = false;
    if (!editingId) selectEvent(events[0].id);
    $("management-section").scrollIntoView({ behavior: "smooth" });
  }
}

function detachParticipants() {
  if (unsubParticipants) unsubParticipants();
  unsubParticipants = null;
  partStats = { participants: 0, films: 0 };
}

function selectEvent(id, override) {
  const ev = events.find((e) => e.id === id) || override;
  if (!ev) return;
  editingId = id;
  $("manage-event-select").value = id;
  fillForm(ev);
  setLabels(ev);
  const url = inviteUrl(id);
  $("invite-link-input").value = url;
  $("invite-wa").href = "https://wa.me/?text=" + encodeURIComponent(`Sei invitato alla prossima CineSerata! Aggiungi i tuoi film segreti prima del reveal: ${url}`);
  $("invite-tg").href = "https://t.me/share/url?url=" + encodeURIComponent(url) + "&text=" + encodeURIComponent("Ecco il link per la CineSerata!");
  $("modal-event-name").textContent = ev.title || "Questa Serata";

  detachParticipants();
  unsubParticipants = onSnapshot(
    collection(db, "events", id, "participants"),
    (snap) => {
      let films = 0;
      snap.forEach((d) => (films += Number(d.data().filmCount) || 0));
      partStats = { participants: snap.size, films };
      $("preview-participants").textContent = String(snap.size);
      $("preview-films").textContent = String(films);
      $("modal-film-count").textContent = String(films);
    },
    () => {}
  );
}

// ---------------------------------------------------------------- anteprima

function coverDomain(url) {
  try {
    return new URL(url).host;
  } catch (e) {
    return url;
  }
}

function setCover(url) {
  const src = url || DEFAULT_COVER;
  for (const id of ["preview-cover-img", "cover-thumb-img"]) {
    const img = $(id);
    img.onerror = () => {
      img.onerror = null;
      img.src = DEFAULT_COVER;
    };
    if (img.getAttribute("src") !== src) img.src = src;
  }
  $("cover-thumb-name").textContent = url ? coverDomain(url) : "Copertina predefinita CineSerata";
  $("preview-custom-bg").hidden = !url;
}

function updatePreview() {
  const title = $("event-title").value;
  $("title-char-count").textContent = `${title.length}/${TITLE_MAX}`;
  $("preview-title").textContent = title.trim() || "Titolo Serata Cinema";
  if (mode === "create") $("modal-event-name").textContent = title.trim() || "Questa Serata";
  const date = $("event-date").value;
  const time = $("event-time").value;
  $("preview-date-text").textContent = date ? formatShortDate(new Date(date + "T00:00")) : "Data da definire";
  $("preview-time-text").textContent = time ? `Reveal alle ${time}` : "Reveal da definire";
  $("preview-location-text").textContent = $("event-location").value.trim() || "Salotto da definire";
  $("preview-badge").firstElementChild.textContent = genreEmoji(genre);
  $("preview-badge-text").textContent = genre;
  $("preview-host").textContent = HOST_NAME;
  setCover($("event-cover-url").value.trim());

  const target = date && time ? new Date(`${date}T${time}`) : null;
  const ids = { h: $("preview-countdown-hours"), m: $("preview-countdown-minutes"), s: $("preview-countdown-seconds") };
  if (target && !isNaN(target.getTime()) && target.getTime() > Date.now()) {
    if (previewCountdownFor !== target.getTime()) {
      if (stopPreviewCountdown) stopPreviewCountdown();
      previewCountdownFor = target.getTime();
      stopPreviewCountdown = startCountdown(target, ids);
    }
  } else {
    if (stopPreviewCountdown) stopPreviewCountdown();
    stopPreviewCountdown = null;
    previewCountdownFor = 0;
    ids.h.textContent = ids.m.textContent = ids.s.textContent = "00";
  }
}

// ---------------------------------------------------------------- azioni

async function postponeReveal() {
  if (mode !== "manage" || !editingId) {
    showToast("Seleziona una serata da gestire", "info");
    return;
  }
  const ev = events.find((e) => e.id === editingId);
  const start = ev && toDate(ev.startAt);
  if (!start) return;
  const next = new Date(start.getTime() + REVEAL_POSTPONE_MIN * 60000);
  try {
    await updateDoc(doc(db, "events", editingId), { startAt: Timestamp.fromDate(next) });
    $("event-date").value = localDate(next);
    $("event-time").value = localTime(next);
    updatePreview();
    showToast(`Nuovo orario Reveal: ${localTime(next)}`, "schedule");
  } catch (e) {
    console.error(e);
    showToast("Impossibile spostare l'orario", "error");
  }
}

function copyInvite() {
  const input = $("invite-link-input");
  if (!input.value) return;
  navigator.clipboard
    .writeText(input.value)
    .then(() => showToast("Link invito copiato negli appunti!"))
    .catch(() => {
      input.select();
      document.execCommand("copy");
      showToast("Link copiato!");
    });
}

function openQr() {
  if (!editingId) return;
  const url = inviteUrl(editingId);
  $("qr-img").src = "https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=" + encodeURIComponent(url);
  $("qr-modal").classList.remove("hidden");
}
function closeQr() {
  $("qr-modal").classList.add("hidden");
}

function openDelete() {
  if (!editingId) return;
  const modal = $("delete-modal");
  const box = $("delete-modal-box");
  modal.classList.remove("hidden");
  setTimeout(() => {
    box.classList.remove("scale-95");
    box.classList.add("scale-100");
  }, 10);
}
function closeDelete() {
  const modal = $("delete-modal");
  const box = $("delete-modal-box");
  box.classList.remove("scale-100");
  box.classList.add("scale-95");
  setTimeout(() => modal.classList.add("hidden"), 150);
}

async function deleteEventCascade(id) {
  const parts = await getDocs(collection(db, "events", id, "participants"));
  const refs = [];
  parts.forEach((p) => {
    refs.push(p.ref);
    refs.push(doc(db, "events", id, "proposals", p.id));
    refs.push(doc(db, "events", id, "votes", p.id));
  });
  for (let i = 0; i < refs.length; i += 450) {
    const batch = writeBatch(db);
    refs.slice(i, i + 450).forEach((r) => batch.delete(r));
    await batch.commit();
  }
  await deleteDoc(doc(db, "events", id));
}

async function confirmDelete() {
  const id = editingId;
  if (!id) return;
  $("btn-confirm-delete").disabled = true;
  try {
    await deleteEventCascade(id);
    closeDelete();
    showToast("Serata eliminata con successo", "delete");
    setMode("create");
  } catch (e) {
    console.error(e);
    showToast("Eliminazione non riuscita", "error");
  } finally {
    $("btn-confirm-delete").disabled = false;
  }
}

// ---------------------------------------------------------------- binding

function bindForm() {
  ["event-title", "event-location", "event-desc", "event-cover-url"].forEach((id) => $(id).addEventListener("input", updatePreview));
  ["event-date", "event-time"].forEach((id) => {
    $(id).addEventListener("input", updatePreview);
    $(id).addEventListener("change", updatePreview);
  });
  $("category-chips").addEventListener("click", (e) => {
    const b = e.target.closest(".chip-item");
    if (!b) return;
    setGenre(b.dataset.cat);
    updatePreview();
  });
  $("cinema-event-form").addEventListener("submit", (e) => e.preventDefault());
  $("btn-publish").addEventListener("click", () => saveEvent("published"));
  $("btn-draft").addEventListener("click", () => saveEvent("draft"));
  $("tab-create").addEventListener("click", () => setMode("create"));
  $("tab-manage").addEventListener("click", () => setMode("manage"));
  $("manage-event-select").addEventListener("change", (e) => selectEvent(e.target.value));
  $("btn-copy-link").addEventListener("click", copyInvite);
  $("btn-edit-reveal").addEventListener("click", postponeReveal);
  $("btn-fast-qr").addEventListener("click", openQr);
  $("qr-close").addEventListener("click", closeQr);
  $("qr-close-btn").addEventListener("click", closeQr);
  $("qr-modal").addEventListener("click", (e) => {
    if (e.target === $("qr-modal")) closeQr();
  });
  $("btn-delete-event").addEventListener("click", openDelete);
  $("btn-cancel-delete").addEventListener("click", closeDelete);
  $("delete-modal").addEventListener("click", (e) => {
    if (e.target === $("delete-modal")) closeDelete();
  });
  $("btn-confirm-delete").addEventListener("click", confirmDelete);
}

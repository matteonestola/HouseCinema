import { collection, query, where, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { db, auth, isAdminUser, toDate, eventPhase, timeUntilLabel } from "./app.js";
import { HOST_NAME } from "./site-config.js";

const DEACTIVATE = ["text-on-surface-variant", "hover:text-on-surface", "font-label-lg", "text-label-lg"];

export function setActiveNav(active) {
  document.querySelectorAll("nav[data-active-classes]").forEach((nav) => {
    const isMobile = nav.id === "mobile-nav";
    const add = (nav.dataset.activeClasses || "").split(/\s+/).filter(Boolean);
    nav.querySelectorAll("a[data-nav]").forEach((a) => {
      const key = a.dataset.nav;
      const on = key === active || (active === "serata" && key === "serate" && !isMobile);
      if (on) {
        DEACTIVATE.forEach((c) => a.classList.remove(c));
        a.classList.add(...add);
        a.setAttribute("aria-current", "page");
      }
    });
  });
}

function initUserChip() {
  const chip = document.getElementById("user-chip");
  if (!chip) return;
  onAuthStateChanged(auth, (user) => {
    if (isAdminUser(user)) {
      const name = document.getElementById("user-chip-name");
      const role = document.getElementById("user-chip-role");
      if (name) name.textContent = HOST_NAME;
      if (role) role.textContent = "Host";
      chip.hidden = false;
    } else {
      chip.hidden = true;
    }
  });
}

function initTopTicker() {
  const ticker = document.getElementById("top-ticker");
  const title = document.getElementById("ticker-title");
  const eta = document.getElementById("ticker-eta");
  const link = document.getElementById("ticker-link");
  const navSerata = document.getElementById("mobile-nav-serata");
  const navVota = document.getElementById("mobile-nav-vota");
  let next = null;
  let timer = null;

  function paint() {
    if (!next) {
      if (ticker) ticker.hidden = true;
      if (navSerata) navSerata.href = "index.html";
      if (navVota) navVota.href = "index.html";
      return;
    }
    const href = "event.html?id=" + encodeURIComponent(next.id);
    if (ticker) ticker.hidden = false;
    if (title) title.textContent = next.title;
    const phase = eventPhase(next);
    if (eta) eta.textContent = phase === "live" ? "In corso ora" : "Inizio tra " + timeUntilLabel(toDate(next.startAt));
    if (link) link.href = href;
    if (navSerata) navSerata.href = href;
    if (navVota) navVota.href = href + "#vota";
  }

  const q = query(collection(db, "events"), where("status", "==", "published"));
  onSnapshot(q, (snap) => {
    const now = new Date();
    const list = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((e) => toDate(e.startAt) && eventPhase(e, now) !== "completed")
      .sort((a, b) => toDate(a.startAt) - toDate(b.startAt));
    next = list[0] || null;
    paint();
    clearInterval(timer);
    timer = setInterval(paint, 30000);
  }, () => {
    next = null;
    paint();
  });
}

export function initLayout({ active } = {}) {
  const year = document.getElementById("footer-year");
  if (year) year.textContent = String(new Date().getFullYear());
  if (active) setActiveNav(active);
  initUserChip();
  initTopTicker();
}

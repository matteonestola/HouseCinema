import { collection, query, where, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { db, auth, isAdminUser, toDate, eventPhase, timeUntilLabel, formatTime } from "./app.js";
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
  const organizza = document.getElementById("header-organizza");
  const navOrganizza = document.getElementById("mobile-nav-organizza");
  const footerOrganizza = document.getElementById("footer-organizza");
  if (!chip) return;
  onAuthStateChanged(auth, (user) => {
    if (organizza) organizza.hidden = !isAdminUser(user);
    if (navOrganizza) navOrganizza.hidden = !isAdminUser(user);
    if (footerOrganizza) footerOrganizza.hidden = !isAdminUser(user);
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

function initComeFunzionaModal() {
  const modal = document.getElementById("come-funziona-modal");
  if (!modal) return;
  let lastFocus = null;

  const close = () => {
    modal.classList.add("hidden");
    if (lastFocus && lastFocus.focus) lastFocus.focus();
    lastFocus = null;
  };
  const open = () => {
    lastFocus = document.activeElement;
    modal.classList.remove("hidden");
    const ok = document.getElementById("come-funziona-ok");
    if (ok) ok.focus();
  };

  document.getElementById("come-funziona-close")?.addEventListener("click", close);
  document.getElementById("come-funziona-ok")?.addEventListener("click", close);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) close();
  });
  document.addEventListener("keydown", (e) => {
    if (modal.classList.contains("hidden")) return;
    if (e.key === "Escape") {
      close();
      return;
    }
    if (e.key !== "Tab") return;
    const items = [...modal.querySelectorAll("button, a[href]")];
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });
  document.querySelectorAll('[data-open-modal="come-funziona"]').forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      open();
    });
  });
}

function initTopTicker() {
  const ticker = document.getElementById("top-ticker");
  const title = document.getElementById("ticker-title");
  const eta = document.getElementById("ticker-eta");
  const link = document.getElementById("ticker-link");
  const navSerata = document.getElementById("mobile-nav-serata");
  const navVota = document.getElementById("mobile-nav-vota");
  const dot = document.getElementById("ticker-dot");
  const noTicker = document.body.hasAttribute("data-no-ticker"); // la home ha gia' la card della serata
  let next = null;
  let timer = null;

  // "Vota" ha senso solo a serata in corso: altrimenti lucchetto e motivo (l'ora d'inizio)
  function setVota(on, start) {
    if (!navVota) return;
    const icon = navVota.querySelector(".material-symbols-outlined");
    if (icon) icon.textContent = on ? "local_fire_department" : "lock_clock";
    navVota.classList.toggle("opacity-60", !on);
    navVota.classList.toggle("pointer-events-none", !on);
    navVota.setAttribute("aria-disabled", on ? "false" : "true");
    const reason = start ? "Vota (si apre alle " + formatTime(start) + ")" : "Vota (si apre quando la serata inizia)";
    navVota.setAttribute("aria-label", on ? "Vota" : reason);
    navVota.title = on ? "" : reason;
    navVota.tabIndex = on ? 0 : -1;
  }
  setVota(false); // finche' non sappiamo se c'e' una serata live

  function paint() {
    if (!next) {
      if (ticker) ticker.hidden = true;
      if (navSerata) navSerata.href = "event.html";
      if (navVota) navVota.href = "event.html";
      setVota(false);
      return;
    }
    const href = "event.html?id=" + encodeURIComponent(next.id);
    if (ticker) ticker.hidden = noTicker;
    if (title) title.textContent = next.title;
    const phase = eventPhase(next);
    if (dot) {
      dot.classList.toggle("bg-secondary-container", phase === "live");
      dot.classList.toggle("animate-pulse", phase === "live");
      dot.classList.toggle("bg-primary", phase !== "live");
    }
    if (eta) eta.textContent = phase === "live" ? "In corso ora" : "Inizio tra " + timeUntilLabel(toDate(next.startAt));
    if (link) link.href = href;
    if (navSerata) navSerata.href = href;
    if (navVota) navVota.href = href + "#vota";
    setVota(phase === "live", toDate(next.startAt));
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
  initComeFunzionaModal();
}

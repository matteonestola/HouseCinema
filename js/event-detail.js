import { doc, collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db, qs, ensureAnonymousUser, isAdminUser, toDate, eventPhase } from "./app.js";
import { initLayout } from "./layout.js";
import { initPre } from "./event-pre.js";
import { initLive } from "./event-live.js";

const eventId = qs("id");
const ctx = { eventId, ev: null, user: null, isAdmin: false, participants: new Map(), me: null, route: null };
let pre = null;
let live = null;
let routeTimer = null;
let scheduledFor = 0;

const $ = (id) => document.getElementById(id);

initLayout({ active: "serata" });

function showNotFound() {
  $("view-pre").hidden = true;
  $("view-live").hidden = true;
  $("not-found").hidden = false;
}

function route() {
  if (!ctx.ev) return;
  const phase = eventPhase(ctx.ev);
  $("not-found").hidden = true;
  if (phase === "upcoming") {
    $("view-live").hidden = true;
    $("view-pre").hidden = false;
    if (!pre) pre = initPre(ctx);
    else pre.onEvent();
    // passaggio automatico a LIVE allo scoccare di startAt
    const start = toDate(ctx.ev.startAt);
    if (start && scheduledFor !== start.getTime()) {
      scheduledFor = start.getTime();
      clearTimeout(routeTimer);
      const delay = Math.min(Math.max(start.getTime() - Date.now() + 1000, 0), 2147483000);
      routeTimer = setTimeout(() => {
        scheduledFor = 0;
        route();
      }, delay);
    }
  } else {
    clearTimeout(routeTimer);
    scheduledFor = 0;
    $("view-pre").hidden = true;
    $("view-live").hidden = false;
    if (pre) {
      pre.destroy();
      pre = null;
    }
    if (!live) live = initLive(ctx);
    else live.onEvent();
    if (location.hash === "#vota") {
      const target = $("movies-container");
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }
}
ctx.route = route;

function notifyParticipants() {
  if (pre) pre.onParticipants();
  if (live) live.onParticipants();
}

async function init() {
  if (!eventId) {
    showNotFound();
    return;
  }
  try {
    ctx.user = await ensureAnonymousUser();
  } catch (err) {
    console.error(err);
    showNotFound();
    return;
  }
  ctx.isAdmin = isAdminUser(ctx.user);

  let participantsStarted = false;
  let resolveParticipants;
  const firstParticipants = new Promise((r) => (resolveParticipants = r));

  function startParticipants() {
    if (participantsStarted) return;
    participantsStarted = true;
    onSnapshot(
      collection(db, "events", eventId, "participants"),
      (snap) => {
        ctx.participants = new Map();
        snap.forEach((d) => ctx.participants.set(d.id, d.data()));
        ctx.me = ctx.participants.get(ctx.user.uid) || null;
        resolveParticipants();
        notifyParticipants();
      },
      (err) => {
        console.warn("participants", err.code);
        resolveParticipants();
      }
    );
  }

  let first = true;
  onSnapshot(
    doc(db, "events", eventId),
    async (snap) => {
      if (!snap.exists()) {
        showNotFound();
        return;
      }
      ctx.ev = { id: snap.id, ...snap.data() };
      document.title = `${ctx.ev.title} — CineSerata`;
      if (first) {
        first = false;
        startParticipants();
        await firstParticipants;
      }
      route();
    },
    (err) => {
      console.warn("event", err.code);
      showNotFound();
    }
  );
}

init();

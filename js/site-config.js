export const SITE_NAME = "CineSerata";
export const HOST_NAME = "Matteo";            // mostrato come "Host"
export const ADMIN_UID = "JhJhhIiniHcyitXoSHIflgkSnSt2"; // deve coincidere con firestore.rules
export const MAX_FILMS = 5;
export const TITLE_MAX = 60;
export const REVEAL_POSTPONE_MIN = 15;
export const LIVE_PAGE_SIZE = 6;
export const DEFAULT_COVER = "assets/img/cover-default.jpg";
export const GENRES = [
  { id: "Horror", emoji: "🩸" },
  { id: "Sci-Fi", emoji: "🚀" },
  { id: "Cult d'Autore", emoji: "📽️" },
  { id: "Commedia", emoji: "😂" },
  { id: "Animazione", emoji: "✨" },
  { id: "Trash & Pizza", emoji: "🍕" },
  { id: "Azione", emoji: "💥" }
];
export const AVATARS = [
  { emoji: "🍿", title: "Popcorn" },
  { emoji: "🎬", title: "Ciak Regia" },
  { emoji: "🍕", title: "Pizza al taglio" },
  { emoji: "🕶️", title: "Occhiali 3D" },
  { emoji: "📼", title: "Cassetta VHS" },
  { emoji: "🧟", title: "Mostro Horror" }
];
// Una voce e' un'emoji ({ emoji, label }) oppure un'immagine ({ id, image, label }).
// In participants/{uid}.avatar si salva l'emoji, oppure l'`id` per le immagini: max 16 caratteri
// (vincolo di firestore.rules), solo [a-z0-9-]. File in assets/avatars/ (quadrati, ~192 px).
export const SPECIAL_AVATARS = [
  { emoji: "🛸", label: "UFO Invaders" },
  { emoji: "💀", label: "Skull Neon" },
  { emoji: "🪚", label: "Chainsaw '80" },
  { id: "iron-chicken", image: "assets/avatars/iron-chicken.jpg", label: "Iron Chicken" },
  { id: "tacchino", image: "assets/avatars/tacchino.jpg", label: "Tacchino Mistico" },
  { id: "gattonauta", image: "assets/avatars/gattonauta.jpg", label: "Gattonauta" }
];
export const SNACKS = [
  { id: "popcorn", label: "🍿 Popcorn caramellati (fatti in casa)", short: "Popcorn caramellati" },
  { id: "birre", label: "🍻 Birre artigianali / IPA ghiacciate", short: "Birre artigianali" },
  { id: "nachos", label: "🧀 Nachos giganti con salsa cheddar", short: "Nachos & cheddar" },
  { id: "bibite", label: "🥤 Bibite gassate analcoliche & ghiaccio", short: "Bibite analcoliche" },
  { id: "sorpresa", label: "🎁 Sorpresa golosa a tema", short: "Sorpresa golosa" },
  { id: "solo_presenza", label: "❤️ Porto solo la mia presenza cinematografica", short: "Solo presenza" }
];

---
name: cineserata-map
description: Mappa del progetto CineSerata (pagine, moduli JS, flusso dati Firestore, convenzioni). Leggi PRIMA di qualsiasi modifica al sito o quando non sai in quale file stia una funzione o una sezione.
---

# CineSerata: mappa del progetto

Sito statico (nessun build): HTML + Tailwind Play CDN + moduli ES + Firebase 10.12.2 da CDN. Pubblicato su GitHub Pages (branch `main`). Grafica derivata dal progetto Stitch "Matteo's Cinema" (id `12981726820675719701`); export di riferimento in `design/stitch/`.

## Pagine e moduli
| Pagina | Modulo JS | Sezioni |
|---|---|---|
| `index.html` | `js/events-list.js` | hero, serata in evidenza, filtri + griglia eventi, callout host |
| `event.html` | `js/event-detail.js` (orchestra) → `js/event-pre.js` (prima dell'inizio) / `js/event-live.js` (dopo) | `#view-pre`, `#view-live`, `#not-found` |
| `admin.html` | `js/admin.js` | `#login-section`, `#admin-panel` (form, gestione, anteprima, modali) |

Condivisi: `js/site-config.js` (costanti/liste editabili), `js/app.js` (init Firebase, helper data/countdown/toast, `eventPhase`, `coverOf`, `genreEmoji`, `snackShort`, `inviteUrl`), `js/layout.js` (ticker in alto, chip utente, nav attiva, link bottom-nav), `js/tailwind-config.js` (palette/font Stitch), `css/style.css` (solo CSS non-Tailwind), `firestore.rules`, `js/firebase-config.js` (non toccare).

## Regole di base
- Il markup Stitch è **verbatim**: per cambiare grafica modifica le classi Tailwind esistenti, non riscrivere i componenti. Token colore/font solo da `js/tailwind-config.js`.
- L'HTML ha contenitori con id; i template delle card/liste sono stringhe nei moduli JS (non nell'HTML). Usa sempre `escapeHtml()` per dati utente.
- Ogni id usato dal JS deve esistere nell'HTML della sua pagina e non essere duplicato (le due viste di `event.html` hanno prefissi `pre-`/`live-`).
- Header, footer e bottom-nav sono duplicati in tutte e 3 le pagine: una modifica va replicata in `index.html`, `event.html`, `admin.html`.

## Fasi evento (`eventPhase` in app.js)
`upcoming` (prima di `startAt`) → `live` (da `startAt`) → `completed` (se c'è `ev.screening` o 12h dopo). Prima di `startAt` i titoli dei film altrui **non** sono leggibili (vincolo nelle regole, non solo UI): la UI pre-reveal usa solo `participants.filmCount`.

## Modello dati
```
events/{id}: title, description, startAt, createdAt, createdBy, status(draft|published), genre, location, coverUrl, hostName, screening?{filmId,title,proposerNickname,votes,startedAt}
events/{id}/participants/{uid}: nickname, avatar, snack, filmCount, joinedAt, updatedAt
events/{id}/proposals/{uid}: nickname, films[{id,title,note?}] (max 5), updatedAt
events/{id}/votes/{uid}: picks[filmId], updatedAt
```
Auth: Firebase email/password per l'admin (UID in `ADMIN_UID` **e** in `firestore.rules`), anonimo per i partecipanti.

## Vincoli che legano codice e regole
Valori ripetuti in `site-config.js` e `firestore.rules` (vedi skill `cineserata-firestore` e `cineserata-limits`): ADMIN_UID, max film (5), max titolo (60), lunghezza avatar (≤16) e id snack (≤20), nickname (≤30).

## Altre skill
`cineserata-avatars`, `cineserata-snacks`, `cineserata-genres`, `cineserata-images`, `cineserata-texts`, `cineserata-limits`, `cineserata-edit-home`, `cineserata-edit-event-pre`, `cineserata-edit-event-live`, `cineserata-edit-admin`, `cineserata-firestore`, `cineserata-verify`.

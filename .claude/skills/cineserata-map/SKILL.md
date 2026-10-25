---
name: cineserata-map
description: Mappa del progetto CineSerata (pagine, moduli JS, flusso dati Firestore, convenzioni). Leggi PRIMA di qualsiasi modifica al sito o quando non sai in quale file stia una funzione o una sezione.
---

# CineSerata: mappa del progetto

Sito statico (nessun build): HTML + Tailwind Play CDN + moduli ES + Firebase 10.12.2 da CDN. Pubblicato su GitHub Pages (branch `main`). Grafica derivata dal progetto Stitch "Matteo's Cinema" (id `12981726820675719701`); export di riferimento in `design/stitch/`.

## Pagine e moduli
| Pagina | Modulo JS | Sezioni |
|---|---|---|
| `index.html` (Bacheca) | `js/events-list.js` | hero, **solo** la serata in evidenza/prossima (`#serata-imminente`, nascosta se non c'è), callout host |
| `event.html` (tab "Serata") | `js/event-detail.js` (orchestra) → senza `?id=`: `js/events-browse.js` per `#view-list` (filtri + griglia **di tutte le serate**, incluso `?filter=completed`); con `?id=`: `js/event-pre.js` (prima dell'inizio) / `js/event-live.js` (dopo) | `#view-list`, `#view-pre`, `#view-live`, `#not-found` |
| `admin.html` (tab "Organizza") | `js/admin.js` | `#login-section`, `#admin-panel` (form crea serata, gestione, anteprima, modali) — **visibile solo dopo login admin** |

Condivisi: `js/site-config.js` (costanti/liste editabili), `js/app.js` (init Firebase, helper data/countdown/toast, `eventPhase`, `coverOf`, `genreEmoji`, `snackShort`, `inviteUrl`), `js/layout.js` (ticker in alto, chip utente, nav attiva, link bottom-nav, modale "Come Funziona"), `js/tailwind-config.js` (palette/font Stitch), `css/style.css` (solo CSS non-Tailwind), `firestore.rules`, `js/firebase-config.js` (non toccare).

## Tab e navigazione (bottom-nav / nav header)
I 4 "tab" (`data-nav` in header/footer/`#mobile-nav`) sono: **Bacheca** (`index.html`, solo prossima serata), **Serata** (`event.html`, elenco completo delle serate quando non c'è `?id=`, dettaglio singolo quando c'è), **Vota** (punta alla serata live corrente, fallback `event.html`), **Organizza** (`admin.html`, creazione/gestione serata dietro login). "Tutte le Serate" e "Archivio Film Visti" (`event.html?filter=completed`) vivono **solo** nel tab Serata: non duplicarli in Bacheca.

## "Come Funziona"
Non è più una sezione statica in pagina: è un **modal** (`#come-funziona-modal`, markup duplicato come header/footer in tutte e 3 le pagine) gestito da `initComeFunzionaModal()` in `js/layout.js`. Si apre da solo al caricamento di ogni pagina finché l'utente non spunta "Non mostrare più questo messaggio" (persistito in `localStorage`, chiave `cineserata:hideComeFunziona`); resta comunque raggiungibile in ogni momento dal link "Come Funziona" nel footer (`data-open-modal="come-funziona"`).

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
`cineserata-avatars`, `cineserata-snacks`, `cineserata-genres`, `cineserata-images`, `cineserata-cover-images`, `cineserata-texts`, `cineserata-limits`, `cineserata-edit-home`, `cineserata-edit-event-pre`, `cineserata-edit-event-live`, `cineserata-edit-admin`, `cineserata-firestore`, `cineserata-verify`.

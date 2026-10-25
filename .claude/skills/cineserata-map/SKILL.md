---
name: cineserata-map
description: Mappa del progetto CineSerata (pagine, moduli JS, flusso dati Firestore, convenzioni). Leggi PRIMA di qualsiasi modifica al sito o quando non sai in quale file stia una funzione o una sezione.
---

# CineSerata: mappa del progetto

Sito statico (nessun build): HTML + Tailwind Play CDN + moduli ES + Firebase 10.12.2 da CDN. Pubblicato su GitHub Pages (branch `main`, workflow `.github/workflows/deploy.yml`). Nome del sito: **CineSerata**. Grafica derivata dal progetto Stitch "Matteo's Cinema" (id `12981726820675719701`, design system "Cinema Midnight"); export di riferimento in `design/stitch/`. Contesto di prodotto in `PRODUCT.md`, sistema visivo in `DESIGN.md` (+ sidecar `.impeccable/design.json`): leggili prima di cambiare grafica o copy.

## Pagine e moduli
| Pagina | Modulo JS | Sezioni |
|---|---|---|
| `index.html` (Bacheca) | `js/events-list.js` | hero (`h1` + `#home-sub`), stati `#home-loading` / `#home-error` / `#home-empty`, card della **prima** serata non conclusa `#serata-imminente`, `#other-events` (fino a 3 altre serate). Niente più banda host né "Come Funziona" in pagina. |
| `event.html` (tab "Serata") | `js/event-detail.js` (orchestra) → senza `?id=`: `js/events-browse.js` per `#view-list` (filtri + griglia **di tutte le serate**, incluso `?filter=completed`); con `?id=`: `js/event-pre.js` (prima dell'inizio) / `js/event-live.js` (dopo). Hash: `#proponi` scorre al modulo di partecipazione (PRE), `#vota` alla griglia film (LIVE) | `#view-list`, `#view-pre`, `#view-live`, `#not-found` |
| `admin.html` (tab "Organizza") | `js/admin.js` | `#login-section`, `#admin-panel` (form crea serata con galleria copertine, gestione, anteprima, modali) — **visibile solo dopo login admin** |

Condivisi: `js/site-config.js` (costanti/liste editabili), `js/app.js` (init Firebase, helper data/countdown/toast, `eventPhase`, `coverOf`, `genreEmoji`, `snackShort`, `inviteUrl`, `waitForUser`), `js/layout.js` (ticker in alto, chip utente e visibilità "solo admin", nav attiva, Vota, modale "Come Funziona"), `js/tailwind-config.js` (palette/font Stitch), `css/style.css` (solo CSS non-Tailwind: animazioni sblocco, reduced-motion, safe area), `firestore.rules`, `js/firebase-config.js` (generato dal deploy: non toccare), `background_img/` (copertine del sito + `manifest.json`), `assets/avatars/` (avatar a immagine, vedi `cineserata-avatars`).

## Tab e navigazione
I tab (`data-nav` in header/footer/`#mobile-nav`) sono:
- **Bacheca** (`index.html`, solo prossima serata; chiave `bacheca` nel bottom-nav).
- **Serata** (`event.html`: elenco completo senza `?id=`, dettaglio con `?id=`). "Tutte le Serate" e "Archivio Film Visti" (`event.html?filter=completed`) vivono **solo** nel tab Serata (header desktop e footer): non duplicarli in Bacheca.
- **Vota**: punta a `event.html?id=…#vota` ed è **disattivato** (icona `lock_clock`, `aria-disabled`, motivo in `title`) finché non c'è una serata live. Gestito da `setVota()` in `initTopTicker()` (`js/layout.js`).
- **Organizza** (`admin.html`): per i non admin **nascosto** in header (`#header-organizza`), bottom-nav (`#mobile-nav-organizza`) e footer "Nuova Serata" (`#footer-organizza`); lo mostra `initUserChip()` se `isAdminUser`. L'ingresso discreto al login per l'host è il link **"Area host"** in fondo al footer (`#footer-area-host`, sempre visibile).

Il ticker in alto (`#top-ticker`: "Prossima serata…") compare in event/admin ma non in Bacheca (`<body data-no-ticker>`: la card lo ripeterebbe). Il suo puntino (`#ticker-dot`) è rosso e pulsa solo se la serata è live.

## "Come Funziona"
È un **modal** (`#come-funziona-modal`, markup duplicato come header/footer in tutte e 3 le pagine) gestito da `initComeFunzionaModal()` in `js/layout.js`. **Non si apre più da solo** e non usa più `localStorage`: si apre dal link "Come Funziona" del footer e da quello nella nota sotto il CTA in Bacheca (`data-open-modal="come-funziona"`). Esc, X (44px) e sfondo lo chiudono; il focus va su "Ho capito" e torna all'elemento che l'ha aperto; Tab resta dentro. I 3 passi sono scritti dal punto di vista dell'ospite.

## Regole di base
- Il markup Stitch resta il riferimento: per cambiare grafica modifica le classi Tailwind esistenti, non riscrivere i componenti da zero. Token colore/font solo da `js/tailwind-config.js`. Rispetta `DESIGN.md` (tema scuro fisso, ambra per l'azione, rosso **solo** per il live, niente card annidate).
- L'HTML ha contenitori con id; i template di card/liste sono stringhe nei moduli JS. Usa sempre `escapeHtml()` per dati utente (in DOM API usa `textContent`).
- Ogni id usato dal JS deve esistere nell'HTML della sua pagina e non essere duplicato (le due viste di `event.html` hanno prefissi `pre-`/`live-`).
- Header, footer, bottom-nav e modale "Come Funziona" sono duplicati in tutte e 3 le pagine: una modifica va replicata in `index.html`, `event.html`, `admin.html`.
- Accessibilità già curata (non toglierla): `prefers-reduced-motion` in `css/style.css`, `role="timer"` sul countdown, `aria-live` sullo stato, bersagli ≥ 44px.

## Fasi evento (`eventPhase` in app.js)
`upcoming` (prima di `startAt`) → `live` (da `startAt`) → `completed` (se c'è `ev.screening` o 12h dopo). Prima di `startAt` i titoli dei film altrui **non** sono leggibili (vincolo nelle regole, non solo UI): la UI pre-reveal usa solo `participants.filmCount`. In Bacheca il caveau è "sigillato" (cover sfocata) finché `upcoming`, "aperto" a `live`.

## Modello dati
```
events/{id}: title, description, startAt, createdAt, createdBy, status(draft|published), genre, location, coverUrl, hostName, screening?{filmId,title,proposerNickname,votes,startedAt}
events/{id}/participants/{uid}: nickname, avatar, snack, filmCount, joinedAt, updatedAt
events/{id}/proposals/{uid}: nickname, films[{id,title,note?}] (max 5), updatedAt
events/{id}/votes/{uid}: picks[filmId], updatedAt
```
`coverUrl` è un URL `http(s)://` **oppure** un percorso del sito `background_img/<file>`. La Bacheca legge `participants` (pubblici) in tempo reale solo per la serata in evidenza.
Auth: Firebase email/password per l'admin (UID in `ADMIN_UID` **e** in `firestore.rules`), anonimo per i partecipanti (creato solo quando partecipano; la Bacheca usa `waitForUser()` e non ne crea).

## Vincoli che legano codice e regole
Valori ripetuti in `site-config.js` e `firestore.rules` (vedi skill `cineserata-firestore` e `cineserata-limits`): ADMIN_UID, max film (5), max titolo (60), lunghezza avatar (≤16) e id snack (≤20), nickname (≤30).

## Deploy
Push su `main` → workflow: genera `js/firebase-config.js` dai secret e `background_img/manifest.json` dall'elenco dei file, poi pubblica su GitHub Pages. Le `firestore.rules` **non** si pubblicano da qui (Console Firebase).

## Altre skill
`cineserata-avatars`, `cineserata-snacks`, `cineserata-genres`, `cineserata-images`, `cineserata-cover-images`, `cineserata-texts`, `cineserata-limits`, `cineserata-edit-home`, `cineserata-edit-event-pre`, `cineserata-edit-event-live`, `cineserata-edit-admin`, `cineserata-firestore`, `cineserata-verify`. Per interventi di design c'è anche la skill `impeccable` (`/impeccable critique index.html`, `polish`, …).

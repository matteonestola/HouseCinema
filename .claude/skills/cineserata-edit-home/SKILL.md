---
name: cineserata-edit-home
description: Modificare la Bacheca (index.html + js/events-list.js): hero, card della serata in evidenza (caveau, CTA, countdown, partecipanti), stati di caricamento/errore/vuoto, "Altre serate".
---

# Bacheca (`index.html` + `js/events-list.js`)

La Bacheca mostra l'hero, la **prima** serata non conclusa (card Caveau) e, se ce ne sono altre, una riga "Altre serate in programma" (max 3). L'elenco completo con filtri e archivio (`?filter=completed`) vive nel tab **Serata** (`event.html` senza `?id=`, `js/events-browse.js`): per quello vedi quel file. Prima di cambiare grafica o testi leggi `PRODUCT.md` e `DESIGN.md`.

## Flusso
1. `subscribeEvents()` ascolta `events` con `where('status','==','published')` (bozze ed eventi senza `status` non compaiono finché l'admin non fa il backfill) e ordina per `startAt` lato client. Parte `setLoadState("loading")`; un timeout di 10 s (`LOAD_TIMEOUT_MS`) passa a `showLoadError()` perché Firestore offline non emette errori.
2. `render()` (solo se `loaded`) calcola le serate non concluse → `renderFeatured(prima)` + `renderOthers(altre 3)`.
3. `watchStats(eventId)` apre un `onSnapshot` su `participants` **solo della serata in evidenza** (lo ricrea se cambia). `stats` vale `null` (in arrivo → scheletro), `{ failed|timedOut }` (errore o timeout di 6 s, `STATS_TIMEOUT_MS` → messaggio + `#stats-retry`), oppure `{ people, films }`.
4. `waitForUser()` (senza creare un login anonimo) dà `myUid`: serve a riconoscere "tu" tra i partecipanti e a personalizzare il CTA.

## Sezioni e id
- **Hero**: `h1` statico, sottotitolo `#home-sub` (testo `DEFAULT_SUB`, a live "Il caveau è aperto. Si vota."), `#home-empty` ("Nessuna serata in programma. {HOST_NAME} la annuncia in chat.") visibile solo senza serate.
- **Stati**: `#home-loading` ("Carico la serata…"), `#home-error` + `#home-retry`.
- **Card** `#serata-imminente`, ordine: stato+data (`#featured-status`, `-status-ping`, `-status-dot`, `#featured-date`, `#featured-genre`), titolo/descrizione (`#featured-title`, `#featured-desc`), CTA (`#featured-cta-join` primario, `#featured-cta-details` link testuale, nota `#featured-note` con link al modal), countdown (`#featured-countdown-box`, `#countdown-hours|minutes|seconds`, etichette `#countdown-label-1..3`, `role="timer"`), partecipanti (`#featured-participants-block|label|participants`), host (`#featured-host`).
- **Caveau** (colonna sinistra): `#featured-cover` (sfocata `blur-[8px] scale-110` finché `upcoming`, nitida a `live`), pannello `#featured-panel` con `#featured-lock` / `-lock-icon` / `-lock-title` / `-lock-count` e tagliandi `#featured-tickets` (uno per film proposto, max `MAX_TICKETS`=8, solo conteggio: **mai titoli**). Animazioni di sblocco `unlock-pop` / `unlock-flash` (`css/style.css`) una sola volta, al passaggio a live.
- **Altre serate**: `#other-events`, `#other-events-list` (righe link con titolo, data, `statusLabel`).

## CTA (`renderFeatured`)
Un solo verbo e una sola azione primaria: `live` → "Entra & Vota" (`…#vota`); già partecipante → "Hai proposto N/MAX_FILMS, modifica" (o "Ci sei: proponi i tuoi film" se 0) → `…#proponi`; altrimenti (anche se non sappiamo chi sei) "Proponi i tuoi film" → `…#proponi`. `#proponi` fa scorrere `event-detail.js` al modulo di partecipazione. La nota `#featured-note` ("Basta un nickname…") sparisce per chi è già dentro.

## Regole da non rompere
- Il segreto dei film: la Bacheca legge solo `participants` (pubblici). **Mai** leggere `proposals` qui (le regole lo vietano prima di `startAt`) né mostrare titoli.
- Rosso solo per il live (`secondary`/`secondary-container`): status, puntino e ping si colorano di rosso solo se `phase === "live"`. Il countdown di una serata futura è ambra.
- Una sola azione primaria ambra nella card. Niente card dentro card (i gruppi interni si separano con spazio o filo `outline-variant/20`).
- Niente CTA "crea serata" per gli ospiti: solo l'host può creare (la voce Organizza è visibile solo all'admin, vedi `cineserata-map`).
- Dati utente in `innerHTML` solo con `escapeHtml`; i bottoni dinamici si legano dopo aver scritto l'HTML (es. `#stats-retry`).

## Come modificare
- Testi/ordine dell'hero o della card (markup) → `index.html`, classi Stitch/tema invariate.
- Contenuto dinamico della card → `renderFeatured` / `renderOthers` in `js/events-list.js`; etichette di stato → `statusLabel`; countdown (giorni oltre 48 h, poi ore/min/sec) → `startHomeCountdown`.
- Nuovo dato da `participants` → estendi `watchStats` (e controlla le regole `hasOnly`); nuovo campo evento → aggiorna admin (`cineserata-edit-admin`) e, se serve, `firestore.rules` (`cineserata-firestore`).
- Il numero massimo film viene da `MAX_FILMS` (`site-config.js`); il "5" nel sottotitolo (`index.html` + `DEFAULT_SUB`) e nel modal è scritto a mano: vedi `cineserata-limits`.
- Modal "Come Funziona": markup in tutte e 3 le pagine, logica in `initComeFunzionaModal()` (`js/layout.js`); non si apre da solo.

## Verifica
Bacheca senza eventi (hero + "Nessuna serata…"), caricamento e errore (dopo 10 s con Firebase non raggiungibile: "Riprova"), serata futura da iscritto e da non iscritto (3 etichette del CTA), serata live (rosso, caveau aperto), lettura partecipanti lenta/fallita (messaggio + CTA neutro), più serate ("Altre serate"), modal da footer e da nota CTA, 1280px e 390px (CTA sopra la piega su telefono), `prefers-reduced-motion`. Per provare senza dati reali vedi `cineserata-verify` (anteprima con Firestore simulato).

---
name: cineserata-edit-event-live
description: Modificare la vista LIVE del dettaglio evento (dopo l'inizio): spotlight, griglia film e voto, filtri, roulette, avvio proiezione, join tardivo.
---

# Dettaglio evento, fase LIVE (`event.html#view-live` + `js/event-live.js`)

Attiva da `startAt` (o se c'è `ev.screening`). `initLive(ctx)` si sottoscrive a `proposals` (ora leggibili) e `votes`; `render()` = `renderHeader` + `renderSpotlight` + `renderGrid`.

## Sezioni → funzioni → id
| Sezione | Funzione | Id |
|---|---|---|
| Ticker + titolo | `renderHeader` | `live-start-time`, `live-couch-count`, `live-films-count`, `live-title`, `live-subtitle` |
| Spotlight (leader/film scelto) | `renderSpotlight`, `voterAvatars` | `spotlight`, `spotlight-badge/title/votes/headline(-label)/proposer/note/voters(-extra)`, `start-screening-btn`, `start-screening-note` |
| Filtri/ricerca | `filteredFilms` | `filter-tabs` (`.filter-tab[data-filter=all|top]`), `movie-search` |
| Griglia film + voto | `movieCard`, `renderGrid`, `toggleVote` | `movies-container`, `.vote-button`, `.vote-count`, `live-pagination-text`, `live-load-more` |
| Roulette | `runRoulette`, `acceptRoulette` | `roulette-trigger`, `roulette-modal`, `roulette-*`, `accept-roulette`, `close-roulette` |
| Avvia proiezione (solo admin) | `startScreening`, `maybeShowScreening` | `start-screening-btn`, `screening-modal`, `screening-title/desc`, `close-screening` |
| Join tardivo (non partecipanti) | `renderLateAvatars`, `submitLateJoin` | `live-join-card`, `live-join-form`, `live-nickname`, `live-avatar-selector` |

## Logica chiave
- Voti: `votes/{uid}.picks` (array di filmId); `tally()` conta, `ranked()` ordina (parità → titolo alfabetico). Leader = primo; "quasi unanime" se voti ≥ 75% dei partecipanti.
- Filtro "I più votati" (`top`): film con voti e tra i primi 3 valori distinti.
- `startScreening` scrive `events/{id}.screening` (solo admin per regole); da quel momento i voti sono bloccati (regola su `votes`) e l'evento diventa *completed* in bacheca. Il modale compare una volta per sessione (`sessionStorage`).
- Il voto richiede di essere partecipante (la regola `votes` verifica `participants/{uid}`); i non partecipanti vedono bottoni disabilitati.
- Pagina: `LIVE_PAGE_SIZE` in `site-config.js`.

## Regole
Classi Stitch verbatim; template card in `movieCard`; dati utente sempre con `escapeHtml`; stati "nessun film" con il box `emptyBox`. Per filtri tipo durata/genere per film servirebbero nuovi campi nei film (oggi: solo `id`, `title`, `note`) → vedi `cineserata-firestore`.
Verifica: 2–3 profili che votano, toggle, roulette, avvio proiezione da admin, refresh.

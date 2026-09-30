---
name: cineserata-edit-event-pre
description: Modificare la vista PRE del dettaglio evento (prima dell'inizio): hero, time-lock, partecipazione, proposte film, lista partecipanti, caveau segreto, condivisione.
---

# Dettaglio evento, fase PRE (`event.html#view-pre` + `js/event-pre.js`)

`event-detail.js` decide la vista (`route()`): fase `upcoming` → mostra `#view-pre` e chiama `initPre(ctx)`; allo scoccare di `startAt` passa a LIVE da sola. `ctx` = `{ eventId, ev, user, isAdmin, participants: Map, me }`.

## Sezioni → funzioni → id
| Sezione | Funzione | Id principali |
|---|---|---|
| Hero (titolo, host, data, luogo, poster, tag genere) | `renderHero` | `pre-title`, `pre-host`, `pre-tagline`, `pre-when`, `pre-location`, `pre-cover`, `pre-theme`, `pre-tags`, `pre-breadcrumb-title` |
| Time-lock + countdown | `renderTimeLock` | `pre-countdown-hours/minutes/seconds`, `pre-reveal-note` |
| Stato caveau (film/slot/%) | `renderCaveauStats` | `caveau-count/friends/bar/slots/pct` |
| Partecipazione rapida | `renderAvatars`, `buildSnacks`, `renderJoin`, `submitJoin` | `rsvp-form`, `participant-name`, `avatar-selector`, `special-avatars`, `snack-selection`, `rsvp-submit-label`, `rsvp-status-alert` |
| Le tue proposte | `loadMyFilms`, `renderMyFilms`, `saveFilms`, `filmCard`, `filmForm`, `slotPlaceholder` | `proposals-section`, `slots-used`, `slots-bar`, `my-films`, `slot-area`, `slot-form`, `slot-title`, `slot-note` |
| Chi viene stasera | `renderParticipants` | `participants-count`, `participants-list` |
| Caveau segreto (solo segnaposto) | `renderMysteryCards` | `mystery-grid`, `mystery-others`, `mystery-reveal-time` |
| Condivisione | `bindShare` | `share-btn`, `share-text`, `copied-notice` |

## Regole da non rompere
- **Mai mostrare titoli altrui** qui: il caveau usa testo fisso "Titolo Segreto" e `filmCount`. Le regole bloccano comunque la lettura prima di `startAt`.
- Ogni scrittura utente è un `writeBatch` su `participants/{uid}` **e** `proposals/{uid}` con `filmCount == films.size()` (vincolo delle regole): usa `saveFilms`/`submitJoin`, non scritture singole.
- Film = `{ id (genFilmId), title, note? }`; in lettura `normalizeFilms` gestisce il vecchio formato stringa.
- Liste editabili (avatar, snack, limiti) non si toccano qui: vedi `cineserata-avatars`, `cineserata-snacks`, `cineserata-limits`.
- Stati: non partecipante (form vuoto, `#proposals-section` hidden) vs partecipante (precompilato, bottone "Aggiorna Partecipazione").

Verifica: join con due profili anonimi, 5 film, refresh, countdown che arriva a 0 e cambia vista.

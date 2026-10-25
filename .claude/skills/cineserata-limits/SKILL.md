---
name: cineserata-limits
description: Cambiare i limiti numerici di CineSerata (max film per persona, lunghezza titolo, minuti del "+15m", film per pagina in LIVE) mantenendo codice e regole Firestore allineati.
---

# Limiti e costanti numeriche

| Costante (`js/site-config.js`) | Effetto | Regole Firestore da allineare |
|---|---|---|
| `MAX_FILMS` (5) | slot proposte, barre/contatori in PRE (`event-pre.js`), CTA "Hai proposto N/MAX" in Bacheca (`events-list.js`) | **Sì**: `validFilms` in `firestore.rules` è scritto per 5 (`films.size() <= 5` + 5 righe `validFilm(films[0..4])`) |
| `TITLE_MAX` (60) | validazione titolo e contatore in admin | **Sì**: `title.size() <= 60` nella regola `events` |
| `REVEAL_POSTPONE_MIN` (15) | minuti del bottone "Modifica orario reveal" | No. Aggiorna anche il testo del bottone in `admin.html` (`#btn-edit-reveal`) |
| `LIVE_PAGE_SIZE` (6) | film mostrati per pagina in LIVE ("Carica gli altri") | No |

Altre costanti locali (non in `site-config.js`): `MAX_TICKETS` (8, tagliandi del caveau in Bacheca), `LOAD_TIMEOUT_MS` (10 s, caricamento eventi) e `STATS_TIMEOUT_MS` (6 s, lettura partecipanti) in `js/events-list.js`. Nessuna regola da allineare.

## Cambiare MAX_FILMS (es. 3 o 8)
1. `site-config.js`: nuovo valore.
2. `firestore.rules`: aggiorna `films.size() <= N` e aggiungi/togli le righe `(films.size() < k || validFilm(films[k-1]))` (le regole non hanno cicli). Il campo `filmCount` è già legato a `films.size()`.
3. **Il "5" scritto a mano** (non legato a `MAX_FILMS`): trovali con `grep -rn "5 film\|fino a 5\|Max 5" index.html event.html admin.html js/`. Oggi sono:
   - `index.html`: sottotitolo `#home-sub` e passo 2 del modal; `js/events-list.js`: stringa `DEFAULT_SUB`;
   - `event.html`: nota `#proposals-note` (il JS la riscrive con `MAX_FILMS`, ma il valore iniziale è nell'HTML) e passo 2 del modal;
   - `admin.html`: "Fino a 5 film per persona" (+ descrizione sotto), "Aggiungi i tuoi film (Max 5)" nell'anteprima e passo 2 del modal.
   Il modal è duplicato nelle 3 pagine. In JS (`event-pre.js`, `events-list.js`) il numero viene già da `MAX_FILMS`.
4. Ripubblica le regole (vedi `cineserata-firestore`) **prima** di mettere online il frontend.
5. Verifica: aggiungi film fino al limite (il form sparisce), prova da console una scrittura oltre il limite → `permission-denied`; controlla il CTA in Bacheca ("Hai proposto N/MAX").

## Altri limiti nelle regole (non in site-config)
nickname ≤ 30, nota film ≤ 200, titolo film ≤ 120, `picks` ≤ 50 voti, `avatar` ≤ 16, `snack` ≤ 20. Se li cambi, cambia anche i `maxlength` degli input: in HTML per `#participant-name`/`#live-nickname` (30) e `#event-title` (60); nel JS per titolo e nota film (template `filmForm` in `js/event-pre.js`).

## Limiti lato admin/copertine (solo codice, nessuna regola)
`js/admin.js`: descrizione ≤ 1000, luogo ≤ 200, `coverUrl` ≤ 500 se URL esterno (le copertine locali `background_img/<file>` seguono `COVER_PATH_RE`). Peso consigliato delle copertine del sito: < 400 KB, 1600 px di larghezza (vedi `cineserata-cover-images`).

---
name: cineserata-limits
description: Cambiare i limiti numerici di CineSerata (max film per persona, lunghezza titolo, minuti del "+15m", film per pagina in LIVE) mantenendo codice e regole Firestore allineati.
---

# Limiti e costanti numeriche

| Costante (`js/site-config.js`) | Effetto | Regole Firestore da allineare |
|---|---|---|
| `MAX_FILMS` (5) | slot proposte, barre/contatori in PRE, testi "fino a 5" | **Sì**: `validFilms` in `firestore.rules` è scritto per 5 (`films.size() <= 5` + 5 righe `validFilm(films[0..4])`) |
| `TITLE_MAX` (60) | validazione titolo e contatore in admin | **Sì**: `title.size() <= 60` nella regola `events` |
| `REVEAL_POSTPONE_MIN` (15) | minuti del bottone "Modifica orario reveal" | No. Aggiorna anche il testo del bottone in `admin.html` (`#btn-edit-reveal`) |
| `LIVE_PAGE_SIZE` (6) | film mostrati per pagina in LIVE ("Carica gli altri") | No |

## Cambiare MAX_FILMS (es. 3 o 8)
1. `site-config.js`: nuovo valore.
2. `firestore.rules`: aggiorna `films.size() <= N` e aggiungi/togli le righe `(films.size() < k || validFilm(films[k-1]))` (le regole non hanno cicli). Aggiorna anche il campo `filmCount` se necessario (è già legato a `films.size()`).
3. Testi fissi con il numero 5: `grep -rn "5 film\|fino a 5\|/5\|x5\|Max 5" *.html js/` (HTML: banner, etichetta "Fino a 5 film per persona" in `admin.html`, PRE; JS: `"{n}/5 film"` in lista partecipanti, ecc.) e sostituiscili con il nuovo valore o con `MAX_FILMS`.
4. Ripubblica le regole (vedi `cineserata-firestore`) **prima** di mettere online il frontend.
5. Verifica: aggiungi film fino al limite (il form sparisce), prova da console una scrittura oltre il limite → `permission-denied`.

## Altri limiti nelle regole (non in site-config)
nickname ≤ 30, nota film ≤ 200, titolo film ≤ 120, `picks` ≤ 50 voti, `avatar` ≤ 16, `snack` ≤ 20. Se li cambi, cambia anche i `maxlength` degli input: in HTML per `#participant-name`/`#live-nickname` (30) e `#event-title` (60); nel JS per titolo e nota film (template `filmForm` in `js/event-pre.js`).

Il "5" è scritto a mano anche in: `js/event-pre.js` (etichette "x/5 film" nella lista partecipanti, ~righe 494-500, e placeholder slot) e `admin.html` (righe con "Fino a 5 film per persona" e "Aggiungi i tuoi film (Max 5)"). Non sono legati a `MAX_FILMS`.

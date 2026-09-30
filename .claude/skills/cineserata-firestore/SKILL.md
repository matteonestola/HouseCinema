---
name: cineserata-firestore
description: Modificare schema dati o firestore.rules di CineSerata (nuovi campi, limiti, admin UID) in modo sicuro e ripubblicare le regole.
---

# Schema e regole Firestore

File: `firestore.rules`. Schema descritto in `cineserata-map`. Regole attuali (riassunto):
- `events`: lettura se `status == published` (assente = published) o admin; scrittura solo admin, con titolo 1..60, `startAt` timestamp, `status` in `draft|published`.
- `participants/{uid}`: lettura pubblica; scrive solo il proprietario, campi ammessi `nickname, avatar, snack, filmCount, joinedAt, updatedAt`, `filmCount == getAfter(proposals/{uid}).films.size()` (quindi **sempre batch** con `proposals`).
- `proposals/{uid}`: lettura solo proprietario **o dopo `startAt`**; scrittura proprietario, max 5 film validi; dopo `startAt` i film non sono più modificabili.
- `votes/{uid}`: lettura dopo `startAt`; scrittura proprietario, solo dopo `startAt`, senza `screening`, e solo se partecipante.

## Regole d'oro
1. **Non indebolire** il vincolo "film altrui visibili solo da `startAt`" né "solo admin scrive eventi".
2. Ogni campo nuovo su un documento con `hasOnly([...])` (participants, proposals, votes) va aggiunto alla lista, altrimenti la scrittura fallisce con `permission-denied`.
3. `ADMIN_UID` deve essere identico in `firestore.rules` (funzione `isAdmin`) e `js/site-config.js`.
4. Le query client devono rispettare le regole: niente `getDocs(proposals)` prima di `startAt`; bacheca filtra per `status == 'published'`.
5. Nessun indice composto: ordina lato client.

## Procedura
1. Modifica `firestore.rules` **e** il codice che scrive/legge (vedi skill di sezione).
2. Controlla la sintassi nel Rules Playground / editor della Console Firebase (Firestore → Regole) prima di pubblicare.
3. **Pubblica le regole dalla Console** (Firestore → Regole → incolla → Pubblica). Non c'è deploy automatico dal repo: ricordalo all'utente.
4. Ordine sicuro: regole retro-compatibili prima, frontend dopo.
5. Verifica con due profili (admin + anonimo) e prove da console del browser (`addDoc` da anonimo → `permission-denied`; lettura `proposals` altrui prima di `startAt` → `permission-denied`). Vedi `cineserata-verify`.

Nuovi campi sui film (es. anno/regista): estendi `validFilm` (`hasOnly` + tipo + lunghezza), `normalizeFilms` in `js/app.js`, `filmCard`/`filmForm`/`buildFilm` in `event-pre.js` e `movieCard` in `event-live.js`.

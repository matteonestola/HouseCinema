---
name: cineserata-edit-admin
description: Modificare il pannello admin (admin.html + js/admin.js): login, form evento, bozze, gestione, invito/QR, +15m, eliminazione, anteprima live.
---

# Admin (`admin.html` + `js/admin.js`)

## Accesso
`onAuthStateChanged`: solo utente email non anonimo **con UID == `ADMIN_UID`** (`isAdminUser`, `js/app.js`) vede `#admin-panel`; altri utenti email vengono disconnessi con "Account non autorizzato". Login: `#email`, `#password`, `#login-btn`, errori in `#login-error`. La vera protezione è nelle regole, non nella UI.

## Sezioni → funzioni
- **Tab** `#tab-create` / `#tab-manage` → `setMode('create'|'manage')`; selettore evento `#manage-event-select` (`renderSelect`, `selectEvent`).
- **Form** `#cinema-event-form`: titolo, genere (`#category-chips`, vedi `cineserata-genres`), copertina: campo URL `#event-cover-url` **e** galleria `#cover-gallery` (miniature dei file di `background_img/`, vedi sotto e `cineserata-images`), data `#event-date`, ora `#event-time`, luogo, descrizione. `readForm` → `validateForm` → `saveEvent(status)` (`addDoc`/`updateDoc`, status `published` o `draft`). Pulsanti `#btn-publish`, `#btn-draft` (etichette da `setLabels`).
- **Gestione** `#management-section`: link invito `#invite-link-input` (`inviteUrl`), WhatsApp/Telegram (`invite-wa`, `invite-tg`), QR `#qr-modal` (servizio esterno `api.qrserver.com`), `#btn-edit-reveal` → `postponeReveal` (+`REVEAL_POSTPONE_MIN`), `#btn-delete-event` → modale → `deleteEventCascade`.
- **Galleria copertine**: `loadCoverGallery()` (chiamata da `bindForm`) legge `background_img/manifest.json` (generato dal workflow di deploy; in locale va rigenerato con `node .claude/skills/cineserata-cover-images/scripts/update-manifest.js`), `renderCoverGallery()` crea le tile (bottoni `data-path`), il click scrive il percorso `background_img/<file codificato>` in `#event-cover-url` e chiama `updatePreview`; `markCoverGallery()` evidenzia la tile attiva (`aria-pressed`). `validateForm` accetta URL `http(s)://` ≤ 500 car. oppure un percorso che rispetta `COVER_PATH_RE`. Messaggi: etichetta "Dal sito: nome" (`coverDomain`) e "File non trovato in background_img/…" se il file manca. Per aggiungere/togliere file: skill `cineserata-cover-images`.
- **Anteprima** colonna destra → `updatePreview` (titolo, data, ora "Reveal alle", luogo, badge genere, cover, countdown, conteggi reali).
- **Toast** `#toast` (`showToast`).

## Aggiungere un campo all'evento (checklist)
1. Input in `admin.html` (copia il markup di `#event-location`) con id nuovo.
2. `js/admin.js`: `readForm`, `validateForm`, `fillForm`, `resetForm`, payload in `saveEvent` (attenzione: create e update), `updatePreview` se va in anteprima.
3. Mostralo dove serve (`events-list.js`, `event-pre.js`).
4. `firestore.rules`: le regole `events` non usano `hasOnly`, ma se vuoi validare il campo aggiungilo; ripubblica (vedi `cineserata-firestore`).
5. Verifica: crea, salva come bozza, riapri da "Gestisci", pubblica.

## Note
- `backfillLegacyEvents` (al primo login) aggiunge `status/genre/location/coverUrl/hostName` agli eventi vecchi.
- `deleteEventCascade` cancella partecipanti/proposte/voti **per uid dei partecipanti** (l'admin non può leggere le proposte prima dell'inizio) poi l'evento, in batch ≤ 450 operazioni.
- Gli id duplicati tra pagine non esistono: anteprima usa `preview-*`.
- Come per le altre pagine, header/footer/bottom-nav/modal "Come Funziona" sono duplicati: `admin.html` ha anche `#footer-area-host` e le voci Organizza nascoste ai non admin (qui sono il punto d'ingresso del login: l'host ci arriva da "Area host" o digitando `admin.html`).

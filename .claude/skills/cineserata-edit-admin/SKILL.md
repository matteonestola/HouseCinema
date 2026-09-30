---
name: cineserata-edit-admin
description: Modificare il pannello admin (admin.html + js/admin.js): login, form evento, bozze, gestione, invito/QR, +15m, eliminazione, anteprima live.
---

# Admin (`admin.html` + `js/admin.js`)

## Accesso
`onAuthStateChanged`: solo utente email non anonimo **con UID == `ADMIN_UID`** (`isAdminUser`, `js/app.js`) vede `#admin-panel`; altri utenti email vengono disconnessi con "Account non autorizzato". Login: `#email`, `#password`, `#login-btn`, errori in `#login-error`. La vera protezione è nelle regole, non nella UI.

## Sezioni → funzioni
- **Tab** `#tab-create` / `#tab-manage` → `setMode('create'|'manage')`; selettore evento `#manage-event-select` (`renderSelect`, `selectEvent`).
- **Form** `#cinema-event-form`: titolo, genere (`#category-chips`, vedi `cineserata-genres`), copertina URL `#event-cover-url` (vedi `cineserata-images`), data `#event-date`, ora `#event-time`, luogo, descrizione. `readForm` → `validateForm` → `saveEvent(status)` (`addDoc`/`updateDoc`, status `published` o `draft`). Pulsanti `#btn-publish`, `#btn-draft` (etichette da `setLabels`).
- **Gestione** `#management-section`: link invito `#invite-link-input` (`inviteUrl`), WhatsApp/Telegram (`invite-wa`, `invite-tg`), QR `#qr-modal` (servizio esterno `api.qrserver.com`), `#btn-edit-reveal` → `postponeReveal` (+`REVEAL_POSTPONE_MIN`), `#btn-delete-event` → modale → `deleteEventCascade`.
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

---
name: cineserata-avatars
description: Aggiungere, togliere o cambiare gli avatar selezionabili dai partecipanti in CineSerata: emoji base, "Avatar Speciali" e avatar a immagine (file in assets/avatars/, ritaglio quadrato incluso).
---

# Avatar selezionabili

Sorgente unica: `js/site-config.js`. Una voce è **un'emoji** o **un'immagine**:
- `AVATARS = [{ emoji, title }]` → bottoni base (PRE e join tardivo). Il **primo** è il default di chi non ne sceglie uno (`AVATARS[0].emoji`).
- `SPECIAL_AVATARS = [{ emoji, label }]` oppure `{ id, image, label }` → "Avatar Speciali": nella vista PRE (`#special-avatars`) **e**, dal join tardivo LIVE, insieme ai base.
  - Voce **emoji**: `emoji` è il valore salvato.
  - Voce **immagine**: `id` è il valore salvato (solo `[a-z0-9-]`, **max 16 caratteri**: limite di `firestore.rules`), `image` è il percorso del file (`assets/avatars/<id>.jpg`, quadrato ~192 px, ~10-20 KB). Oggi: `iron-chicken` (Iron Chicken), `tacchino` (Tacchino Mistico), `gattonauta` (Gattonauta).
  - Una voce immagine funziona anche in `AVATARS` (stesse chiavi).

## Come si usano
- Chiave e HTML: `avatarKey(a)` (= `a.id || a.emoji`) e `avatarHtml(valore, classeImg?)` in `js/app.js`. `avatarHtml` restituisce un `<img>` se il valore è l'id di un'immagine, altrimenti il testo dell'emoji; un id non più in elenco ricade sull'emoji di default (non si mostra mai l'id come testo). Va messo **dentro un contenitore con `overflow-hidden`** e forma (tondo o `rounded-xl`).
- PRE: `renderAvatars()` in `js/event-pre.js` (`#avatar-selector`, `#special-avatars`, etichetta `#avatar-active-label`, tile speciali 32 px con `SPECIAL_TONES` ciclico). Lista "Chi viene stasera": `renderParticipants()` (stesso file, 3 riquadri tondi con `${avatar}`).
- LIVE: `renderLateAvatars()` in `js/event-live.js` (`#live-avatar-selector`) mostra base + speciali; `voterAvatars()` per i votanti dello spotlight.
- Bacheca: chip dei partecipanti in `renderFeatured` (`js/events-list.js`, `h-5 w-5 rounded-full`; senza avatar compare un pallino ambra).
- L'avatar scelto viene salvato in `participants/{uid}.avatar`.

## Aggiungere un avatar emoji
1. Aggiungi la voce in `site-config.js` (un emoji; `title`/`label` sono il testo accessibile e l'etichetta "X attivo"). Nessuna modifica HTML: i bottoni sono generati dal JS.
2. Vincolo regole: `avatar` ≤ **16** caratteri (`firestore.rules`, riga `avatar ... size() <= 16`). Emoji composte (ZWJ, bandiere, tono pelle) possono superare il limite: preferisci emoji singole o alza il limite (e ripubblica le regole, vedi `cineserata-firestore`).

## Aggiungere un avatar a immagine
1. Scegli l'**id** (`[a-z0-9-]`, ≤ 16 caratteri, unico) e il testo (`label`).
2. Ritaglia l'immagine in un quadrato 192×192 centrato sul **volto/soggetto** (nei cerchi da 20-36 px conta solo quello):
   ```
   powershell -ExecutionPolicy Bypass -File .claude/skills/cineserata-avatars/scripts/make-avatar.ps1 -Source "<percorso>" -Id <id> [-X <px> -Y <px> -Size <px>]
   ```
   Senza `-X/-Y/-Size` ritaglia il quadrato centrale più grande; con i tre valori scegli il riquadro nei pixel dell'originale. Salva `assets/avatars/<id>.jpg`. **Guarda il risultato** (Read sul file) e se il volto è tagliato o decentrato rilancia con un altro riquadro.
3. Aggiungi la voce `{ id, image: "assets/avatars/<id>.jpg", label }` a `SPECIAL_AVATARS` (o `AVATARS`).
4. Nessun cambiamento alle regole (l'id sta in 16 caratteri) né all'HTML.
5. Verifica: in un evento non iniziato la tile compare tra gli speciali, la scelta resta dopo "Conferma Partecipazione" e refresh, l'immagine appare nella lista partecipanti e nei chip della Bacheca; nel join tardivo (serata live) è tra i bottoni.

## Togliere un avatar
Sicuro: chi lo aveva salvato continua a vederlo se è un'emoji; per un'immagine tolta dall'elenco, `avatarHtml` mostra l'emoji di default (e l'etichetta "attivo" sparisce), ma il file in `assets/avatars/` può restare o essere cancellato. Non può più essere riselezionato.

## Verifica
Apri un evento non iniziato, controlla la griglia (base e speciali), scegli un avatar, "Conferma Partecipazione", ricarica: deve restare selezionato. Controlla anche lista partecipanti, Bacheca e join tardivo.

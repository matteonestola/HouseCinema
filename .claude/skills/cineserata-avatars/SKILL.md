---
name: cineserata-avatars
description: Aggiungere, togliere o cambiare gli avatar selezionabili dai partecipanti (emoji base e "Avatar Speciali") in CineSerata.
---

# Avatar selezionabili

Sorgente unica: `js/site-config.js`.
- `AVATARS = [{ emoji, title }]` → bottoni base. Il **primo** è il default di chi non ne sceglie uno (`AVATARS[0].emoji`).
- `SPECIAL_AVATARS = [{ emoji, label }]` → bottoni "Avatar Speciali", **solo** nella vista PRE di `event.html`.

## Come si usano
- PRE: `renderAvatars()` in `js/event-pre.js` (`#avatar-selector`, `#special-avatars`, etichetta `#avatar-active-label`). Colori dei riquadri speciali: array `SPECIAL_TONES` (ciclico).
- LIVE (join tardivo): `renderLateAvatars()` in `js/event-live.js` (`#live-avatar-selector`) usa **solo** `AVATARS`.
- L'emoji scelta viene salvata in `participants/{uid}.avatar` e mostrata in lista partecipanti, spotlight, ecc.

## Procedura
1. Modifica gli array in `site-config.js` (un emoji per voce; `title`/`label` sono il testo accessibile e l'etichetta "X attivo").
2. Nessuna modifica HTML: i bottoni sono generati dal JS.
3. Vincolo regole: `avatar` ≤ **16** caratteri in `firestore.rules` (riga `avatar ... size() <= 16`). Emoji composte (ZWJ, bandiere, tono pelle) possono superare il limite: preferisci emoji singole o alza il limite nelle regole (e ripubblicale, vedi `cineserata-firestore`).
4. Togliere un avatar è sicuro: chi lo aveva già salvato continua a vederlo (si legge da `p.avatar`), ma non può più riselezionarlo e l'etichetta "attivo" sparisce.
5. Verifica: apri un evento non iniziato, controlla la griglia, scegli un avatar, "Conferma Partecipazione", ricarica: deve restare selezionato.

Se vuoi avatar speciali anche nel join tardivo LIVE, estendi `renderLateAvatars()` (non c'è markup speciale nella card LIVE).

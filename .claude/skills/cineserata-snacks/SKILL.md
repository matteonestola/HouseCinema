---
name: cineserata-snacks
description: Modificare le opzioni "Porto qualcosa da bere/sgranocchiare" (snack) dei partecipanti in CineSerata.
---

# Snack

Sorgente unica: `SNACKS` in `js/site-config.js`: `{ id, label, short }`.
- `label` = testo nella select `#snack-selection` (con emoji).
- `short` = testo breve in lista "Chi viene stasera" e nel messaggio di conferma (`snackShort(id)` in `js/app.js`).
- `id` = valore salvato in `participants/{uid}.snack`. **Non rinominare** l'id di un'opzione esistente: i dati già salvati non verrebbero più risolti in `short` (la riga mostrerebbe vuoto). Per cambiare solo il testo, modifica `label`/`short`.

## Uso
Select generata da `buildSnacks()` in `js/event-pre.js`; il default è la prima opzione. Elenco partecipanti: `renderParticipants()` (stesso file). Se un partecipante ha `snack: "solo_presenza"` il messaggio di conferma omette la parte snack (controlla `submitJoin`).

## Procedura
1. Modifica `SNACKS` (aggiungi/togli/riordina). Nessun HTML da toccare.
2. Vincolo regole: `snack` ≤ **20** caratteri (`firestore.rules`, riga `snack ... size() <= 20`). Usa id brevi tipo `dolci`, non frasi.
3. Se rimuovi `solo_presenza` o cambi la sua logica, aggiorna il controllo in `submitJoin` (`js/event-pre.js`).
4. Il testo "Sorpresa golosa a tema" è volutamente generico perché il genere varia.
5. Verifica: entra in un evento, scegli uno snack, conferma, controlla il testo nella sidebar e dopo refresh.

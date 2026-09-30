---
name: cineserata-genres
description: Aggiungere, rimuovere o rinominare i generi/temi degli eventi (chip "Tema • Genere Principale" dell'admin, badge e tag) in CineSerata.
---

# Generi evento

Il genere è salvato in `events/{id}.genre` come **id testuale** (es. `"Horror"`), non come riferimento.

## Dove vive (DUE posti da tenere allineati)
1. `GENRES = [{ id, emoji }]` in `js/site-config.js` → usato da `genreEmoji(id)` (`js/app.js`) per badge e anteprima. Fallback emoji `🍿` se l'id non esiste.
2. **Chip hardcoded** in `admin.html` dentro `#category-chips`: ogni `<button class="chip-item" data-cat="ID">EMOJI ID</button>`. Il JS (`setGenre`, `bindForm` in `js/admin.js`) legge `data-cat`. Il primo chip porta le classi `active ...`; gli altri le classi inattive: copia un chip inattivo esistente per aggiungerne uno.

## Procedura: aggiungere un genere
1. Aggiungi `{ id: "Thriller", emoji: "🔪" }` a `GENRES`.
2. In `admin.html` duplica un chip inattivo in `#category-chips`, imposta `data-cat="Thriller"` e il testo `🔪 Thriller`.
3. Verifica in admin: il chip si seleziona, il badge dell'anteprima mostra emoji+nome; pubblica un evento e controlla il tag `#Thriller` nel dettaglio (`tagOf` in `js/event-pre.js`) e il badge in bacheca.

## Rinominare / rimuovere
- Gli eventi già creati mantengono il vecchio id: dopo un rename compaiono col badge `🍿` (nome invariato). Per migrare, aggiorna `genre` sugli eventi in Console Firestore.
- Il genere di default di un nuovo evento e del backfill è `"Horror"` (`let genre` e `backfillLegacyEvents` in `js/admin.js`): cambialo lì se rimuovi Horror.
- Nessun vincolo nelle regole sul valore di `genre`.

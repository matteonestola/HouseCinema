---
name: cineserata-verify
description: Verificare una modifica a CineSerata prima del commit: avvio locale, controlli statici, prove funzionali con profili admin/anonimi, e procedura branch/PR.
---

# Verifica e rilascio

## Controlli statici (sempre)
- Sintassi: `node --check js/<file>.js` per ogni modulo toccato.
- Id: ogni `$("id")`/`getElementById` nel JS esiste nell'HTML della pagina, nessun id duplicato (`grep -o 'id="[^"]*"' pagina.html | sort | uniq -d`).
- Testi demo residui: `grep -rniE "Marco|Leo\b|Giulia|Notte Horror" index.html event.html admin.html js/` → nessun risultato.
- Se hai toccato header/footer/nav: stessa modifica nelle 3 pagine.

## Avvio locale
`python -m http.server 8000` dalla radice, poi `http://localhost:8000`. (Non aprire i file con doppio clic: i moduli ES non caricano.) Console senza errori salvo l'avviso Tailwind CDN. Controlla 1280px e 390px; riferimenti grafici in `design/stitch/*.png`.

## Profili di prova
A = admin (login email), B e C = finestre in incognito (anonimi), D = quarto profilo non partecipante. Crea un evento con inizio tra ~5 minuti per provare il reveal.

## Checklist mirata (scegli le righe pertinenti)
- Bacheca: eventi caricati, filtri e conteggi, `?filter=completed`, ticker.
- Join (nickname, avatar, snack), refresh → stato partecipante.
- Limite film; modifica/cancella; prove da console fuori limite → `permission-denied`.
- Film nascosti prima di `startAt` (C non legge `proposals` altrui); reveal automatico; modifica film dopo l'inizio rifiutata.
- Voto, toggle, non partecipante disabilitato, join tardivo, roulette.
- Avvia proiezione (solo admin) → evento in "Concluse".
- Admin: bozza non visibile a B, +15m, invito/WhatsApp/Telegram/QR, eliminazione a cascata (controlla la Console Firestore).

## Git
Lavora su un branch (`claude/<tema>`), commit piccoli; non fare push/merge su `main` senza richiesta esplicita. Se hai cambiato `firestore.rules`, ricorda all'utente di **ripubblicarle in Console Firebase** prima/insieme al merge. Il sito si aggiorna da GitHub Pages dopo il merge su `main`; dopo il deploy prova dal dominio pubblico (il dominio `*.github.io` deve essere tra i domini autorizzati in Firebase Authentication).

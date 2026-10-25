---
name: cineserata-verify
description: Verificare una modifica a CineSerata prima del commit: avvio locale (anche con Firestore simulato), controlli statici e detector di design, prove funzionali con profili admin/anonimi, e procedura branch/PR.
---

# Verifica e rilascio

## Controlli statici (sempre)
- Sintassi: `node --check js/<file>.js` per ogni modulo toccato.
- Id: ogni `$("id")`/`getElementById` nel JS esiste nell'HTML della pagina, nessun id duplicato (`grep -o 'id="[^"]*"' pagina.html | sort | uniq -d`).
- Testi demo residui: `grep -rniE "Marco|Leo\b|Giulia|Notte Horror" index.html event.html admin.html js/` → nessun risultato.
- Se hai toccato header/footer/nav/modal: stessa modifica nelle 3 pagine.
- Design: `.claude/skills/impeccable/scripts/impeccable.cmd detect --json index.html` (o la pagina toccata). Restano accettati solo gli advisory noti (colore `rgb(0,0,0)` su "CineSerata", `text-[10px]/[22px]/[28px]`); gli ignore concordati stanno in `.impeccable/config.json`. Per un giudizio di design: `/impeccable critique index.html` (le snapshot sono in `.impeccable/critique/`).

## Avvio locale
Non c'è Python su questa macchina: `npx --yes http-server . -p 8000 -c-1` dalla radice, poi `http://localhost:8000` (non aprire i file con doppio clic: i moduli ES non caricano). `js/firebase-config.js` nel repo ha solo segnaposto (lo genera il deploy): in locale Firestore non risponde, quindi la Bacheca mostra "Carico la serata…" e dopo 10 s l'errore con "Riprova". Per provare con dati veri compila quel file con il tuo progetto Firebase (non committarlo). Console senza errori salvo l'avviso Tailwind CDN. Controlla 1280px e 390px; riferimenti grafici in `design/stitch/*.png`.

### Anteprima con Firestore simulato (senza Firebase)
Per vedere la card Caveau, i 3 stati del CTA, il live e gli errori: copia `index.html`, `css/`, `js/`, `assets/` in una cartella **fuori dal repo**, sostituisci in `js/events-list.js` l'import di `firebase-firestore.js` con un modulo locale che esporta `collection`, `query`, `where`, `onSnapshot` (restituisce eventi e partecipanti finti dopo ~150 ms) e fai leggere lo scenario da query string (`?phase=live|soon|far`, `?stats=fail|slow`, `?me=<uid>`). Per il mobile usa una pagina con un `<iframe width="390">` (il browser di test non sempre ridimensiona la finestra). Per l'admin: copia `admin.html` e `js/`, `background_img/` con immagini d'esempio e forza `#admin-panel` visibile. Ferma il server e cancella la copia a fine prova.

## Profili di prova
A = admin (login email), B e C = finestre in incognito (anonimi), D = quarto profilo non partecipante. Crea un evento con inizio tra ~5 minuti per provare il reveal.

## Checklist mirata (scegli le righe pertinenti)
- Bacheca: caricamento/errore, nessuna serata, serata futura (CTA per non iscritto e per iscritto con "Hai proposto N/5"), serata live (rosso, "Entra & Vota"), lettura partecipanti lenta/fallita, "Altre serate", Vota disattivato fuori dal live, Organizza visibile solo da admin, "Area host" in footer.
- Tab Serata: filtri e conteggi, `?filter=completed`.
- `#proponi` da Bacheca porta al modulo di partecipazione in PRE; `#vota` alla griglia in LIVE.
- Join (nickname, avatar, snack), refresh → stato partecipante.
- Limite film; modifica/cancella; prove da console fuori limite → `permission-denied`.
- Film nascosti prima di `startAt` (C non legge `proposals` altrui); reveal automatico; modifica film dopo l'inizio rifiutata.
- Voto, toggle, non partecipante disabilitato, join tardivo, roulette.
- Avvia proiezione (solo admin) → evento in "Concluse".
- Admin: bozza non visibile a B, +15m, invito/WhatsApp/Telegram/QR, eliminazione a cascata (controlla la Console Firestore); copertina da galleria (`#cover-gallery`) e da URL, anteprima, salvataggio e riapertura da "Gestisci".
- Modal "Come Funziona": non si apre da solo, si apre da footer e da nota CTA, Esc/X/sfondo, focus.
- Accessibilità di base: `prefers-reduced-motion`, focus visibile, bersagli ≥ 44px.

## Git
Lavora su un branch (`claude/<tema>`), commit piccoli, PR verso `main` (merge commit). Non fare push/merge su `main` senza richiesta esplicita; l'auto-merge **non è abilitato** sul repo (`gh pr merge --auto` fallisce): il merge si fa a mano o con `gh pr merge <n> --merge` dopo conferma. L'unica automazione che committa/pusha/mergia da sola (dopo conferma) è la skill `cineserata-cover-images`. Se hai cambiato `firestore.rules`, ricorda all'utente di **ripubblicarle in Console Firebase** prima/insieme al merge. Il sito si aggiorna da GitHub Pages dopo il merge su `main` (il workflow genera anche `background_img/manifest.json`; controlla il log); dopo il deploy prova dal dominio pubblico (il dominio `*.github.io` deve essere tra i domini autorizzati in Firebase Authentication). Gli avvisi "LF will be replaced by CRLF" sono innocui (`.gitattributes: * text=auto`).

---
name: cineserata-texts
description: Cambiare nome sito, nome dell'host, testi fissi (hero, footer, menu, claim, title delle pagine) e link di navigazione di CineSerata.
---

# Testi, brand e navigazione

## Costanti in `js/site-config.js`
- `SITE_NAME`: costante **non usata da nessun modulo**. Il nome "CineSerata" è scritto a mano in HTML e JS: cambiarla non ha effetto.
- `HOST_NAME` → "Host" mostrato in chip utente (`layout.js`), card evento/dettaglio, anteprima admin, nota spotlight. Gli eventi già creati hanno `hostName` salvato: per cambiarlo su di essi aggiorna il campo in Firestore.
- `ADMIN_UID` → non è un testo: vedi `cineserata-firestore`.

## Testi hardcoded (da cambiare a mano nell'HTML, in TUTTE le pagine interessate)
- Brand "CineSerata" nel `<title>`, header, footer (`index.html`, `event.html`, `admin.html`) e label admin ("Stanza Regia • CineSerata Club", "Standard CineSerata"). Cerca con `grep -rn "CineSerata" *.html js/`.
- Header: ticker `#top-ticker`, nav desktop (`data-nav="serate|archivio"`), CTA "Organizza Serata", chip `#user-chip`. Footer: claim, nav, copyright `#footer-year`, "Secret Reveal Engine attivo". Bottom-nav mobile (Bacheca/Serata/Vota/Organizza).
- Hero e "Come Funziona" (`#come-funziona`), callout host: solo `index.html`.
- Link: "Archivio Film Visti" → `index.html?filter=completed`; "Come Funziona" → `index.html#come-funziona`; logo → `index.html`.

## Testi generati da JS
Sono nei moduli (`events-list.js`, `event-pre.js`, `event-live.js`, `admin.js`, `layout.js`) come stringhe/template; cerca la frase con `grep -rn "frase" js/`. Toast: `showToast("…")`. Date in italiano: formattatori in `js/app.js` (`formatMetaDate`, `formatCardDate`, `formatLongDate`, …).

## Regole
- Mantieni il markup/classi Stitch: cambia solo il testo dentro i tag.
- Se cambi un testo presente in header/footer/nav, replicalo nelle 3 pagine.
- Italiano ovunque; niente dati demo (nomi finti, numeri inventati).
- Font/colori/spaziature non si toccano qui: sono in `js/tailwind-config.js` (token) e nelle classi.
- Verifica: apri le 3 pagine a 1280px e 390px.

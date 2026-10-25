---
name: cineserata-texts
description: Cambiare nome sito, nome dell'host, testi fissi (hero, footer, menu, claim, title delle pagine) e link di navigazione di CineSerata.
---

# Testi, brand e navigazione

Il nome ufficiale è **CineSerata** ("Matteo's Cinema" è solo il nome del progetto Stitch di origine). Voce, tono e copy vanno coerenti con `PRODUCT.md` (amici, giocoso, italiano, niente linguaggio aziendale) e `DESIGN.md`.

## Costanti in `js/site-config.js`
- `SITE_NAME`: costante **non usata da nessun modulo**. Il nome "CineSerata" è scritto a mano in HTML e JS: cambiarla non ha effetto.
- `HOST_NAME` → nome host mostrato in chip utente (`layout.js`), "Organizzata da …" e nota "{HOST} la annuncia in chat" in Bacheca, anteprima admin, nota spotlight. Gli eventi già creati hanno `hostName` salvato: per cambiarlo su di essi aggiorna il campo in Firestore.
- `ADMIN_UID` → non è un testo: vedi `cineserata-firestore`.

## Testi hardcoded (da cambiare a mano nell'HTML, in TUTTE le pagine interessate)
- Brand "CineSerata" nel `<title>`, header, footer (`index.html`, `event.html`, `admin.html`) e label admin ("Stanza Regia • CineSerata Club", "Standard CineSerata"). Cerca con `grep -rn "CineSerata" *.html js/`.
- Header: ticker `#top-ticker` (non mostrato in Bacheca), nav desktop ("Tutte le Serate" → `event.html`, "Archivio Film Visti" → `event.html?filter=completed`), link "Organizza" `#header-organizza` (solo admin), chip `#user-chip`.
- Footer: descrizione (nascosta sotto `md`), nav (Tutte le Serate, Archivio, "Come Funziona" `data-open-modal="come-funziona"`, "Nuova Serata" `#footer-organizza` solo admin), copyright "© `#footer-year` CineSerata", link discreto **"Area host"** `#footer-area-host` → `admin.html` (ingresso dell'host al login).
- Bottom-nav mobile: Bacheca / Serata / Vota / Organizza (`#mobile-nav-organizza` solo admin).
- Modal "Come Funziona": 3 passi dal punto di vista dell'ospite, **replicati in tutte e 3 le pagine**.
- Hero e testi della Bacheca: `index.html` (`h1`, `#home-sub`, card, nota `#featured-note`); il sottotitolo di default e quello "live" sono anche in `js/events-list.js` (`DEFAULT_SUB`, ramo `live`).
- Admin: label e testi del form in `admin.html`; la frase "Regola del Secret Reveal Engine" nel form è testo per l'host.
- Link: logo → `index.html`; "Come Funziona" non ha più un'ancora: apre il modal.

## Testi generati da JS
Sono nei moduli (`events-list.js`, `events-browse.js`, `event-pre.js`, `event-live.js`, `admin.js`, `layout.js`) come stringhe/template; cerca la frase con `grep -rn "frase" js/`. Esempi: etichette di stato "Oggi/Domani/Fra N giorni/In corso ora" (`statusLabel`), CTA della card, messaggi di caricamento/errore, `aria-label` di "Vota". Toast: `showToast("…")`. Date in italiano: formattatori in `js/app.js` (`formatMetaDate`, `formatCardDate`, `formatLongDate`, …).

## Regole
- Mantieni il markup/classi Stitch: cambia solo il testo dentro i tag.
- Se cambi un testo presente in header/footer/nav/modal, replicalo nelle 3 pagine.
- Italiano ovunque; niente dati demo (nomi finti, numeri inventati, testimonianze).
- Un solo verbo per azione ("Proponi i tuoi film"), niente gergo non spiegato ("Secret Reveal Engine" è stato tolto dal footer per questo).
- Font/colori/spaziature non si toccano qui: sono in `js/tailwind-config.js` (token) e nelle classi.
- Verifica: apri le 3 pagine a 1280px e 390px.

---
name: cineserata-edit-home
description: Modificare la Bacheca (index.html): hero, serata in evidenza, filtri, card eventi, callout. Spiega come funziona e quali id/funzioni toccare.
---

# Bacheca (`index.html` + `js/events-list.js`)

La Bacheca mostra **solo** l'hero e la prossima serata (se esiste): niente più filtri/griglia di tutte le serate e niente più sezione "Come Funziona" in pagina (vedi sotto). L'elenco completo delle serate (filtri + griglia, incluso l'archivio `?filter=completed`) vive nel tab **Serata** (`event.html`, senza `?id=`) ed è gestito da `js/events-browse.js` — per modificarlo vedi quel file, non questo.

## Flusso
`subscribeEvents()` ascolta `events` con `where('status','==','published')` (le bozze e gli eventi senza `status` **non** compaiono finché l'admin non fa il backfill), ordina per `startAt` lato client, carica per evento le statistiche (`loadStats`: partecipanti, somma `filmCount`, nickname) **una volta per caricamento** (cache, non live) → `render()`.
`render()` = aggiorna `#stat-events-count` + `renderFeatured(item)`.

## Sezioni
- **Hero**: HTML statico, full width. `#stat-events-count` = numero eventi pubblicati. Il link "Come Funziona" non è più qui: è un modal condiviso, vedi sotto.
- **Serata in evidenza** `#serata-imminente`: primo evento non completato. Id `featured-*` (`cover`, `genre`, `host`, `date`, `title`, `desc`, `audience`, `participants`, `participants-label`, `lock-icon/title/count`, `countdown-box`, `cta-join`, `cta-details`) + cifre `#countdown-hours|minutes|seconds`. Se fase `live` mostra "Caveau Aperto" e nasconde il countdown. **Nessun evento in arrivo → sezione nascosta e la Bacheca resta con il solo hero** (comportamento voluto, non un bug).
- **Callout host**, CTA "Lancia una Serata Ora"/"Crea Serata Adesso" → `admin.html`.

## Modal "Come Funziona"
Markup `#come-funziona-modal` duplicato in `index.html`/`event.html`/`admin.html` come header/footer; logica in `initComeFunzionaModal()` (`js/layout.js`, chiamata da `initLayout()`). Si apre da solo a ogni caricamento pagina finché l'utente non spunta "Non mostrare più" (flag in `localStorage`); il link nel footer (`data-open-modal="come-funziona"`) lo riapre sempre. Per cambiare i testi dei 3 step, modifica il markup del modal in **tutte e 3** le pagine.

## Come modificare
- Testo/ordine dell'hero o della serata in evidenza → solo `index.html` (classi Stitch invariate).
- Contenuto della card "serata in evidenza" → `renderFeatured` in `js/events-list.js`.
- Griglia/filtri di tutte le serate (card, colori ciclici, filtro) → `js/events-browse.js` + `event.html#view-list` (skill `cineserata-edit-home` non copre più questa parte).
- Nuovo dato nella serata in evidenza → aggiungilo a `loadStats` o leggilo da `ev`; se è un campo nuovo dell'evento aggiorna admin (`cineserata-edit-admin`) e regole (`cineserata-firestore`).
- Non aggiungere letture `proposals` qui: prima di `startAt` sono vietate dalle regole.
- Verifica: Bacheca senza eventi (solo hero), con un evento in arrivo e con uno live; tab Serata con eventi in arrivo/live/conclusi, filtri, `?filter=completed`; modal Come Funziona (apertura automatica, checkbox "non mostrare più", riapertura da footer); 390px.

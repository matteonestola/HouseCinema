---
name: cineserata-edit-home
description: Modificare la Bacheca (index.html): hero, serata in evidenza, filtri, card eventi, callout. Spiega come funziona e quali id/funzioni toccare.
---

# Bacheca (`index.html` + `js/events-list.js`)

## Flusso
`subscribeEvents()` ascolta `events` con `where('status','==','published')` (le bozze e gli eventi senza `status` **non** compaiono finché l'admin non fa il backfill), ordina per `startAt` lato client, carica per evento le statistiche (`loadStats`: partecipanti, somma `filmCount`, nickname; per i completati anche i votanti) **una volta per caricamento** (cache, non live) → `render()`.
`render()` = `renderFeatured(item)` + `renderFilters(...)` + `renderGrid(withPhase)`.

## Sezioni
- **Hero + "Come Funziona"** (`#come-funziona`): HTML statico. `#stat-events-count` = numero eventi pubblicati.
- **Serata in evidenza** `#serata-imminente`: primo evento non completato. Id `featured-*` (`cover`, `genre`, `host`, `date`, `title`, `desc`, `audience`, `participants`, `participants-label`, `lock-icon/title/count`, `countdown-box`, `cta-join`, `cta-details`) + cifre `#countdown-hours|minutes|seconds`. Se fase `live` mostra "Caveau Aperto" e nasconde il countdown. Nessun evento → sezione nascosta.
- **Filtri** `#event-filters` (`.filter-btn[data-filter=all|upcoming|completed]`, `FILTERS` in alto al file; `?filter=` preseleziona). Conteggi scritti da `renderFilters`.
- **Griglia** `#events-grid`: template `renderEventCard(ev, stats, phase, index)` con due varianti (in arrivo/live e *completed*). Colori ciclici: `GENRE_TEXT`, `HOST_CIRCLE`, `DOT_COLORS`.
- **Callout host**, CTA "Lancia una Serata Ora"/"Crea Serata Adesso" → `admin.html`.

## Come modificare
- Testo/ordine di una sezione statica → solo `index.html` (classi Stitch invariate).
- Contenuto di una card → `renderEventCard` (attento a `escapeHtml`, e a `referrerpolicy="no-referrer"`/`onerror` sull'`<img>`).
- Nuovo dato in card → aggiungilo a `loadStats` o leggilo da `ev`; se è un campo nuovo dell'evento aggiorna admin (`cineserata-edit-admin`) e regole (`cineserata-firestore`).
- Nuovo filtro → aggiungi il bottone in `index.html`, valore in `FILTERS`, logica in `renderGrid`/`renderFilters`.
- Non aggiungere letture `proposals` qui: prima di `startAt` sono vietate dalle regole.
- Verifica: bacheca con un evento in arrivo, uno live e uno concluso; filtri; `?filter=completed`; 390px.

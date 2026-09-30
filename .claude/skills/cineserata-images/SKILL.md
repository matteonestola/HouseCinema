---
name: cineserata-images
description: Sostituire le immagini di default di CineSerata (logo, copertina predefinita) o cambiare come funzionano le copertine per evento.
---

# Immagini

## File di default
- `assets/img/logo.png` → logo in header (tutte e 3 le pagine, `<img alt="CineSerata Logo">`). Attenzione: il file originale Stitch è in realtà un **JPEG** con estensione `.png`; funziona, ma se lo sostituisci puoi usare un vero PNG/SVG mantenendo lo stesso nome (o aggiorna i 3 HTML).
- `assets/img/cover-default.jpg` → copertina usata quando un evento non ha `coverUrl` o l'immagine non si carica. Riferita da `DEFAULT_COVER` in `js/site-config.js` e dagli `src` iniziali di `#featured-cover` (`index.html`), `#pre-cover` (`event.html`), `#preview-cover-img`/`#cover-thumb-img` (`admin.html`).

## Sostituire un default
1. Sovrascrivi il file in `assets/img/` mantenendo nome ed estensione (più semplice), oppure cambia `DEFAULT_COVER` **e** gli `src` HTML citati sopra.
2. Formato copertina: orizzontale 16:10 / 4:3 (in bacheca `aspect-[16/10]`, nel dettaglio poster 2:3, `object-cover` ritaglia). Consigliato ≥ 1280×800, < 300 KB.
3. Cache: GitHub Pages/browser possono servire la vecchia immagine; ricarica forzata (Ctrl+F5) o rinomina il file e aggiorna i riferimenti.
4. Verifica su bacheca, dettaglio evento e anteprima admin.

## Copertina per singolo evento
- Campo `events/{id}.coverUrl` (URL `http(s)://`, ≤ 500 car.), impostato da `#event-cover-url` in admin. `coverOf(ev)` (`js/app.js`) ritorna `coverUrl || DEFAULT_COVER`.
- L'URL deve puntare **direttamente al file** (.jpg/.png/.webp), non a una pagina. Le immagini sono richieste con `referrerpolicy="no-referrer"`; se non si caricano, `onerror` ripiega sul default e l'admin vede "Immagine non caricabile" (`setCover` in `js/admin.js`).
- Non c'è upload file: l'admin incolla un link (scelta di progetto, nessun Storage).

## Altre immagini
Le card usano template in `js/events-list.js` (`renderEventCard`, `onerror` inline); altre immagini demo di Stitch sono in `design/stitch/` solo come riferimento e non sono caricate dal sito.

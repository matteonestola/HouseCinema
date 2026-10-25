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
2. Formato copertina: orizzontale. `object-cover` la ritaglia in 4 punti: card Bacheca `aspect-[16/9]` (mobile) / `lg:aspect-[4/3]`, elenco serate `aspect-[16/10]` (`events-browse.js`), anteprima admin, e nel dettaglio serata un **poster verticale 2:3** (`#pre-cover`, max 280 px di larghezza) che mostra solo la **fascia centrale**: tieni il soggetto al centro. Consigliato ≥ 1280×800, < 300 KB per i default (400 KB per le copertine in `background_img/`).
3. Cache: GitHub Pages/browser possono servire la vecchia immagine; ricarica forzata (Ctrl+F5) o rinomina il file e aggiorna i riferimenti.
4. Verifica su bacheca, dettaglio evento e anteprima admin.

## Copertina per singolo evento
- Campo `events/{id}.coverUrl`, impostato da `#event-cover-url` in admin. Valori ammessi: URL `http(s)://` (≤ 500 car.) oppure un percorso del sito `background_img/<file>` (vedi sotto). `coverOf(ev)` (`js/app.js`) ritorna `coverUrl || DEFAULT_COVER`.
- L'URL deve puntare **direttamente al file** (.jpg/.png/.webp), non a una pagina. Le immagini sono richieste con `referrerpolicy="no-referrer"`; se non si caricano, `onerror` ripiega sul default e l'admin vede "Immagine non caricabile" (`setCover` in `js/admin.js`).
- In Bacheca la cover è **sfocata** (`blur-[8px] scale-110`, toggle in `renderFeatured`) finché la serata è `upcoming`, così una locandina non lascia leggere un titolo; diventa nitida a `live`. Nel dettaglio serata e nell'elenco è sempre nitida.
- Non c'è upload dal browser (nessun Storage). L'admin incolla un link **oppure** sceglie una miniatura dalla galleria `#cover-gallery` (sotto il campo URL), che mostra i file di `background_img/` letti da `background_img/manifest.json` (generato dal workflow di deploy; in locale va rigenerato). Per aggiungere o togliere immagini in `background_img/` usa la skill `cineserata-cover-images`.

## Altre immagini
Le card dell'elenco serate usano template in `js/events-browse.js` (`renderEventCard`, `onerror` inline); la card della Bacheca è in `js/events-list.js` (`renderFeatured`); altre immagini demo di Stitch sono in `design/stitch/` solo come riferimento e non sono caricate dal sito.

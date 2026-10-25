# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Cerchia di amici stretti di Matteo, quasi sempre da telefono, che arrivano da un link condiviso in chat. Partecipano con solo un nickname (auth anonima, nessuna password). Matteo è l'unico host/admin (login email/password).

## Product Purpose
Organizzare serate cinema tra amici: l'host crea la serata, ogni partecipante propone fino a 5 film, all'inizio si rivelano le proposte, si vota dal vivo e si sceglie cosa proiettare. Successo: la serata si decide in modo divertente e senza attriti.

## Positioning
Film proposti nascosti agli altri fino all'inizio dell'evento (regola imposta da Firestore, non solo dalla UI), poi voto live e roulette. Un gruppo WhatsApp o un sondaggio non offre la sorpresa né la rivelazione.

## Operating Context
Sito statico su GitHub Pages (deploy via GitHub Actions, config Firebase da secret). Fasi evento: upcoming → live → completed. Tab: Bacheca (solo prossima serata), Serata (elenco/dettaglio), Vota, Organizza (admin). "Come Funziona" è un modal. Invito via link e QR code.

## Capabilities and Constraints
- Stack esistente: HTML + Tailwind Play CDN + moduli ES + Firebase 10.12.2 da CDN; nessun build step.
- Markup derivato da Stitch ("Matteo's Cinema", id 12981726820675719701) mantenuto verbatim; token colore/font solo in `js/tailwind-config.js`.
- Header, footer e bottom-nav duplicati in index.html, event.html, admin.html: ogni modifica va replicata.
- Valori legati a `firestore.rules` (ADMIN_UID, max film 5, titolo 60, nickname 30, ecc.).
- Lingua: italiano.

## Brand Commitments
Nome "CineSerata" (confermato dall'utente; "Matteo's Cinema" è solo il nome del progetto Stitch); design system "Cinema Midnight" (export Stitch in `design/stitch/`); italiano; nessun build step. Confermati come vincolanti dall'utente.

## Evidence on Hand
Logo e copertina predefinita in `assets/img/`; export Stitch in `design/stitch/`. Nessun testimonial o dato d'uso: non inventarne.

## Product Principles
- Il segreto dei film prima dell'inizio è il cuore del prodotto: mai indebolirlo.
- Entrare costa un nickname: zero attrito per gli ospiti.
- Mobile-first: si usa dal telefono, spesso al buio o in compagnia.
- Tono tra amici, giocoso, non aziendale.

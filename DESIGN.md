---
name: CineSerata
description: Sala di proiezione in salotto: superfici scure tonali, luce ambra di proiettore, rosso LED per il live.
colors:
  primary: "#ffc174"
  primary-container: "#f59e0b"
  on-primary-container: "#613b00"
  surface-tint: "#ffb95f"
  secondary: "#ffb3b6"
  secondary-container: "#cc003c"
  on-secondary-container: "#ffdcdc"
  tertiary: "#ffc32d"
  tertiary-container: "#e0a800"
  surface: "#10131a"
  surface-container-lowest: "#0b0e14"
  surface-container-low: "#191c22"
  surface-container: "#1d2026"
  surface-container-high: "#272a31"
  surface-container-highest: "#32353c"
  on-surface: "#e1e2eb"
  on-surface-variant: "#d8c3ad"
  outline: "#a08e7a"
  outline-variant: "#534434"
  error: "#ffb4ab"
typography:
  display-hero:
    fontFamily: "Space Grotesk"
    fontSize: "56px"
    fontWeight: 700
    lineHeight: "64px"
    letterSpacing: "-0.02em"
  display-hero-mobile:
    fontFamily: "Space Grotesk"
    fontSize: "36px"
    fontWeight: 700
    lineHeight: "44px"
    letterSpacing: "-0.01em"
  headline-lg:
    fontFamily: "Space Grotesk"
    fontSize: "32px"
    fontWeight: 600
    lineHeight: "40px"
    letterSpacing: "-0.01em"
  headline-lg-mobile:
    fontFamily: "Space Grotesk"
    fontSize: "26px"
    fontWeight: 600
    lineHeight: "34px"
  headline-md:
    fontFamily: "Space Grotesk"
    fontSize: "24px"
    fontWeight: 600
    lineHeight: "32px"
  headline-sm:
    fontFamily: "Space Grotesk"
    fontSize: "20px"
    fontWeight: 500
    lineHeight: "28px"
  body-lg:
    fontFamily: "Plus Jakarta Sans"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: "28px"
  body-md:
    fontFamily: "Plus Jakarta Sans"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: "24px"
  body-sm:
    fontFamily: "Plus Jakarta Sans"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: "20px"
  label-lg:
    fontFamily: "Plus Jakarta Sans"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: "20px"
    letterSpacing: "0.01em"
  label-md:
    fontFamily: "Plus Jakarta Sans"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: "16px"
    letterSpacing: "0.02em"
  label-sm:
    fontFamily: "Plus Jakarta Sans"
    fontSize: "11px"
    fontWeight: 700
    lineHeight: "14px"
    letterSpacing: "0.05em"
rounded:
  DEFAULT: "0.25rem"
  lg: "0.5rem"
  xl: "0.75rem"
  full: "9999px"
spacing:
  space-xs: "0.25rem"
  space-sm: "0.5rem"
  space-md: "1rem"
  space-lg: "1.5rem"
  space-xl: "2.5rem"
  gutter-mobile: "0.75rem"
  gutter: "1.25rem"
  margin-mobile: "1rem"
  margin: "2rem"
components:
  button-primary:
    backgroundColor: "{colors.primary-container}"
    textColor: "{colors.on-primary-container}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.xl}"
    padding: "1rem 1.5rem"
  button-primary-hover:
    backgroundColor: "{colors.surface-tint}"
  button-secondary:
    backgroundColor: "{colors.surface-container-high}"
    textColor: "{colors.on-surface}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.xl}"
    padding: "1rem 1.5rem"
  button-secondary-hover:
    backgroundColor: "{colors.surface-container-highest}"
  chip-badge:
    backgroundColor: "{colors.surface-container-high}"
    textColor: "{colors.primary}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.full}"
    padding: "0.25rem 1rem"
  card-feature:
    backgroundColor: "{colors.surface-container-low}"
    rounded: "{rounded.xl}"
    padding: "1.5rem"
  countdown-tile:
    backgroundColor: "{colors.surface-container-high}"
    textColor: "{colors.primary}"
    typography: "{typography.headline-lg}"
    rounded: "{rounded.lg}"
    padding: "0.5rem 0.25rem"
  nav-item-active:
    backgroundColor: "{colors.surface-container-high}"
    textColor: "{colors.primary}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.lg}"
    padding: "0.25rem 1rem"
---

# Design System: CineSerata

## Overview

**Creative North Star: "The Living-Room Projection Booth"**

Una sala di proiezione ricavata in salotto: il buio è il materiale, l'ambra è la luce del proiettore, il rosso è la spia LED "live". Tutto il sistema è a tema scuro fisso (`class="dark"`): non esiste una variante chiara. Le superfici sono blu-inchiostro leggermente freddo, l'accento è un ambra calda che illumina solo ciò che conta (azioni, countdown, stato).

Il tono è scuro, caldo, giocoso: tra amici, mai corporate. La personalità vive nei dettagli (emoji come avatar, icone Material Symbols, il lucchetto del "Caveau Sigillato", micro-copy come "Democrazia da Salotto") più che in decorazioni pesanti. La densità è media, mobile-first: card ampie, bersagli tocco ≥44px, bottom-nav fissa sul telefono.

Il design deriva dall'export Stitch "Matteo's Cinema" (design system "Cinema Midnight"); il markup Stitch è mantenuto verbatim e i token vivono solo in `js/tailwind-config.js`.

**Key Characteristics:**
- Tema scuro fisso, profondità per strati tonali, non per bordi.
- Ambra come unica luce; rosso `secondary-container` solo per live/urgenza.
- Space Grotesk per titoli e numeri, Plus Jakarta Sans per testo e label.
- Glow ambra morbido su CTA primarie e blur radiali di sfondo.
- Icone Material Symbols Outlined; emoji per identità dei partecipanti.

## Colors

Palette scura monocroma-calda: inchiostro blu per le superfici, ambra per la luce, rosso fragola per il "live".

### Primary
- **Ambra di Proiettore** (`#f59e0b`, `primary-container`): sfondo dei bottoni primari e dei badge numerici. Testo sopra: `on-primary-container` (`#613b00`).
- **Ambra Chiara** (`#ffc174`, `primary`): testo/icone accentate, titoli di sezione, stato attivo nav, anello degli avatar.
- **Ambra Calda hover** (`#ffb95f`, `surface-tint`): hover dei bottoni primari e punto medio del gradiente del titolo hero.

### Secondary
- **Rosso Spia Live** (`#cc003c`, `secondary-container`): puntino pulsante e etichetta di stato solo quando la serata è live, tappa 3 di Come Funziona.
- **Rosa Cipria** (`#ffb3b6`, `secondary`): etichette testuali sul rosso (es. "In Programma Questa Settimana").

### Tertiary
- **Oro Biglietto** (`#ffc32d`, `tertiary`; `#e0a800` container): fine del gradiente hero, ETA nel ticker, tappa 2.

### Neutral
- **Buio di Sala** (`#10131a`, `surface`/`background`): sfondo pagina.
- **Quinta Nera** (`#0b0e14`, `surface-container-lowest`): header, footer, bottom-nav.
- **Strati Inchiostro** (`#191c22` → `#1d2026` → `#272a31` → `#32353c`): `container-low`, `container`, `high`, `highest`; card, chip, tile, hover.
- **Testo Pergamena** (`#e1e2eb`, `on-surface`): testo primario.
- **Testo Seppia** (`#d8c3ad`, `on-surface-variant`): testo secondario e label.
- **Contorno Bronzo** (`#a08e7a` outline, `#534434` outline-variant): usati solo come filo sottile (es. `border-outline-variant/20`).

### Named Rules
**The One Lamp Rule.** L'ambra è l'unica luce: compare su CTA, countdown, stato attivo e icone chiave. Se tutto è ambra, niente è illuminato.

**The Live Red Rule.** Il rosso `secondary-container` significa "sta succedendo adesso": compare solo quando la serata è live (spia, etichetta di stato, puntino del ticker). Il countdown di una serata futura è ambra. Mai decorativo, mai per bottoni generici.

**The No-Line Rule.** Le superfici si separano per salto di tono, non per bordi. I fili (`outline-variant` ≤ 20% opacità) sono solo divisori interni.

## Typography

**Display Font:** Space Grotesk (500–700)
**Body Font:** Plus Jakarta Sans (400–700)
**Label/Mono Font:** Plus Jakarta Sans per le label; i numeri del countdown usano Space Grotesk con `tabular-nums`.

**Character:** Space Grotesk è geometrico e leggermente tecnico, da insegna di sala; Plus Jakarta Sans è morbida e leggibile, amichevole su schermo piccolo.

### Hierarchy
- **Display Hero** (700, 56px / 36px mobile, 64/44): riservato a stati di apertura senza serata; la Bacheca oggi usa Headline LG come saluto di una riga, con enfasi in `primary` e senza gradiente sul testo.
- **Headline LG** (600, 32px / 26px mobile): titolo serata, titoli di sezione-card.
- **Headline MD** (600, 24px): wordmark nell'header, titoli modali.
- **Headline SM** (500, 20px): titoli di blocco, "Caveau Sigillato".
- **Body LG/MD/SM** (400, 18/16/14px): descrizioni; larghezza massima ~`max-w-xl`/`2xl` (≈65ch).
- **Label LG** (600, 14px): bottoni, nav. **Label MD** (600, 12px). **Label SM** (700, 11px, +0.05em, spesso maiuscolo): eyebrow, chip, stato.

### Named Rules
**The Tabular Clock Rule.** Ogni numero che cambia (countdown, contatori) usa `tabular-nums` per non far ballare il layout.

## Layout

Contenitore `max-w-7xl` centrato con padding laterale `gutter` (1.25rem). Griglia a 12 colonne da `lg`; sotto `lg` colonna singola. Header fisso alto 80px più ticker opzionale; contenuto con `pt-28`. Sul telefono la navigazione è una bottom-nav fissa (64px, `pb-safe`) con quattro voci (Bacheca, Serata, Vota, Organizza); da `lg` la nav passa nell'header. Ritmo verticale basato su `space-md` (1rem), `space-lg` (1.5rem), `space-xl` (2.5rem). Bersagli tocco ≥44px.

## Elevation & Depth

Sistema ibrido: la profondità primaria è **tonale** (da `surface` a `surface-container-highest`), l'ombra è secondaria e profonda, e il **glow ambra** segnala l'azione.

### Shadow Vocabulary
- **Scheda** (`shadow-2xl`): card in evidenza su fondo scuro.
- **Header/footer** (`0 1px 8px rgba(0,0,0,0.5)` / `0 -1px 12px rgba(0,0,0,0.6)`): separano le barre fisse senza bordo.
- **Glow CTA** (`0 0 20px rgba(245,158,11,0.35)` → `0 0 28px rgba(245,158,11,0.55)` in hover): solo sul bottone primario dell'header.
- **Luce di sfondo** (cerchi `blur-[140px]` e `blur-[150px]` in ambra al 15% e al 10%): atmosfera dietro hero, mai sopra il contenuto.
- **Vetro** (`backdrop-blur-xl` su barre al 85–90%): header, bottom-nav, overlay modali.
- **Cover sigillata** (`blur-[8px]` + `scale-110`, nitida allo sblocco): la copertina si vede come atmosfera ma non lascia leggere un titolo.

### Named Rules
**The Tonal-First Rule.** Prima si alza il tono della superficie, poi (se serve) si aggiunge un'ombra. Il glow ambra è riservato all'azione.

## Shapes

Angoli morbidi ma non gonfi: bottoni e card `rounded-xl` (0.75rem), tile interni `rounded-lg` (0.5rem), modali `rounded-2xl`, chip e avatar `rounded-full`, default 0.25rem. Nessun bordo spesso; forme piene, ritagli a pillola per stato e categoria. Immagini di copertina in `aspect-[16/10]`/`[4/3]` con gradiente scuro dal basso.

## Components

### Buttons
- **Shape:** `rounded-xl` (0.75rem), label Label LG bold, icona Material Symbols a sinistra.
- **Primary:** fondo `primary-container` (#f59e0b), testo `on-primary-container`, padding 1rem × 1.5rem, `shadow-xl`.
- **Hover / Focus:** fondo `surface-tint`, sollevamento `-translate-y-0.5`, transizione 200ms.
- **Secondary:** fondo `surface-container-high`, testo `on-surface`, icona ambra; hover `surface-container-highest`.

### Chips
- **Style:** pillola `rounded-full`, fondo `surface-container-high` o `surface-container-lowest/90` + blur sulle immagini, testo `primary`, Label SM maiuscolo.
- **State:** stato attivo tab/filtro con fondo `surface-container-high` e testo `primary`.

### Cards / Containers
- **Corner Style:** `rounded-xl`.
- **Background:** `surface-container-low`; senza contenitori annidati: i gruppi interni si separano con spazio o un filo `outline-variant/20`.
- **Shadow Strategy:** `shadow-2xl` solo sulla card in evidenza.
- **Border:** nessuno.
- **Internal Padding:** `space-lg` (1.5rem), `space-md` per tile.

### Inputs / Fields
Nessun componente di input documentato in Bacheca; i campi si trovano in `admin.html` ed `event.html` e vanno estratti con una passata dedicata.

### Navigation
- **Header:** `surface-container-lowest/90` + blur, wordmark Headline MD, nav `lg` con voce attiva a pillola `surface-container-high` + testo `primary`.
- **Bottom-nav (mobile):** 4 voci, icona 24px + Label SM, attiva in `primary`.
- **Ticker:** striscia `surface-container-low/95` con puntino rosso pulsante e ETA in `tertiary`.

### Caveau (componente firma)
Lo stato sigillato di una serata: copertina con scrim leggero, lucchetto in cerchio vetro `surface-container-lowest/80`, titolo "Caveau Sigillato" e conteggio dei titoli segreti in ambra. Da `sm` in su una fila di tagliandi (`confirmation_number`, uno per film proposto, solo conteggio, max 8) dice quante proposte ci sono senza svelarle. Su mobile la copertina è un banner basso (3:1) con lucchetto e testo affiancati. Il lucchetto non pulsa: a serata live si apre una sola volta (`unlock-pop`, 0,7 s). Il countdown (`GIORNI/ORE/MIN` oltre 48 ore, poi `ORE/MIN/SEC`) sta nella card sotto un filo `outline-variant/20`, senza vano né tile.

### Modale "Come Funziona"
Overlay `surface-container-lowest/80` + blur, pannello `rounded-2xl` su `surface-container-low`, tre passi numerati con badge colorati (ambra, oro, rosso).

## Do's and Don'ts

### Do:
- **Do** usare solo i token di `js/tailwind-config.js`; cambiare l'aspetto modificando le classi Tailwind esistenti.
- **Do** separare le superfici per salto di tono (`surface-container-*`), non per bordi.
- **Do** tenere l'ambra (`#f59e0b` / `#ffc174`) per azioni, stato e countdown.
- **Do** usare `tabular-nums` sui numeri che cambiano e bersagli tocco ≥44px.
- **Do** replicare ogni modifica a header, footer e bottom-nav in `index.html`, `event.html` e `admin.html`.

### Don't:
- **Don't** introdurre un tema chiaro: il sistema è scuro fisso.
- **Don't** usare il rosso `#cc003c` per decorazione o bottoni generici: significa "live".
- **Don't** aggiungere bordi spessi, `border-left` colorati a banda o card annidate.
- **Don't** riscrivere i componenti Stitch da zero né aggiungere uno step di build.
- **Don't** rivelare i titoli dei film altrui prima dell'inizio: il design del Caveau deve restare sigillato.

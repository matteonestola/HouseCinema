---
name: cineserata-cover-images
description: Aggiungere un'immagine alla cartella background_img/ di CineSerata (copertine selezionabili nel pannello Organizza). Prende l'immagine in input o la chiede all'utente, la ottimizza, e dopo la conferma dell'utente fa commit, push, PR e auto-merge su main (che fa partire il deploy). Serve anche per togliere un'immagine.
---

# Aggiungere una copertina in `background_img/`

Le copertine "del sito" sono i file di `background_img/` (repo). Il pannello admin le mostra come miniature leggendo `background_img/manifest.json`, che il workflow di deploy rigenera a ogni push su `main`. Nel documento della serata si salva solo il percorso (`background_img/nome.jpg`). Panoramica: skill `cineserata-images` e README (sezione "Copertine delle serate").

**Il merge su `main` pubblica il sito (deploy su GitHub Pages).** Per questo il flusso si ferma sempre per una conferma esplicita dell'utente prima di committare, pushare e mergiare. Non saltarla mai, nemmeno se l'utente ha già dato un'immagine.

## Input
- Se l'utente ha già dato un'immagine (percorso, o immagine incollata in chat) usala.
- Altrimenti **chiedigliela**: "Quale immagine vuoi aggiungere? Dammi il percorso del file (jpg, png, webp, avif o gif)." Se ha incollato l'immagine ma non esiste un file su disco, chiedi il percorso.
- Opzionale: un nome per il file (`-Name`). Se non lo dà, si ricava dal nome originale.

## Procedura

### 1. Preflight (nessuna modifica ancora al sito)
- `git status --porcelain` deve essere **vuoto**. Se non lo è, fermati: ci sono modifiche non committate che non vanno mescolate con la copertina. Dillo e chiedi come procedere (committarle, metterle da parte, o annullare).
- Ricorda il branch corrente (`git branch --show-current`) per tornarci alla fine.
- `git fetch origin` e crea un branch dedicato da `origin/main`: `git switch -c claude/copertina-<nome> origin/main` (il nome è lo slug dell'immagine; se esiste già, aggiungi un suffisso).

### 2. Guarda l'immagine
Apri il file con Read e controlla due cose, poi riportale nella conferma:
- **Titoli leggibili**: una locandina con il titolo del film in grande non è protetta dalla sfocatura della bacheca (`blur-[8px]` finché il caveau è sigillato) e il titolo resta visibile nel dettaglio serata e nell'elenco.
- **Formato**: la copertina è orizzontale (16:9 in bacheca, 4:3 su desktop). Una foto verticale viene ritagliata.

### 3. Ottimizza e copia
Dalla radice del repo (PowerShell + Node, nessun'altra dipendenza):
```
powershell -ExecutionPolicy Bypass -File .claude/skills/cineserata-cover-images/scripts/add-cover.ps1 -Source "<percorso immagine>" [-Name <nome-file>]
```
Cosa fa:
- nome normalizzato (minuscolo, trattini, niente accenti o spazi);
- **png / jpg / bmp / tiff** → orientamento EXIF applicato, ridimensionata a 1600 px di larghezza (`-MaxWidth`), salvata come `.jpg` sotto 400 KB (`-MaxKB`), abbassando la qualità a gradini da 82 a 50;
- **webp / avif / gif** → copiate così come sono (Windows non le rielabora); se pesano più di 400 KB avvisa;
- se il file esiste già esce con `EXISTS:` (codice 2): non sovrascrivere. Proponi un altro nome o, solo se l'utente lo chiede, `-Force`;
- rigenera `background_img/manifest.json`.

Leggi l'output (`ADDED: nome | WxH | KB`, `WARN:`, `MANIFEST:`) e controlla `git status`: devono risultare il nuovo file e `manifest.json` modificato (nient'altro).

### 4. Conferma dell'utente (obbligatoria)
Mostra un riepilogo breve e chiedi conferma con AskUserQuestion:
- file aggiunto, dimensioni e peso, eventuali `WARN:` e i punti del passo 2;
- cosa succederà: commit su `claude/copertina-<nome>`, push, PR verso `main`, **auto-merge**, quindi deploy pubblico;
- opzioni: "Sì, pubblica" / "No, annulla" / "Cambia nome o immagine".

Se l'utente annulla o vuole cambiare: ripristina e torna al branch di partenza: `git checkout -- background_img/manifest.json`, elimina il file aggiunto, `git switch <branch di partenza>`, `git branch -D claude/copertina-<nome>`. Poi riparti dal passo giusto.

### 5. Commit, push, PR, auto-merge (solo dopo il "sì")
1. `git add background_img/` e commit con messaggio `Aggiungi copertina <nome>`, terminando con la riga di attribuzione richiesta dal contesto.
2. `git push -u origin claude/copertina-<nome>`.
3. `gh pr create --base main --head claude/copertina-<nome> --title "Aggiungi copertina <nome>" --body "..."` (il corpo dice quale file, dimensioni, e che aggiunge solo una copertina selezionabile; termina con la riga di attribuzione delle PR). Annota il numero della PR.
4. Auto-merge con merge commit (convenzione del repo): `gh pr merge <n> --merge --auto`.
   - Se risponde che l'auto-merge non è abilitato per il repository o che la PR è già pronta ("clean status"), fai il merge immediato: `gh pr merge <n> --merge`. La conferma del passo 4 copre questo caso.
   - Se il merge viene rifiutato (controlli richiesti falliti, conflitti, permessi), **fermati**, mostra l'errore e l'URL della PR; non forzare né aggirare le protezioni.
5. Verifica: `gh pr view <n> --json state,mergedAt,url`. Se lo stato non è `MERGED` ma l'auto-merge è in coda, dillo (si completerà da solo quando i controlli passano).
6. Torna al branch di partenza: se è `main`, `git switch main && git pull --ff-only`; altrimenti `git switch <branch di partenza>`. Cancella il branch locale `claude/copertina-<nome>` se la PR è mergiata.

### 6. Dillo all'utente
- URL della PR e stato (mergiata / in coda).
- Il deploy parte dal push su `main` (`gh run list --workflow deploy.yml --limit 1`): dopo un paio di minuti l'immagine compare tra le miniature del pannello Organizza.
- Se non compare: guarda il log del passo "Genera l'elenco delle copertine" del workflow di deploy (usa `jq`) e ricarica la pagina senza cache.

## Togliere un'immagine
1. Chiedi all'utente se qualche serata la usa: nel documento evento c'è `coverUrl: "background_img/<nome>"`. Da qui non puoi leggere Firestore, quindi chiedilo (o fallo controllare in Organizza → Gestisci). Se una serata la usa e il file sparisce, la copertina ripiega sul default e l'admin vede "File non trovato in background_img/".
2. Stesso flusso git di sopra (preflight, branch `claude/rimuovi-copertina-<nome>`, **conferma esplicita**, commit, push, PR, auto-merge), con questi passi al posto di 2-3: elimina il file da `background_img/` e `node .claude/skills/cineserata-cover-images/scripts/update-manifest.js`.

## Rigenerare solo l'elenco
Dopo aver copiato file a mano: `node .claude/skills/cineserata-cover-images/scripts/update-manifest.js`.

## Cose da sapere
- Nomi ammessi nel percorso salvato: lettere, cifre e `._~%!*'()-` (validazione in `js/admin.js`, `COVER_PATH_RE`). Lo script produce solo `a-z0-9-` più l'estensione, quindi è sempre valido.
- Peso consigliato < 400 KB: l'immagine viene scaricata da home, elenco e dettaglio.
- Le regole Firestore non validano `coverUrl`: nessuna modifica necessaria.
- Il manifest committato può essere `[]` o aggiornato: in produzione lo sovrascrive il workflow.
- Se nel flusso hai anche modificato codice del sito, esegui `cineserata-verify`; per la sola aggiunta di un'immagine non serve.

# Matteo's Cinema

Sito statico (HTML/CSS/JS) per organizzare serate cinema tra amici, pubblicabile gratuitamente su GitHub Pages. I dati (eventi, partecipanti, film proposti) sono salvati su Firebase, l'unico servizio gratuito a cui il sito si appoggia.

## Come funziona

- **Chiunque** può vedere l'elenco eventi e partecipare inserendo solo un nickname (nessuna password).
- Chi partecipa può proporre **fino a 5 film**, che restano **nascosti agli altri finché l'evento non inizia** — la regola è imposta dal database stesso, non solo dall'interfaccia.
- Solo **tu** (l'admin) puoi creare eventi, tramite un vero login con email e password.

## 1. Crea il progetto Firebase (gratuito)

1. Vai su [console.firebase.google.com](https://console.firebase.google.com) e crea un nuovo progetto (es. "cinema-di-casa").
2. Nel menu a sinistra vai su **Build → Firestore Database** → "Crea database" → scegli una regione vicina → parti in **modalità produzione**.
3. Vai su **Build → Authentication** → "Inizia" → scheda "Sign-in method" → abilita:
   - **Email/Password** (per te, admin)
   - **Anonimo** (per i partecipanti — è invisibile, non chiederà nulla a loro)
4. Sempre in Authentication, scheda "Users" → "Aggiungi utente" → crea **il tuo** utente admin con email e password a scelta.
5. Copia il tuo **User UID** che appare nella tabella: ti servirà tra poco.

## 2. Collega il sito al tuo progetto Firebase

1. Nella console Firebase vai su **Impostazioni progetto** (icona ingranaggio) → scorri fino a "Le tue app" → clicca l'icona `</>` per creare una "App web" (basta un nickname qualsiasi, non serve Hosting).
2. Ti mostrerà un oggetto `firebaseConfig`: copia i valori dentro `js/firebase-config.js` in questo progetto, al posto dei segnaposto `INCOLLA_QUI...`.

## 3. Imposta le regole di sicurezza

1. Apri `firestore.rules` in questo progetto e sostituisci `INCOLLA_QUI_IL_TUO_ADMIN_UID` con lo User UID copiato al punto 1.5.
2. Nella console Firebase vai su **Firestore Database → Regole**, incolla tutto il contenuto di `firestore.rules` e clicca "Pubblica".

## 4. Prova in locale (facoltativo)

Puoi aprire il sito con un piccolo server locale, ad esempio con Python:

```bash
cd cinema-eventi
python3 -m http.server 8000
```

poi vai su `http://localhost:8000`. (Aprire `index.html` direttamente col doppio click a volte dà problemi con i moduli JS: meglio un server locale.)

## 5. Pubblica su GitHub Pages

1. Crea un repository su GitHub (es. `cinema-di-casa`) e carica tutti i file di questa cartella nella radice del repository.
2. Vai su **Settings → Pages** del repository.
3. In "Source" scegli il branch principale (es. `main`) e cartella `/ (root)`, poi salva.
4. Dopo qualche minuto il sito sarà online su `https://TUO-USERNAME.github.io/cinema-di-casa/`.
5. Da quell'indirizzo, tu vai su `.../admin.html` per creare eventi; condividi invece il link della home o di un evento specifico con i tuoi amici.

## Struttura del progetto

```
cinema-eventi/
├── index.html            # Bacheca serate (filtri, serata in evidenza)
├── event.html            # Dettaglio: vista PRE (proposte, caveau) e LIVE (voto, roulette, proiezione)
├── admin.html            # Login host + pannello organizzatore
├── css/style.css         # solo CSS non-Tailwind
├── js/
│   ├── tailwind-config.js    # config Tailwind (design system "Cinema Midnight")
│   ├── firebase-config.js    # le tue chiavi Firebase
│   ├── site-config.js        # costanti: HOST_NAME, ADMIN_UID, generi, avatar, snack
│   ├── app.js                # init Firebase + helper condivisi
│   ├── layout.js             # header ticker, chip utente, nav attiva
│   ├── events-list.js, event-detail.js, event-pre.js, event-live.js, admin.js
├── assets/img/           # logo e copertina predefinita
├── design/stitch/        # export Stitch di riferimento (non linkati dal sito)
└── firestore.rules       # da incollare nella console Firebase
```

## Modello dati

- `events/{id}`: title, description, startAt, status (`draft`|`published`), genre, location, coverUrl (opzionale), hostName, createdBy, createdAt, screening (scritto da "Avvia Proiezione").
- `events/{id}/participants/{uid}`: nickname, avatar, snack, filmCount, joinedAt, updatedAt.
- `events/{id}/proposals/{uid}`: nickname, films `[{id,title,note?}]` (max 5), updatedAt. Leggibile dagli altri solo dopo `startAt`.
- `events/{id}/votes/{uid}`: picks (id film), updatedAt. Solo dopo `startAt` e prima della proiezione.

Gli eventi creati con la versione precedente vengono aggiornati automaticamente al primo login admin (`status: published`, ecc.).

## Note importanti

- **Dopo ogni modifica a `firestore.rules` va ripubblicato** in Console Firebase -> Firestore -> Regole.
- `ADMIN_UID` in `js/site-config.js` deve coincidere con l'UID scritto in `firestore.rules`.
- Il QR code dell'invito usa il servizio esterno `api.qrserver.com` (l'URL dell'evento viene inviato a quel servizio).
- Tailwind e' caricato dal Play CDN (come nell'export Stitch): nessun build step.

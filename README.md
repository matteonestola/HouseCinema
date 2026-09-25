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
├── index.html          # elenco eventi
├── event.html           # dettaglio evento: partecipa, proponi film, partecipanti
├── admin.html            # login admin + creazione eventi
├── css/style.css
├── js/
│   ├── firebase-config.js   # le tue chiavi Firebase (da compilare)
│   ├── app.js                # inizializzazione condivisa
│   ├── events-list.js
│   ├── event-detail.js
│   └── admin.js
└── firestore.rules      # da incollare nella console Firebase
```

## Limiti noti e possibili miglioramenti futuri

- L'identità dei partecipanti è legata al browser (login anonimo): se cancellano i dati del browser o cambiano dispositivo, per il sito sono "una persona nuova" e potranno ripartecipare/riproporre film da capo. Per un uso informale tra amici va bene così.
- Eliminando un evento dall'area admin, i partecipanti e i film proposti restano nel database (semplicemente non più raggiungibili). Se vuoi una pulizia completa te lo posso aggiungere in un secondo momento con una Cloud Function.
- Firebase (piano gratuito "Spark") copre ampiamente l'uso tra amici: decine di migliaia di letture/scritture al giorno gratis.

# OpenDecks Italia

Base project in Next.js per la Fase 1 della piattaforma OpenDecks Italia.

## Stack

- Next.js App Router
- React
- MongoDB con fallback a dati mock

## Avvio

```bash
npm install
npm run dev
```

Apri `http://localhost:3000`.

## Variabili ambiente

Copia `.env.example` in `.env.local` e configura:

```bash
MONGODB_URI=
MONGODB_DB=opendecks
ADMIN_USERNAME=admin
ADMIN_PASSWORD=
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
BLOB_READ_WRITE_TOKEN=
```

Se `MONGODB_URI` non e presente, il progetto usa dati demo in memoria.

## Deploy Vercel

Per il deploy su Vercel configura queste env nel progetto:

```bash
MONGODB_URI=
MONGODB_DB=opendecks
ADMIN_USERNAME=admin
ADMIN_PASSWORD=
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
BLOB_READ_WRITE_TOKEN=
```

Note pratiche:

- MongoDB Atlas va bene come database di produzione.
- Login admin e API usano le stesse env del progetto locale.
- Gli upload immagini evento ora usano Vercel Blob.
- Per funzionare sia in locale sia su Vercel devi configurare `BLOB_READ_WRITE_TOKEN`.
- L'URL finale dell'immagine viene salvato nel database.

Checklist consigliata:

1. collega il repository a Vercel
2. imposta tutte le env nel pannello Vercel
3. verifica che Mongo Atlas accetti le connessioni del deploy
4. esegui il seed del database prima di usare l'admin
5. configura Blob Storage in Vercel e copia il token nel progetto

## Sezioni incluse

- Home con next event automatico
- Il progetto
- Eventi
- Pagina evento singolo
- Prenota il tuo set
- Archive
- Admin base
- API `/api/events`
- API `/api/applications`

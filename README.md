# Anthias Master

A **Next.js** web application for centrally managing an [Anthias](https://github.com/Screenly/anthias) screen fleet. Upload a media file once and deploy it to all your screens simultaneously via the Anthias v2 API.

## Features

- **Group broadcast** — push an image to the entire fleet in one click
- **Screen management** — register any Anthias instance by IP and label
- **Media library** — view and edit already-deployed assets (name, duration, dates, enabled state)
- **Multilingual** — French and English UI, switchable without a page reload (via `NEXT_LOCALE` cookie)

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router, standalone output) |
| UI | Tailwind CSS v4, Lucide React |
| i18n | next-intl v4 (cookie-based, no URL routing) |
| Database | SQLite via Prisma 7 |
| Runtime | Node.js 24 LTS |
| Deployment | Docker (multi-stage image) |

## Prerequisites

- Node.js 20+
- One or more [Anthias](https://github.com/Screenly/anthias) instances reachable on the network (hardware-agnostic)

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Generate the Prisma client
npx prisma generate

# 3. Apply migrations (creates the SQLite database)
DATABASE_URL="file:./dev.db" npx prisma migrate deploy

# 4. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Docker (Production)

```bash
docker compose up nextjs-standalone --build
```

The SQLite database is persisted in a named Docker volume (`sqlite_data` → `/app/data/prod.db`).  
Prisma migrations run automatically on container startup via `docker-entrypoint.sh`.

```
PORT         : 3000
DATABASE_URL : file:/app/data/prod.db  (overridable via env)
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `file:/app/data/prod.db` | Path to the SQLite database |
| `PORT` | `3000` | Listening port |
| `NODE_ENV` | `production` | Node environment |

## Project Structure

```
├── app/
│   ├── layout.tsx              # Root layout with NextIntlClientProvider
│   ├── page.tsx                # Main page
│   └── api/
│       ├── screens/            # Screen CRUD (SQLite)
│       ├── assets/[id]/        # Read / update a single Anthias asset
│       ├── assets/             # Aggregated asset list across all screens
│       └── broadcast/          # Upload + deploy to all screens
├── components/
│   ├── Header.tsx              # App header + LocaleSwitcher
│   ├── LocaleSwitcher.tsx      # FR/EN toggle (NEXT_LOCALE cookie)
│   ├── ScreenManager.tsx       # Screen list and registration
│   ├── BroadcastForm.tsx       # Broadcast form
│   └── AssetLibrary.tsx        # Asset table
├── i18n/
│   ├── request.ts              # Locale resolution from cookie
│   └── routing.ts              # Available locales declaration
├── messages/
│   ├── fr.json                 # French translations
│   └── en.json                 # English translations
├── prisma/
│   └── schema.prisma           # Screen model (ip, label)
├── Dockerfile                  # Multi-stage build on Node 24
├── compose.yml                 # nextjs-standalone service + SQLite volume
└── docker-entrypoint.sh        # migrate deploy → node server.js
```

## Internal API

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/api/screens` | List all registered screens |
| `POST` | `/api/screens` | Add a screen `{ ip, label }` |
| `GET` | `/api/assets` | Fetch asset list from the first available screen |
| `GET` | `/api/assets/[id]` | Retrieve asset content (base64) |
| `PUT` | `/api/assets/[id]` | Update asset metadata |
| `POST` | `/api/broadcast` | Upload file + create asset on all screens |

> Calls to screens use the Anthias REST API v2 (`http://<ip>/api/v2`).

## Adding a Language

1. Create `messages/<code>.json` with all keys from an existing file
2. Add the locale code to `i18n/routing.ts` → `locales` array
3. Add the locale code to `components/LocaleSwitcher.tsx` → `locales` array

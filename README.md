# Anthias Master

A **Next.js** web application for centrally managing an [Anthias](https://github.com/Screenly/anthias) screen fleet. Upload a media file once and deploy it to all your screens simultaneously via the Anthias v2 API.

## Features

- **Group broadcast** — push an image or video to the entire fleet in one click
- **Screen management** — register any Anthias instance by IP/hostname, remove it if needed
- **Media sync** — copy the media of an existing screen to a new or out-of-date one, with one click on the sync icon (automatic when a screen is added)
- **Media library** — view and edit already-deployed assets (name, duration, dates, enabled state)
- **Authentication** — login via Microsoft (Entra ID / Azure AD) or email + password
- **Role-based access** — three roles: `ADMIN`, `USER`, `PENDING`; new users wait for approval
- **User management** — admin panel to approve, promote or revoke users
- **Multilingual** — French and English UI, switchable without a page reload (via `NEXT_LOCALE` cookie)

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router, standalone output) |
| UI | Tailwind CSS v4, Lucide React |
| Auth | NextAuth v4 (Azure AD + Credentials providers) |
| i18n | next-intl v4 (cookie-based, no URL routing) |
| Database | SQLite via Prisma 7 |
| Runtime | Node.js 24 LTS |
| Deployment | Docker (multi-stage image) |

## Prerequisites

- Node.js 20+
- One or more [Anthias](https://github.com/Screenly/anthias) instances reachable on the network

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Copy and fill environment variables
cp .env.example .env

# 3. Apply migrations (creates the SQLite database)
npx prisma migrate deploy

# 4. Generate the Prisma client
npx prisma generate

# 5. Create your first admin account
npx tsx scripts/create-user.ts you@example.com "yourpassword" "Your Name"

# 6. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Docker (Production)

```bash
docker compose up --build -d
```

Starts two containers:
- **nextjs-standalone** — Next.js app (internal port 3001)
- **anthias-nginx** — Nginx reverse proxy, exposes **HTTPS on port 3000**

The SQLite database is persisted in a named Docker volume (`sqlite_data` → `/app/data/prod.db`).  
Prisma migrations run automatically on container startup via `docker-entrypoint.sh`.  
A self-signed TLS certificate is generated automatically on first start and stored in the `nginx_certs` volume.

```
Public URL  : https://<server-ip>:3000
DATABASE_URL: file:/app/data/prod.db  (overridable via env)
```

> The browser will warn about the self-signed certificate — click "Continue anyway". This is expected on a local network without a CA-signed certificate.

### First admin account (in Docker)

```bash
docker exec -it nextjs-standalone-container npx tsx scripts/create-user.ts you@example.com "password" "Your Name"
```

### HTTPS & Microsoft login on a server

Because Azure requires HTTPS redirect URIs, the Nginx container handles TLS termination.

1. Set in your `.env`:
   ```env
   NEXTAUTH_URL=https://<server-ip>:3000
   ```
2. In **Azure Portal → App registrations → Authentication → Redirect URIs**, add:
   ```
   https://<server-ip>:3000/api/auth/callback/azure-ad
   ```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Path to the SQLite database (`file:./dev.db` locally) |
| `NEXTAUTH_SECRET` | Yes | Random secret for JWT signing — generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Yes | Public base URL of the app (e.g. `http://localhost:3000`) |
| `AZURE_AD_CLIENT_ID` | Optional | Azure App Registration client ID |
| `AZURE_AD_CLIENT_SECRET` | Optional | Azure App Registration client secret |
| `AZURE_AD_TENANT_ID` | Optional | Azure tenant ID (omit for multi-tenant) |
| `PORT` | No | Listening port (default: `3000`) |

### `.env.example`

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET=replace_with_openssl_rand_base64_32
NEXTAUTH_URL=http://localhost:3000

# Microsoft Entra ID (optional — leave empty to disable Microsoft login)
AZURE_AD_CLIENT_ID=
AZURE_AD_CLIENT_SECRET=
AZURE_AD_TENANT_ID=
```

## Authentication

### Microsoft (Entra ID / Azure AD)

1. Go to **Azure Portal → App registrations → New registration**
2. Supported account types: `Accounts in this organizational directory only`
3. Redirect URI: `Web` → `http://localhost:3000/api/auth/callback/azure-ad`
4. Under **Certificates & secrets**, create a new client secret
5. Copy **Application (client) ID**, **Directory (tenant) ID** and the secret value into `.env`
6. For production, add your public URL as an additional redirect URI

### Email / Password

Users can be created manually with the provided script:

```bash
npx tsx scripts/create-user.ts <email> <password> [display name]
```

Users created this way are automatically assigned the `ADMIN` role. Running the script again for an existing email resets its password and restores the `ADMIN` role (useful to recover a locked-out admin).

## Media Sync

Adding a screen does not copy existing media by itself. The sync (automatic right after adding a screen, or via the sync icon on each screen) works as follows:

- The source is the first other screen that responds, ordered by creation.
- Media are matched by **name**: any media the target does not have is downloaded from the source and re-created on the target (same name, dates, order, enabled state).
- It is one-way and additive: nothing is deleted on the target, and a media already present (same name) is skipped, so running it again is safe.
- Videos are re-created with a duration of `0`, as required by the Anthias API.

## Role System

| Role | Access |
|------|--------|
| `ADMIN` | Full access: screen management (add / remove), media, and user management (`/admin/users`) |
| `USER` | Media only: broadcast, view, edit assets. Can see the screen fleet but cannot add or remove screens |
| `PENDING` | Blocked — sees a waiting page until an admin approves them |

New Microsoft sign-ins start as `PENDING`. Admins approve them at `/admin/users`.  
An admin cannot change their own role (prevents accidental self-demotion).

## Project Structure

```
├── app/
│   ├── layout.tsx              # Root layout (NextIntl + SessionProvider)
│   ├── page.tsx                # Main dashboard
│   ├── login/                  # Login page (Microsoft + credentials)
│   ├── pending/                # Waiting-for-approval page
│   ├── admin/users/            # User management (ADMIN only)
│   └── api/
│       ├── auth/[...nextauth]/ # NextAuth handler
│       ├── screens/            # Screen CRUD (SQLite)
│       ├── assets/[id]/        # Read / update a single Anthias asset
│       ├── assets/             # Aggregated asset list across all screens
│       ├── broadcast/          # Upload + deploy to all screens
│       └── admin/users/        # User role management API
├── components/
│   ├── Header.tsx              # App header + admin link + sign-out
│   ├── Providers.tsx           # SessionProvider wrapper
│   ├── LocaleSwitcher.tsx      # FR/EN toggle (NEXT_LOCALE cookie)
│   ├── ScreenManager.tsx       # Screen list and registration
│   ├── BroadcastForm.tsx       # Broadcast form
│   ├── AssetLibrary.tsx        # Asset table
│   └── Toast.tsx               # In-app notification
├── lib/
│   ├── prisma.ts               # Prisma client (BetterSqlite3 adapter)
│   └── validate.ts             # IP/hostname and asset ID validators
├── scripts/
│   └── create-user.ts          # CLI to create admin users
├── auth.ts                     # NextAuth config (providers + callbacks)
├── middleware.ts               # Auth + role guard for all routes
├── messages/
│   ├── fr.json                 # French translations
│   └── en.json                 # English translations
├── prisma/
│   └── schema.prisma           # Screen + auth models
├── Dockerfile                  # Multi-stage build on Node 24
├── compose.yml                 # nextjs-standalone service + SQLite volume
└── docker-entrypoint.sh        # migrate deploy → node server.js
```

## Internal API

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `GET` | `/api/screens` | USER+ | List all registered screens with online status |
| `POST` | `/api/screens` | ADMIN | Add a screen `{ ip, label }` |
| `DELETE` | `/api/screens/[id]` | ADMIN | Remove a screen |
| `POST` | `/api/screens/[id]/sync` | USER+ | Copy missing media from another online screen to this one |
| `GET` | `/api/assets` | USER+ | Fetch asset list from the first available screen |
| `GET` | `/api/assets/[id]` | USER+ | Retrieve asset content (base64) |
| `GET` | `/api/assets/[id]/stream` | USER+ | Retrieve asset as binary (image or video) for the viewer |
| `PUT` | `/api/assets/[id]` | USER+ | Update asset metadata on all screens |
| `POST` | `/api/broadcast` | USER+ | Upload file + create asset on all screens |
| `GET` | `/api/admin/users` | ADMIN | List all users |
| `PATCH` | `/api/admin/users` | ADMIN | Update a user's role |

> Screen calls proxy to the Anthias REST API v2 (`http://<ip>/api/v2`).

## Adding a Language

1. Create `messages/<code>.json` with all keys from an existing file
2. Add the locale code to `i18n/routing.ts` → `locales` array
3. Add the locale code to `components/LocaleSwitcher.tsx` → `locales` array

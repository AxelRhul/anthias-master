# Anthias Master

A **Next.js** web application for centrally managing an [Anthias](https://github.com/Screenly/anthias) screen fleet. Upload a media file once and deploy it to all your screens simultaneously via the Anthias v2 API.

## Features

- **Group broadcast** — push an image or video to the entire fleet in one click
- **Screen management** — register any Anthias instance by IP/hostname, remove it if needed
- **Asset deletion** — delete an asset from the whole fleet, or remove every disabled (OFF) asset in one click, with a confirmation step
- **Media sync** — copy the media of an existing screen to a new or out-of-date one, with one click on the sync icon (automatic when a screen is added)
- **Media library** — view and edit already-deployed assets (name, duration, dates, enabled state)
- **Authentication** — login via Microsoft (Entra ID / Azure AD) or email + password
- **Role-based access** — four roles: `SUPER_ADMIN`, `ADMIN`, `USER`, `PENDING`; new users wait for approval
- **User management** — admin panel to approve new users and switch them between `USER` and `ADMIN`
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

# 5. Create the SUPER_ADMIN account (the password is asked interactively)
npx tsx scripts/create-user.ts you@example.com "Your Name"

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
Prisma migrations run automatically on container startup via `docker/entrypoint.sh`.  
A self-signed TLS certificate is generated automatically on first start and stored in the `nginx_certs` volume. Set `TLS_HOST` in `.env` to the IP or hostname users type in the browser (it is written into the certificate's `subjectAltName`; changing it regenerates the certificate on the next start).

```
Public URL  : https://<server-ip>:3000
DATABASE_URL: file:/app/data/prod.db  (overridable via env)
```

> The browser warns about the self-signed certificate. To remove the warning, import `server.crt` (copy it with `docker cp anthias-nginx:/etc/nginx/certs/server.crt .`) into the trusted certificates of your machines, or put your own `server.crt` / `server.key` in the `nginx_certs` volume.

### First admin account (in Docker)

```bash
docker exec -it nextjs-standalone-container npx tsx scripts/create-user.ts you@example.com "Your Name"
```

The password is asked interactively (12 to 72 characters). For automation, set `CREATE_USER_PASSWORD` instead — never pass the password as an argument, it would end up in the shell history.

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
| `NEXTAUTH_SECRET` | Yes | Random secret for JWT signing, at least 32 characters — generate with `openssl rand -base64 32`. The production server refuses to start if it is missing or still the example value |
| `NEXTAUTH_URL` | Yes | Public base URL of the app (e.g. `https://192.168.1.72:3000`) |
| `AZURE_AD_CLIENT_ID` | Optional | Azure App Registration client ID |
| `AZURE_AD_CLIENT_SECRET` | Optional | Azure App Registration client secret |
| `AZURE_AD_TENANT_ID` | Optional | Azure tenant **GUID**. Microsoft login is only enabled when the three Azure variables are set, and only accepts accounts of this tenant (`common` / `organizations` are rejected) |
| `ANTHIAS_USER` / `ANTHIAS_PASSWORD` | Optional | Credentials sent to the Anthias devices if "Basic authentication" is enabled in their settings |
| `TLS_HOST` | No | IP or hostname used in the nginx certificate (default: `localhost`) |
| `PORT` | No | Listening port (default: `3000`) |

### `.env.example`

```env
DATABASE_URL="file:./dev.db"
# Required, at least 32 characters. Generate with: openssl rand -base64 32
NEXTAUTH_SECRET=replace_with_openssl_rand_base64_32
NEXTAUTH_URL=http://localhost:3000

# Microsoft Entra ID (optional — leave empty to disable Microsoft login)
# AZURE_AD_TENANT_ID must be the tenant GUID (not "common" / "organizations")
AZURE_AD_CLIENT_ID=
AZURE_AD_CLIENT_SECRET=
AZURE_AD_TENANT_ID=

# Anthias devices (optional) — set these if "Basic authentication" is enabled in the devices' settings
ANTHIAS_USER=
ANTHIAS_PASSWORD=

# Hostname or IP used in the self-signed HTTPS certificate generated by the nginx container
TLS_HOST=localhost
```

## Authentication

### Microsoft (Entra ID / Azure AD)

1. Go to **Azure Portal → App registrations → New registration**
2. Supported account types: `Accounts in this organizational directory only`
3. Redirect URI: `Web` → `http://localhost:3000/api/auth/callback/azure-ad`
4. Under **Certificates & secrets**, create a new client secret
5. Copy **Application (client) ID**, **Directory (tenant) ID** and the secret value into `.env`
6. For production, add your public URL as an additional redirect URI

Only accounts from the tenant set in `AZURE_AD_TENANT_ID` can sign in (the token's `tid` claim is checked). A Microsoft account whose email matches an existing local account is linked to it, **except the `SUPER_ADMIN`**, which can only sign in with its password. Provider tokens are not stored in the database.

### Email / Password

The `SUPER_ADMIN` is created with the provided script (the password is asked interactively):

```bash
npx tsx scripts/create-user.ts <email> [display name]
```

Password sign-in is limited to 5 failed attempts per email and 30 per client address every 15 minutes (plus a rate limit in nginx). Emails are case-insensitive. Sessions last 12 hours.

The user created this way is the **`SUPER_ADMIN`**. There can only be one: the script refuses to run if another `SUPER_ADMIN` already exists. Running it again with the same email resets the password and restores the `SUPER_ADMIN` role (useful to recover a locked-out account).

## Security

- **Every API route checks the session** (approved role, read from the database) — the proxy is not the only barrier. State-changing requests coming from another site are refused.
- **Uploads are validated by content**: only JPEG, PNG, GIF, WebP, MP4, WebM, MOV and Ogg are accepted (SVG and HTML are rejected), whatever type the browser announces. Media are served with `nosniff` and a sandboxing CSP; unknown content is only offered as a download.
- **Screen addresses** are validated: loopback, link-local (cloud metadata) and ambiguous spellings (`0177.0.0.1`, `2130706433`) are refused, hostnames are resolved and checked. Private ranges (192.168.x.x…) stay allowed.
- **Security headers** (CSP, `X-Frame-Options`, `nosniff`, `Referrer-Policy`) are set on every response. HSTS is deliberately not enabled because the certificate is self-signed.
- **Anthias devices** are reached over plain HTTP on the local network. Enable *Basic authentication* in their settings and set `ANTHIAS_USER` / `ANTHIAS_PASSWORD`, and keep them on an isolated network segment: anyone who can reach a device directly bypasses the roles of this app.
- Upload size is checked before the body is read (100 MB), and transfers between devices are capped.

## Media Sync

Adding a screen does not copy existing media by itself. The sync (automatic right after adding a screen, or via the sync icon on each screen) works as follows:

- The source is the first other screen that responds, ordered by creation.
- Media are matched by **name**: any media the target does not have is downloaded from the source and re-created on the target (same name, dates, order, enabled state).
- It is one-way and additive: nothing is deleted on the target, and a media already present (same name) is skipped, so running it again is safe.
- Videos are re-created with a duration of `0`, as required by the Anthias API.

## Asset Deletion

Asset IDs are generated by each Anthias device, so they differ between screens. Deleting an asset therefore works as follows:

- On the screen shown in the library (the oldest one), the asset is deleted by its ID.
- On every other screen, assets with the **same name** are deleted.
- "Delete OFF" targets the disabled assets of the library screen, then applies the same rule to the rest of the fleet.
- A screen that is unreachable is reported as a failure in the result toast; its assets are left untouched.

## Role System

| Role | Access |
|------|--------|
| `SUPER_ADMIN` | Everything an admin can do, plus promote / demote admins. Only exists through `scripts/create-user.ts` and cannot be assigned from the UI or API |
| `ADMIN` | Screen management (add / remove), media, and user management: approve new users, switch non-admin users between `USER` and `ADMIN`. Cannot modify other admins |
| `USER` | Media only: broadcast, view, edit assets. Can see the screen fleet but cannot add or remove screens |
| `PENDING` | Blocked — sees a waiting page until an admin approves them |

New Microsoft sign-ins start as `PENDING`. On first login an admin clicks **Approve** at `/admin/users` (the user becomes `USER`). After that the role is a simple `USER` / `ADMIN` dropdown.  
Nobody can change their own role, and nobody can modify the `SUPER_ADMIN`.

## Project Structure

The code lives in `src/` and is organized **by feature**: each folder in `src/features/` groups the UI, logic and types of one subject. `src/app/` only contains routing (pages, layouts, API route handlers).

```
├── src/
│   ├── app/                        # Routing only
│   │   ├── layout.tsx, globals.css
│   │   ├── page.tsx                # Dashboard (renders useDashboard + dialogs)
│   │   ├── login/  pending/        # Login and waiting-for-approval pages
│   │   ├── admin/users/            # User management page (ADMIN only)
│   │   └── api/                    # Route handlers (see "Internal API")
│   ├── features/
│   │   ├── auth/                   # auth-options, require-user/admin, roles, rate-limit
│   │   ├── screens/                # ScreenManager, host validation, SSRF guard
│   │   ├── assets/                 # AssetLibrary, BroadcastForm, preview/edit dialogs, mime detection, deletion
│   │   ├── users/                  # UserManagement UI
│   │   └── dashboard/              # use-dashboard hook (state and actions of the main page)
│   ├── components/                 # Shared UI: Header, Toast, ConfirmDialog, LocaleSwitcher, Providers
│   ├── lib/                        # Shared server helpers: prisma, anthias client, errors
│   ├── i18n/  messages/            # next-intl request config and fr/en translations
│   ├── types/                      # NextAuth type augmentation
│   ├── proxy.ts                    # Auth + role guard for all routes (Next.js proxy, formerly middleware)
│   └── instrumentation.ts          # Startup checks (NEXTAUTH_SECRET)
├── prisma/                         # schema.prisma + migrations
├── scripts/                        # create-user.ts (SUPER_ADMIN), purge-provider-tokens.ts
├── docker/
│   ├── entrypoint.sh               # migrate deploy → node server.js
│   └── nginx/                      # HTTPS reverse proxy (Dockerfile, entrypoint, nginx.conf)
├── Dockerfile                      # Multi-stage build on Node 24
├── compose.yml                     # nextjs-standalone + nginx services, SQLite and certificate volumes
└── next.config.ts, tsconfig.json, eslint.config.mjs, prisma.config.ts
```

The `@/` import alias points to `src/` (e.g. `@/features/auth/roles`).

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
| `DELETE` | `/api/assets/[id]` | USER+ | Delete an asset on all screens |
| `DELETE` | `/api/assets` | USER+ | Delete every disabled (OFF) asset on all screens |
| `PUT` | `/api/assets/[id]` | USER+ | Update asset metadata on all screens |
| `POST` | `/api/broadcast` | USER+ | Upload file + create asset on all screens |
| `GET` | `/api/admin/users` | ADMIN | List all users |
| `PATCH` | `/api/admin/users` | ADMIN | Update a user's role (admins can only modify non-admin users) |

> Screen calls proxy to the Anthias REST API v2 (`http://<ip>/api/v2`).

## Adding a Language

1. Create `src/messages/<code>.json` with all keys from an existing file
2. Add the locale code to `src/i18n/request.ts` → `locales` array
3. Add the locale code to `src/components/LocaleSwitcher.tsx` → `locales` array

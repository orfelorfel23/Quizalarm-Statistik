<p align="center">
  <img src="public/favicon.svg" alt="Quizalarm-Statistik Logo" width="128" />
</p>

<h1 align="center">Quizalarm-Statistik</h1>
<p align="center"><strong>Lightweight read-only statistics dashboard for Quizalarm data stored in Baserow, secured via an Nginx token-injection proxy.</strong></p>

<p align="center">
  <a href="README.md">🇬🇧 English</a> · <a href="LIESMICH.md">🇩🇪 Deutsch</a>
</p>

---

## Overview

**Quizalarm-Statistik** (`Quizalarm-Stat`) is a static React + Vite analytics dashboard backed by an `nginx:alpine` reverse proxy (~25 MB container) for evaluating Quizalarm quiz results stored in Baserow. Team leaders sign in for their fire department or team and inspect live rankings, per-question statistics, and individual participant results.

```text
Browser (React SPA)
   │
   ├── GET /config.json              (public runtime config, NO token)
   ├── GET/POST ${QUIZALARM_API_URL} (/api/teams, /api/teams/auth)
   └── GET /api/baserow/...          (no Authorization header)
          │
          ▼
┌──────────────────────────────────────────────────────────┐
│  nginx:alpine Container (:7850)                          │
│  1. limit_except GET { deny all; }                       │
│  2. Table ID whitelist regex (${ALLOWED_TABLE_IDS})      │
│  3. Injects Authorization: Token ${BASEROW_TOKEN}        │
│  4. Denies all other /api/baserow/* paths with HTTP 403  │
└─────────────────────────┬────────────────────────────────┘
                          │
                          ▼
               Baserow (${BASEROW_URL})
```

---

## Features

- **Zero-Token-Exposure Security Proxy**: The Baserow API token (`BASEROW_TOKEN`) never leaves the server, is never included in `/config.json`, and is injected exclusively by `nginx` before forwarding requests.
- **Read-Only & Table-Whitelisted Proxy**: Only HTTP `GET` is permitted, and only Baserow table IDs configured via `TABLE_ANSWERS` and `TABLE_SET_*` environment variables are reachable (`403` for everything else).
- **Dynamic Runtime Configuration Without Rebuilds**: Add new question sets (`TABLE_SET_D`, `LABEL_SET_D`, etc.) via environment variables and restart the container—`deploy/docker-entrypoint.sh` regenerates `/usr/share/nginx/html/config.json` and `/etc/nginx/nginx.conf` automatically.
- **Team Leader Authentication**: Searchable team/fire-department selector backed by `${QUIZALARM_API_URL}/api/teams` and `/api/teams/auth`, with a direct password-request redirect (`/?feedback=1&team=...`) when no password is set or forgotten.
- **Team-Scoped Analytics**:
  - **Overview KPIs**: Active participants, submitted answers, overall correct rate (%), and configured question sets.
  - **Ranking (`RankingTabs`)**: Per-question-set leaderboards sorted by total points and correct answers.
  - **Question Statistics (`QuestionStats`)**: Per-question answer distribution and breakdown.
  - **User Detail (`UserDetail`)**: Individual participant results and answers.
- **Live Polling & Auto-Mock Mode**: Polls Baserow every `POLL_INTERVAL_MS` (default `20000` ms) and automatically falls back to built-in mock data (`src/lib/mock.ts`) during local development when no proxy/table IDs are configured.
- **Firefighter Dark Theme**: Custom dark theme with firefighter-red accents built with Tailwind CSS and Radix UI.

---

## How It Works & Tech Stack

### Security Proxy Model (`deploy/nginx.conf.template` & `deploy/docker-entrypoint.sh`)

1. At container startup, `deploy/docker-entrypoint.sh` collects `TABLE_ANSWERS` and all `TABLE_SET_<KEY>` / `LABEL_SET_<KEY>` variables, writes a public `/usr/share/nginx/html/config.json` (containing **no token**), and builds the `ALLOWED_TABLE_IDS` regex (`tableA|tableB|...`).
2. If `BASEROW_URL` contains `br.orfel.de`, the entrypoint rewrites it to `http://baserow:80` for internal Docker routing (avoiding hairpin NAT) while preserving `BASEROW_HOST` for the upstream `Host` header.
3. `envsubst` renders `/etc/nginx/nginx.conf` with `chmod 600`.
4. Only requests matching `^/api/baserow/api/database/rows/table/(${ALLOWED_TABLE_IDS})/` are forwarded:
   - `limit_except GET { deny all; }` rejects any mutating HTTP methods.
   - `proxy_set_header Authorization "Token ${BASEROW_TOKEN}";` injects authentication server-side.
   - `proxy_hide_header Set-Cookie;` and `Cache-Control: no-store` prevent caching or cookie leakage.
   - All other requests under `/api/baserow/` return `403`.

> **Recommendation:** Create a dedicated Baserow API token restricted to **read-only (`SELECT`)** permissions for these tables only.

### Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 18, TypeScript, Vite, React Router DOM, TanStack React Query, Tailwind CSS, Radix UI, Recharts, Lucide React |
| **Runtime & Proxy** | `nginx:alpine` + `gettext` (`envsubst`), POSIX shell entrypoint (`deploy/docker-entrypoint.sh`) |
| **Data Backend** | Baserow REST API (read-only) + Quizalarm Teams API (`${QUIZALARM_API_URL}`) |
| **Testing & Tooling** | Vitest, Testing Library, ESLint |

### Ports

| Component | Port | Notes |
|-----------|------|-------|
| **Docker / Nginx Runtime** | `7850` | Configurable via `PORT` environment variable |
| **Vite Dev Server** | `5173` (default) | Local development (`npm run dev`) |

---

## Prerequisites & Installation

### Prerequisites

- **Node.js** (v22 in Docker) + npm or Bun (for local development/building)
- **Docker** (for containerized deployment)
- Running **Baserow** instance with a read-only API token and configured tables

### Local Development

```bash
git clone https://github.com/orfelorfel23/Quizalarm-Statistik.git
cd Quizalarm-Statistik
npm install
npm run dev
```

In local dev mode (without the Nginx proxy or with `tables.answers === 0`), the app automatically activates **Mock Mode** with demo data.

### Production / Docker Deployment (`Jannik-Cloud`)

The service image is built locally and pushed to the Gitea Container Registry (`git.orfel.de/jannik/quizalarm-stat:latest`):

```bash
docker build -t git.orfel.de/jannik/quizalarm-stat:latest .
docker push git.orfel.de/jannik/quizalarm-stat:latest
```

In `Jannik-Cloud`, the service layout uses:

```text
services/quizalarm-stat/
├── docker-compose.yml         # Uses pre-built image on jannik-cloud-net
├── quizalarm-stat.caddy       # Reverse proxy fragment (quizalarm-stat.orfel.de -> quizalarm-stat:7850)
├── generate-env.sh            # Generates .env and encrypts to .env.age
├── .env.age                   # AGE-encrypted environment config
├── service.enabled            # Empty marker file to enable service
└── README.md
```

Live URL: <https://quizalarm-stat.orfel.de>

---

## Configuration

### Environment Variables (`.env` / `deploy/generate-env.sh`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `7850` | Port on which Nginx listens |
| `BASEROW_URL` | Yes | — | Internal or public Baserow base URL (e.g., `http://baserow:80`) |
| `BASEROW_HOST` | No | Derived from `BASEROW_URL` | `Host` header forwarded to Baserow |
| `BASEROW_TOKEN` | Yes | — | Read-only Baserow API token (never exposed to browser) |
| `SITE_TITLE` | No | `Quizalarm Auswertung` | Header title written to `/config.json` |
| `SITE_SUBTITLE` | No | `Live-Ergebnisse` | Header subtitle written to `/config.json` |
| `POLL_INTERVAL_MS` | No | `20000` | Baserow answer polling interval in milliseconds |
| `QUIZALARM_API_URL` | No | `https://quizalarm.orfel.de` | Base URL for `/api/teams` and `/api/teams/auth` |
| `TABLE_ANSWERS` | Yes | — | Baserow table ID containing submitted answers |
| `TABLE_SET_<KEY>` | Yes (at least one) | — | Baserow table ID for question set `<KEY>` (e.g., `TABLE_SET_A`, `TABLE_SET_B`, `TABLE_SET_C`) |
| `LABEL_SET_<KEY>` | No | `Fragenset <KEY>` | Display label for question set `<KEY>` |

Example `.env`:

```env
PORT=7850
BASEROW_URL=http://baserow:80
BASEROW_TOKEN=…              # read-only
SITE_TITLE=Quizalarm Auswertung
SITE_SUBTITLE=Live-Ergebnisse
POLL_INTERVAL_MS=20000

TABLE_ANSWERS=123
TABLE_SET_A=124
TABLE_SET_B=125
TABLE_SET_C=126
# TABLE_SET_D=127
# LABEL_SET_D=Fragenset D
```

To add more question sets, simply add `TABLE_SET_<KEY>` (and optionally `LABEL_SET_<KEY>`) and restart the container—no rebuild is required as long as the Baserow column names stay unchanged.

### Baserow Column Mapping (`src/config/mappings.ts`)

Column names are queried with `user_field_names=true` and configured in `src/config/mappings.ts`:

- **Answers table (`FIELDS.answers`)**: `Nutzername`, `Fragenset`, `Frage_ID`, `Antwort`, `Richtig`, `Punkte`, `Zeitstempel`
- **Question set tables (`FIELDS.question`)**: `id` (Baserow row ID), `Frage`, `Richtige Antwort`, `Antwort A`, `Antwort B`, `Antwort C`, `Antwort D`, `Bild`

---

## Usage

### Running Tests & Checks

```bash
npm run test       # Run Vitest unit tests
npm run lint       # Run ESLint
npm run build      # Build production bundle into dist/
```

### Dashboard Workflow

1. Open the dashboard URL (e.g., `https://quizalarm-stat.orfel.de`).
2. Search for and select a team or fire department on the **Teamleiter Anmeldung** screen, then enter the team leader password.
3. Once authenticated, the session (`quizalarm_team_session`) unlocks:
   - **Overview cards** summarizing team participants, total answers, accuracy rate, and active question sets.
   - **Ranking** tab showing per-set scores.
   - **Frage-Statistik** tab analyzing individual questions.
   - **Nutzer-Detail** tab inspecting single-participant submissions.

---

## Project Structure

```text
Quizalarm-Statistik/
├── deploy/
│   ├── docker-compose.yml       # Production compose (pre-built image, 128M RAM limit)
│   ├── docker-entrypoint.sh     # Generates config.json & renders nginx.conf via envsubst
│   ├── generate-env.sh          # Interactive .env & .env.age generator
│   ├── nginx.conf.template      # Read-only, token-injecting, table-whitelisted Nginx proxy
│   └── quizalarm-stat.caddy     # Caddy reverse proxy fragment
├── public/
│   ├── config.json              # Default local dev/mock configuration
│   ├── favicon.svg              # Project logo
│   └── wappen.png               # Emblem graphic
├── src/
│   ├── components/
│   │   ├── Header.tsx           # App header & logout button
│   │   ├── ImagePreview.tsx     # Question image modal/preview
│   │   ├── LoadingState.tsx     # Loading spinner state
│   │   ├── Overview.tsx         # KPI summary cards
│   │   ├── QuestionStats.tsx    # Per-question statistics view
│   │   ├── RankingTabs.tsx      # Per-question-set leaderboard tabs
│   │   ├── TeamLogin.tsx        # Team search & password login flow
│   │   └── UserDetail.tsx       # Individual participant breakdown
│   ├── config/
│   │   └── mappings.ts          # Baserow field name mappings (FIELDS.answers / FIELDS.question)
│   ├── hooks/
│   │   └── useBaserow.ts        # React Query hooks with polling & team participant filtering
│   ├── lib/
│   │   ├── auth.ts              # Team session persistence (sessionStorage / localStorage)
│   │   ├── baserow.ts           # Paginated fetchTable client via /api/baserow
│   │   ├── config.ts            # Runtime /config.json loader & auto-mock detection
│   │   └── mock.ts              # Demo mock data
│   └── pages/
│       └── Index.tsx            # Main dashboard & auth gate
├── Dockerfile                   # Multi-stage Vite build + nginx:alpine runtime
└── package.json                 # Dependencies & scripts
```

---

## License

Private / Internal Project. Hosted publicly without a separate open-source `LICENSE` file.

<p align="center">
  <img src="public/favicon.svg" alt="Quizalarm-Statistik Logo" width="128" />
</p>

<h1 align="center">Quizalarm-Statistik</h1>
<p align="center"><strong>Leichtgewichtiges Read-Only-Auswertungs-Dashboard für Quizalarm-Daten aus Baserow, abgesichert über einen Nginx-Token-Injection-Proxy.</strong></p>

<p align="center">
  <a href="README.md">🇬🇧 English</a> · <a href="LIESMICH.md">🇩🇪 Deutsch</a>
</p>

---

## Überblick

**Quizalarm-Statistik** (`Quizalarm-Stat`) ist ein statisches React-+-Vite-Auswertungs-Dashboard mit vorgeschaltetem `nginx:alpine`-Reverse-Proxy (~25 MB Container) zur Live-Auswertung von Quizalarm-Ergebnissen aus Baserow. Teamleiter melden sich für ihr Team bzw. ihre Feuerwehr an und sehen Ranglisten, Frage-Statistiken sowie Detailauswertungen einzelner Teilnehmer.

```text
Browser (React-SPA)
   │
   ├── GET /config.json              (öffentliche Laufzeit-Config, OHNE Token)
   ├── GET/POST ${QUIZALARM_API_URL} (/api/teams, /api/teams/auth)
   └── GET /api/baserow/...          (ohne Authorization-Header)
          │
          ▼
┌──────────────────────────────────────────────────────────┐
│  nginx:alpine-Container (:7850)                          │
│  1. limit_except GET { deny all; }                       │
│  2. Tabellen-ID-Whitelist-Regex (${ALLOWED_TABLE_IDS})   │
│  3. Setzt Authorization: Token ${BASEROW_TOKEN}          │
│  4. Blockiert alle anderen /api/baserow/*-Pfade mit 403  │
└─────────────────────────┬────────────────────────────────┘
                          │
                          ▼
               Baserow (${BASEROW_URL})
```

---

## Funktionen

- **Sicherheits-Proxy ohne Token-Exposition**: Der Baserow-API-Token (`BASEROW_TOKEN`) verlässt niemals den Server, steht nicht in `/config.json` und wird ausschließlich durch `nginx` vor der Weiterleitung injiziert.
- **Read-Only-Zugriff & Tabellen-Whitelist**: Ausschließlich HTTP `GET` ist erlaubt, und nur die über `TABLE_ANSWERS` und `TABLE_SET_*` konfigurierten Tabellen-IDs sind erreichbar (`403` für alles andere).
- **Dynamische Konfiguration ohne Rebuild**: Neue Fragensets (`TABLE_SET_D`, `LABEL_SET_D` usw.) einfach per Umgebungsvariable ergänzen und Container neu starten – `deploy/docker-entrypoint.sh` erzeugt `/usr/share/nginx/html/config.json` und `/etc/nginx/nginx.conf` beim Start neu.
- **Teamleiter-Anmeldung**: Durchsuchbare Team-/Feuerwehr-Auswahl über `${QUIZALARM_API_URL}/api/teams` und Authentifizierung via `/api/teams/auth`, inklusive Weiterleitung zur Passwort-Anforderung (`/?feedback=1&team=...`), falls noch kein Passwort hinterlegt ist oder es vergessen wurde.
- **Teambezogene Auswertungen**:
  - **Übersichts-KPIs**: Teilnehmeranzahl, abgegebene Antworten, Korrekt-Quote (%) und aktive Fragensets.
  - **Ranking (`RankingTabs`)**: Rangliste pro Fragenset, sortiert nach Punkten und korrekten Antworten.
  - **Frage-Statistik (`QuestionStats`)**: Auswertung und Antwortverteilung je Frage.
  - **Nutzer-Detail (`UserDetail`)**: Einzelauswertung pro Teilnehmer.
- **Live-Polling & automatischer Mock-Modus**: Fragt Baserow regelmäßig im Intervall `POLL_INTERVAL_MS` (Standard `20000` ms) ab und wechselt bei lokaler Entwicklung (ohne Proxy bzw. bei `tables.answers === 0`) automatisch in den **Mock-Modus** (`src/lib/mock.ts`).
- **Feuerwehr-Dark-Theme**: Dunkles Design mit Feuerwehr-Rot-Akzenten auf Basis von Tailwind CSS und Radix UI.

---

## Funktionsweise & Tech-Stack

### Sicherheits-Proxy-Modell (`deploy/nginx.conf.template` & `deploy/docker-entrypoint.sh`)

1. Beim Container-Start sammelt `deploy/docker-entrypoint.sh` `TABLE_ANSWERS` sowie alle `TABLE_SET_<KEY>`- / `LABEL_SET_<KEY>`-Variablen, schreibt die öffentliche `/usr/share/nginx/html/config.json` (**ohne Token**) und erstellt die Regex `ALLOWED_TABLE_IDS` (`tableA|tableB|...`).
2. Enthält `BASEROW_URL` `br.orfel.de`, schreibt der Entrypoint die Adresse intern auf `http://baserow:80` um (vermeidet Hairpin-NAT), behält aber `BASEROW_HOST` als `Host`-Header bei.
3. `envsubst` rendert `/etc/nginx/nginx.conf` mit Dateiberechtigung `chmod 600`.
4. Nur Anfragen auf `^/api/baserow/api/database/rows/table/(${ALLOWED_TABLE_IDS})/` werden weitergeleitet:
   - `limit_except GET { deny all; }` blockiert alle schreibenden HTTP-Methoden.
   - `proxy_set_header Authorization "Token ${BASEROW_TOKEN}";` ergänzt den Token serverseitig.
   - `proxy_hide_header Set-Cookie;` und `Cache-Control: no-store` verhindern Cookie-Weitergabe und Caching.
   - Alle anderen Pfade unter `/api/baserow/` liefern HTTP `403`.

> **Empfehlung:** In Baserow einen eigenen, auf **SELECT (Read-Only)** beschränkten API-Token ausschließlich für diese Auswertungstabellen anlegen.

### Tech-Stack

| Schicht | Technologien |
|---------|-------------|
| **Frontend** | React 18, TypeScript, Vite, React Router DOM, TanStack React Query, Tailwind CSS, Radix UI, Recharts, Lucide React |
| **Laufzeit & Proxy** | `nginx:alpine` + `gettext` (`envsubst`), POSIX-Shell-Entrypoint (`deploy/docker-entrypoint.sh`) |
| **Daten-Backend** | Baserow REST-API (Read-Only) + Quizalarm Teams-API (`${QUIZALARM_API_URL}`) |
| **Tests & Tooling** | Vitest, Testing Library, ESLint |

### Ports

| Komponente | Port | Hinweise |
|------------|------|----------|
| **Docker-/Nginx-Laufzeit** | `7850` | Konfigurierbar über die Umgebungsvariable `PORT` |
| **Vite Dev-Server** | `5173` (Standard) | Lokale Entwicklung (`npm run dev`) |

---

## Voraussetzungen & Installation

### Voraussetzungen

- **Node.js** (v22 in Docker) + npm oder Bun (für lokale Entwicklung / Build)
- **Docker** (für den Container-Betrieb)
- Laufende **Baserow**-Instanz mit Read-Only-API-Token und eingerichteten Tabellen

### Lokale Entwicklung

```bash
git clone https://github.com/orfelorfel23/Quizalarm-Statistik.git
cd Quizalarm-Statistik
npm install
npm run dev
```

Im lokalen Dev-Modus (ohne Nginx-Proxy bzw. mit `tables.answers === 0`) läuft die App automatisch im **Mock-Modus** mit Demo-Daten.

### Produktion / Deployment in `Jannik-Cloud`

Das Service-Image wird lokal gebaut und in die Gitea Container Registry gepusht (`git.orfel.de/jannik/quizalarm-stat:latest`):

```bash
docker build -t git.orfel.de/jannik/quizalarm-stat:latest .
docker push git.orfel.de/jannik/quizalarm-stat:latest
```

In `Jannik-Cloud` besteht der Dienst aus:

```text
services/quizalarm-stat/
├── docker-compose.yml         # Nutzt das vorgebaute Image im Netzwerk jannik-cloud-net
├── quizalarm-stat.caddy       # Reverse-Proxy-Fragment (quizalarm-stat.orfel.de -> quizalarm-stat:7850)
├── generate-env.sh            # Generiert .env und verschlüsselt nach .env.age
├── .env.age                   # AGE-verschlüsselte Umgebungskonfiguration
├── service.enabled            # Leere Marker-Datei zum Aktivieren
└── README.md
```

URL: <https://quizalarm-stat.orfel.de>

---

## Konfiguration

### Umgebungsvariablen (`.env` / `deploy/generate-env.sh`)

| Variable | Erforderlich | Standard | Beschreibung |
|----------|-------------|----------|--------------|
| `PORT` | Nein | `7850` | Port, auf dem Nginx lauscht |
| `BASEROW_URL` | Ja | — | Interne oder öffentliche Baserow-URL (z. B. `http://baserow:80`) |
| `BASEROW_HOST` | Nein | Aus `BASEROW_URL` abgeleitet | `Host`-Header für die Weiterleitung an Baserow |
| `BASEROW_TOKEN` | Ja | — | Read-Only-Baserow-API-Token (wird niemals an den Browser ausgeliefert) |
| `SITE_TITLE` | Nein | `Quizalarm Auswertung` | Titel im Header (über `/config.json`) |
| `SITE_SUBTITLE` | Nein | `Live-Ergebnisse` | Untertitel im Header (über `/config.json`) |
| `POLL_INTERVAL_MS` | Nein | `20000` | Abfrage-Intervall für Antworten in Millisekunden |
| `QUIZALARM_API_URL` | Nein | `https://quizalarm.orfel.de` | Basis-URL für `/api/teams` und `/api/teams/auth` |
| `TABLE_ANSWERS` | Ja | — | Baserow-Tabellen-ID für abgegebene Antworten |
| `TABLE_SET_<KEY>` | Ja (mind. eins) | — | Baserow-Tabellen-ID für Fragenset `<KEY>` (z. B. `TABLE_SET_A`, `TABLE_SET_B`, `TABLE_SET_C`) |
| `LABEL_SET_<KEY>` | Nein | `Fragenset <KEY>` | Anzeigename für Fragenset `<KEY>` |

Beispiel-`.env`:

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

Für zusätzliche Fragensets einfach `TABLE_SET_<KEY>` (und optional `LABEL_SET_<KEY>`) ergänzen und den Container neu starten – ein Rebuild ist nicht nötig, solange die Spaltenstruktur in Baserow gleich bleibt.

### Spalten-Mapping in Baserow (`src/config/mappings.ts`)

Die Spaltennamen werden mit `user_field_names=true` abgefragt und sind in `src/config/mappings.ts` hinterlegt:

- **Antworten-Tabelle (`FIELDS.answers`)**: `Nutzername`, `Fragenset`, `Frage_ID`, `Antwort`, `Richtig`, `Punkte`, `Zeitstempel`
- **Fragenset-Tabellen (`FIELDS.question`)**: `id` (Baserow-Zeilen-ID), `Frage`, `Richtige Antwort`, `Antwort A`, `Antwort B`, `Antwort C`, `Antwort D`, `Bild`

---

## Nutzung

### Tests & Prüfungen ausführen

```bash
npm run test       # Vitest-Unit-Tests ausführen
npm run lint       # ESLint ausführen
npm run build      # Produktions-Bundle nach dist/ bauen
```

### Ablauf im Dashboard

1. Dashboard-URL öffnen (z. B. `https://quizalarm-stat.orfel.de`).
2. In der **Teamleiter Anmeldung** das eigene Team bzw. die Feuerwehr suchen, auswählen und das Teamleiter-Passwort eingeben.
3. Nach erfolgreicher Anmeldung schaltet die Session (`quizalarm_team_session`) die Ansicht frei:
   - **Übersichtskarten** für Teilnehmerzahl, Antworten, Korrekt-Quote und Fragensets.
   - Tab **Ranking** für die Bestenlisten je Fragenset.
   - Tab **Frage-Statistik** für die Auswertung einzelner Fragen.
   - Tab **Nutzer-Detail** für Ergebnisse einzelner Teilnehmer.

---

## Projektstruktur

```text
Quizalarm-Statistik/
├── deploy/
│   ├── docker-compose.yml       # Produktions-Compose (pre-built Image, 128M RAM-Limit)
│   ├── docker-entrypoint.sh     # Erzeugt config.json & rendert nginx.conf per envsubst
│   ├── generate-env.sh          # Interaktiver .env- & .env.age-Generator
│   ├── nginx.conf.template      # Read-Only-Nginx-Proxy mit Token-Injection & Whitelist
│   └── quizalarm-stat.caddy     # Caddy-Reverse-Proxy-Fragment
├── public/
│   ├── config.json              # Standard-Konfiguration für lokale Entwicklung / Mock
│   ├── favicon.svg              # Projektlogo
│   └── wappen.png               # Wappen-Grafik
├── src/
│   ├── components/
│   │   ├── Header.tsx           # Kopfzeile & Abmelden-Button
│   │   ├── ImagePreview.tsx     # Bildvorschau für Fragenbilder
│   │   ├── LoadingState.tsx     # Ladezustand-Komponente
│   │   ├── Overview.tsx         # KPI-Übersichtskarten
│   │   ├── QuestionStats.tsx    # Fragen-Statistik-Ansicht
│   │   ├── RankingTabs.tsx      # Ranglisten-Tabs pro Fragenset
│   │   ├── TeamLogin.tsx        # Teamsuche & Passwort-Anmeldung
│   │   └── UserDetail.tsx       # Detailansicht pro Teilnehmer
│   ├── config/
│   │   └── mappings.ts          # Baserow-Spalten-Mappings (FIELDS.answers / FIELDS.question)
│   ├── hooks/
│   │   └── useBaserow.ts        # React-Query-Hooks mit Polling & Team-Filterung
│   ├── lib/
│   │   ├── auth.ts              # Team-Session-Verwaltung (sessionStorage / localStorage)
│   │   ├── baserow.ts           # Paginierter fetchTable-Client über /api/baserow
│   │   ├── config.ts            # Laufzeit-Loader für /config.json & Mock-Erkennung
│   │   └── mock.ts              # Demo-Mock-Daten
│   └── pages/
│       └── Index.tsx            # Haupt-Dashboard & Login-Schranke
├── Dockerfile                   # Multi-Stage-Vite-Build + nginx:alpine-Laufzeit
└── package.json                 # Abhängigkeiten & Skripte
```

---

## Lizenz

Privates / internes Projekt. Öffentlich ohne separate Open-Source-`LICENSE`-Datei gehostet.

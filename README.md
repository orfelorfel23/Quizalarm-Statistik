# Quizalarm-Stat

Lightweight read-only Auswertungs-Dashboard für Quizalarm-Daten aus Baserow.

- **Frontend**: React + Vite (statisch), Dark Theme / Feuerwehr-Rot
- **Runtime**: ein einziger `nginx:alpine`-Container (~25 MB)
- **Datenfluss**: Browser → nginx-Proxy (Token-Injection) → Baserow

## Sicherheit

Der Baserow-API-Token wird **niemals** an den Browser ausgeliefert:

1. Token steht nur in der serverseitig generierten `nginx.conf`.
2. Browser-Requests gehen an `/api/baserow/...` ohne Authorization-Header.
3. nginx setzt `Authorization: Token …` und proxied an Baserow.
4. Nur **GET** ist erlaubt (`limit_except GET { deny all; }`).
5. Tabellen-Whitelist: nur die in `.env` konfigurierten Tabellen-IDs sind erreichbar; alles andere unter `/api/baserow/` → 403.

In den DevTools sichtbar sind ausschließlich die JSON-Antworten der Auswertungstabellen – also exakt das, was die UI ohnehin öffentlich anzeigt.

Empfehlung: in Baserow einen **eigenen, auf SELECT beschränkten** Token nur für diese Tabellen anlegen.

## Konfiguration

Alles über `.env` (siehe `deploy/generate-env.sh`):

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

Neue Sets: einfach `TABLE_SET_<KEY>` (+ optional `LABEL_SET_<KEY>`) ergänzen und Container neu starten. Kein Rebuild nötig, sofern die Spaltenstruktur in Baserow gleich bleibt.

Spalten-Mapping (stabil) in `src/config/mappings.ts`.

## Deployment in Jannik-Cloud

Die Dateien unter `deploy/` werden in dein `Jannik-Cloud`-Repo kopiert nach `services/quizalarm-stat/`:

```
services/quizalarm-stat/
├── docker-compose.yml         (aus deploy/docker-compose.yml)
├── quizalarm-stat.caddy       (aus deploy/quizalarm-stat.caddy)
├── service.init               (aus deploy/service.init)
├── generate-env.sh            (aus deploy/generate-env.sh)
├── .env.age                   (per generate-env.sh erzeugt)
├── service.enabled            (leere Datei zum Aktivieren)
└── README.md
```

Der Quellcode dieser App (alles außerhalb `deploy/`) wird nach `git.orfel.de/Jannik/Quizalarm-Stat` gepusht. `service.init` cloned ihn nach `/mnt/Jannik-Cloud-Volume-01/quizalarm-stat/app` und baut das Image.

URL: <https://quizalarm-stat.orfel.de>

## Lokale Entwicklung

```bash
npm install
npm run dev
```

Im Dev-Modus (kein Proxy verfügbar) läuft die App automatisch im **Mock-Modus** mit Demo-Daten.


# Quizalarm-Stat – Lightweight Auswertungstool

Passt sich 1:1 in dein bestehendes Jannik-Cloud-Setup ein (gleiche Struktur wie `services/quizalarm/` und `services/baserow/`). Kein Adminpanel, keine eigene DB, kein zusätzliches Backend-Framework. Konfiguration komplett über `.env` + `.env.age`.

## Architektur (Sicherheit)

```text
Browser ──HTTPS──► Caddy (zentral) ──► quizalarm-stat:7850 (Container)
                                          │  nginx:alpine
                                          │  ├── / ............ statische SPA (kein Token im Bundle)
                                          │  └── /api/baserow/* proxy → http://baserow:80
                                          │      Header "Authorization: Token …" wird hier injiziert
                                          └────► baserow:80 (intern, jannik-cloud-net)
```

**Sicherheits-Garantie für den Baserow-Token:**

- Der Token steht **ausschließlich** in der `nginx.conf` des Containers (befüllt via `envsubst` aus `BASEROW_TOKEN` beim Start).
- Er wird **niemals** in das JS-Bundle, in `config.json` oder in irgendeinen vom Browser ladbaren Pfad geschrieben.
- Der Browser sieht in DevTools nur `fetch('/api/baserow/api/database/rows/table/123/...')` ohne Authorization-Header. Erst nginx setzt intern `proxy_set_header Authorization "Token $BASEROW_TOKEN"` und leitet an `baserow:80` weiter.
- nginx-Location `/api/baserow/` ist **read-only**: nur `GET` erlaubt (`limit_except GET { deny all; }`), kein PATCH/POST/DELETE — selbst wenn jemand den Proxy missbraucht, kann nichts geschrieben werden.
- Optional zusätzlich: Whitelist auf die konfigurierten Tabellen-IDs per `location ~ ^/api/baserow/api/database/rows/table/(123|124|125|126)/`, sodass der Proxy nicht als generelles Baserow-Gateway dient.
- `Server`-Header und nginx-Version werden ausgeblendet (`server_tokens off`).
- Die `.env` liegt verschlüsselt als `.env.age` im Repo, identisch zu deinen anderen Services.

Ein Angreifer mit DevTools sieht maximal die Antwortdaten der konfigurierten Tabellen — also exakt das, was die Auswertungsseite ohnehin öffentlich zeigt. Der Token selbst ist nicht extrahierbar.

## Konfiguration (`.env`)

```text
# Baserow
BASEROW_URL=http://baserow:80
BASEROW_TOKEN=<read-only Token, in Baserow auf SELECT beschränkt>

# Anzeige (dynamischer Titel)
SITE_TITLE=Quizalarm Auswertung
SITE_SUBTITLE=Live-Ergebnisse

# Tabellen (weitere TABLE_SET_* einfach anhängen)
TABLE_ANSWERS=123
TABLE_SET_A=124
TABLE_SET_B=125
TABLE_SET_C=126
# TABLE_SET_D=127

PORT=7850
```

Beim Container-Start generiert ein Entrypoint:
- `nginx.conf` (mit Token + Tabellen-Whitelist) via `envsubst`
- `/usr/share/nginx/html/config.json` mit **nur den nicht-sensiblen** Werten: `SITE_TITLE`, `SITE_SUBTITLE`, Tabellen-IDs, Liste der aktiven Sets. Kein Token.

Tabellenstruktur ist stabil → Feldnamen-Mapping ist Hard-Code in `src/config/mappings.ts` (basierend auf den CSV-Headern, die du exportiert hast – identisch). Neue Sets: `.env` ergänzen, Container neu starten. Mapping-Änderungen: Code editieren + `service.init` neu bauen.

## Was die SPA zeigt

Dark Dashboard, Feuerwehr-Rot. Read-only, Polling alle ~20 s, kein Login.

1. **Übersicht** – Teilnehmer, Antworten gesamt, Verteilung pro Set
2. **Ranking pro Set (A/B/C/…)** – Tabs, dynamisch aus aktiven `TABLE_SET_*`
3. **Frage-Statistik** – pro Frage: Antwortverteilung, Korrekt-Quote
4. **Nutzer-Detail** – pro Teilnehmer: gegebene Antworten, Punkte, Rang

## Repo-Struktur

**Neues Gitea-Repo `Quizalarm-Stat`** (Quellcode der SPA + Container):

```text
Quizalarm-Stat/
├── Dockerfile              # multi-stage: node build → nginx:alpine
├── nginx.conf.template     # mit ${BASEROW_TOKEN} etc., GET-only, Whitelist
├── docker-entrypoint.sh    # envsubst nginx.conf + config.json, exec nginx
├── package.json / vite.config.ts / tsconfig …
└── src/
    ├── config/mappings.ts
    ├── lib/{config,baserow}.ts
    ├── hooks/useBaserowTable.ts
    ├── components/{Header,Overview,RankingTabs,QuestionStats,UserDetail}.tsx
    └── pages/Index.tsx
```

**Im Jannik-Cloud-Repo unter `services/quizalarm-stat/`** (1:1 wie `services/quizalarm/`):

```text
services/quizalarm-stat/
├── .env.age
├── README.md
├── docker-compose.yml      # baut /mnt/Jannik-Cloud-Volume-01/quizalarm-stat/app
├── generate-env.sh         # fragt Token, Tabellen-IDs, Titel ab
├── quizalarm-stat.caddy    # quizalarm-stat.orfel.de → quizalarm-stat:7850
├── service.init            # clone Quizalarm-Stat aus Gitea, docker compose build
└── service.enabled
```

Caddy-Snippet:

```text
quizalarm-stat.orfel.de {
    reverse_proxy quizalarm-stat:7850
}
```

## Was ich jetzt in diesem Lovable-Projekt baue

Lovable hostet den **SPA-Quellcode** (= Inhalt des späteren Gitea-Repos `Quizalarm-Stat`):

1. Design-System (Dark + Feuerwehr-Rot) in `index.css` / `tailwind.config.ts` mit semantischen Tokens.
2. `src/lib/config.ts` – lädt `/config.json` zur Laufzeit (Titel, Sets, Tabellen-IDs).
3. `src/lib/baserow.ts` – fetched gegen `/api/baserow/api/database/rows/table/<id>/?user_field_names=true` mit Pagination, **ohne** Authorization-Header (den setzt nginx).
4. `src/config/mappings.ts` – Spaltennamen exakt wie in den CSVs.
5. `src/hooks/useBaserowTable.ts` – React-Query mit 20-s-Polling.
6. Komponenten: `Header` (dynamischer Titel), `Overview`, `RankingTabs`, `QuestionStats`, `UserDetail`.
7. **Mock-Fallback** für Lovable-Preview: wenn `/config.json` oder der Proxy nicht erreichbar ist, kommen Demo-Daten — damit du das UI hier sofort siehst.
8. **Deploy-Bundle** im Repo abgelegt (`deploy/`): `Dockerfile`, `nginx.conf.template`, `docker-entrypoint.sh`, `docker-compose.yml`, `generate-env.sh`, `quizalarm-stat.caddy`, `service.init`, `README.md` — alles fertig zum Übernehmen in Gitea / Jannik-Cloud.

Keine Änderungen an deinem Server durch mich — du `git clone`st das Ergebnis und stellst es in dein gewohntes Setup.

#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/.env"
AGE_PUBLIC_KEY_FILE="${SCRIPT_DIR}/../../keys/age-public-key.txt"
ENV_AGE_FILE="${SCRIPT_DIR}/.env.age"

echo "=== Quizalarm-Stat — Umgebungsvariablen generieren ==="
echo ""

read -p "Baserow interne URL [http://baserow:80]: " BASEROW_URL
BASEROW_URL="${BASEROW_URL:-http://baserow:80}"

read -p "Baserow READ-ONLY API Token: " BASEROW_TOKEN
if [[ -z "${BASEROW_TOKEN}" ]]; then
    echo "WARNUNG: Kein Token angegeben."
    BASEROW_TOKEN="DEIN_TOKEN_HIER"
fi

read -p "Site-Titel [Quizalarm Auswertung]: " SITE_TITLE
SITE_TITLE="${SITE_TITLE:-Quizalarm Auswertung}"

read -p "Site-Untertitel [Live-Ergebnisse]: " SITE_SUBTITLE
SITE_SUBTITLE="${SITE_SUBTITLE:-Live-Ergebnisse}"

read -p "Tabellen-ID Antworten: " TABLE_ANSWERS
read -p "Tabellen-ID Set A: " TABLE_SET_A
read -p "Tabellen-ID Set B: " TABLE_SET_B
read -p "Tabellen-ID Set C: " TABLE_SET_C

cat > "${ENV_FILE}" <<EOF
# === Quizalarm-Stat ===
PORT=7850
BASEROW_URL=${BASEROW_URL}
BASEROW_TOKEN=${BASEROW_TOKEN}

SITE_TITLE=${SITE_TITLE}
SITE_SUBTITLE=${SITE_SUBTITLE}
POLL_INTERVAL_MS=20000

TABLE_ANSWERS=${TABLE_ANSWERS}
TABLE_SET_A=${TABLE_SET_A}
TABLE_SET_B=${TABLE_SET_B}
TABLE_SET_C=${TABLE_SET_C}
# Weitere Sets einfach ergaenzen, z.B.:
# TABLE_SET_D=...
# LABEL_SET_D=Fragenset D
EOF

echo ""
echo ".env erstellt: ${ENV_FILE}"

if [[ -f "${AGE_PUBLIC_KEY_FILE}" ]]; then
    AGE_PUBLIC_KEY=$(tr -d '[:space:]' < "${AGE_PUBLIC_KEY_FILE}")
    age -r "${AGE_PUBLIC_KEY}" -o "${ENV_AGE_FILE}" "${ENV_FILE}"
    echo ".env.age verschluesselt: ${ENV_AGE_FILE}"
else
    echo "WARNUNG: AGE Public Key nicht gefunden. Verschluesselung uebersprungen."
fi

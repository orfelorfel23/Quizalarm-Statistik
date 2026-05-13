#!/bin/sh
set -eu

: "${BASEROW_URL:?BASEROW_URL missing}"
: "${BASEROW_TOKEN:?BASEROW_TOKEN missing}"
: "${PORT:=7850}"
: "${SITE_TITLE:=Quizalarm Auswertung}"
: "${SITE_SUBTITLE:=Live-Ergebnisse}"
: "${TABLE_ANSWERS:?TABLE_ANSWERS missing}"
: "${POLL_INTERVAL_MS:=20000}"

# --- Collect all TABLE_SET_* env vars (A, B, C, D, …) ---
SETS_JSON=""
ALLOWED_IDS="${TABLE_ANSWERS}"
for var in $(env | awk -F= '/^TABLE_SET_[A-Z0-9]+=/{print $1}' | sort); do
    key="${var#TABLE_SET_}"
    eval "id=\${$var}"
    [ -z "$id" ] && continue
    label_var="LABEL_SET_${key}"
    eval "label=\${$label_var:-Fragenset $key}"
    [ -n "$SETS_JSON" ] && SETS_JSON="${SETS_JSON},"
    SETS_JSON="${SETS_JSON}{\"key\":\"${key}\",\"label\":\"${label}\",\"tableId\":${id}}"
    ALLOWED_IDS="${ALLOWED_IDS}|${id}"
done

# --- Write public config (NO TOKEN HERE) ---
cat > /usr/share/nginx/html/config.json <<EOF
{
  "siteTitle": "${SITE_TITLE}",
  "siteSubtitle": "${SITE_SUBTITLE}",
  "tables": {
    "answers": ${TABLE_ANSWERS},
    "sets": [${SETS_JSON}]
  },
  "pollIntervalMs": ${POLL_INTERVAL_MS},
  "mock": false
}
EOF

# --- Render nginx.conf with token + table whitelist ---
export PORT BASEROW_URL BASEROW_TOKEN
export ALLOWED_TABLE_IDS="${ALLOWED_IDS}"

envsubst '${PORT} ${BASEROW_URL} ${BASEROW_TOKEN} ${ALLOWED_TABLE_IDS}' \
    < /etc/nginx/templates-src/nginx.conf.template \
    > /etc/nginx/nginx.conf

# Sanity: nginx.conf is root-readable only (token inside)
chmod 600 /etc/nginx/nginx.conf || true

echo "[quizalarm-stat] config.json written, nginx listening on :${PORT}"
echo "[quizalarm-stat] allowed table ids: ${ALLOWED_IDS}"

exec "$@"

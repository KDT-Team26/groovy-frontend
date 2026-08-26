#!/bin/sh
set -e

cat <<EOF > /app/dist/env-config.js
window.__ENV__ = {
  VITE_API_BASE_URL: "${VITE_API_BASE_URL:-http://localhost:8080}"
};
EOF

exec serve -s dist -l "${PORT:-5173}"

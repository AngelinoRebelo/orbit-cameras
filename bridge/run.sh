#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
export ORBIT_BRIDGE_PORT="${ORBIT_BRIDGE_PORT:-8787}"
export ORBIT_BRIDGE_PUBLIC_URL="${ORBIT_BRIDGE_PUBLIC_URL:-http://127.0.0.1:${ORBIT_BRIDGE_PORT}}"
if [[ ! -d .venv ]]; then
  python3 -m venv .venv
  .venv/bin/pip install -r requirements.txt
fi
# shellcheck disable=SC1091
source .venv/bin/activate
exec python -m uvicorn app.main:app --host 0.0.0.0 --port "$ORBIT_BRIDGE_PORT"

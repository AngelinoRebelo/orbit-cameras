#!/usr/bin/env bash
# Bridge NetSDK no Ubuntu (Wine + NetSdk.dll + ffmpeg local)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
RUNTIME="$ROOT/.runtime"
WP="$RUNTIME/winpython"
FFMPEG_BIN="$RUNTIME/ffmpeg-bin/bin/ffmpeg"
export WINEPREFIX="${WINEPREFIX:-$RUNTIME/wineprefix}"
export WINEARCH=win64
export WINEDEBUG=-all
export ORBIT_BRIDGE_PORT="${ORBIT_BRIDGE_PORT:-8787}"
export ORBIT_BRIDGE_PUBLIC_URL="${ORBIT_BRIDGE_PUBLIC_URL:-http://127.0.0.1:${ORBIT_BRIDGE_PORT}}"
# Prefer Windows ffmpeg.exe under Wine (subprocess do python wine)
export ORBIT_FFMPEG="${ORBIT_FFMPEG:-$WP/ffmpeg.exe}"
if [[ ! -f "$ORBIT_FFMPEG" ]]; then
  export ORBIT_FFMPEG="$FFMPEG_BIN"
fi

need() { command -v "$1" >/dev/null 2>&1 || { echo "Instale: $1"; exit 1; }; }
need wine

if [[ ! -f "$WP/ffmpeg.exe" && ! -x "$FFMPEG_BIN" ]]; then
  echo "ffmpeg ausente. Rode: bridge/scripts/bootstrap-ubuntu.sh"
  exit 1
fi
if [[ ! -f "$WP/python.exe" ]]; then
  echo "Python Windows (Wine) ausente. Rode: bridge/scripts/bootstrap-ubuntu.sh"
  exit 1
fi
if [[ ! -f "$ROOT/vendor/NetSdk.dll" ]]; then
  echo "Falta vendor/NetSdk.dll (e StreamReader.dll)."
  exit 1
fi

# DLL no cwd do python wine
cp -n "$ROOT/vendor/NetSdk.dll" "$WP/" 2>/dev/null || cp "$ROOT/vendor/NetSdk.dll" "$WP/"
cp -n "$ROOT/vendor/StreamReader.dll" "$WP/" 2>/dev/null || cp "$ROOT/vendor/StreamReader.dll" "$WP/"

cd "$ROOT"
# Z: no Wine mapeia / — PYTHONPATH via Z:\...
export PYTHONPATH="Z:${ROOT}"
echo "Orbit NetSDK bridge (Ubuntu/Wine) em $ORBIT_BRIDGE_PUBLIC_URL"
exec wine "$WP/python.exe" -m uvicorn app.main:app --host 0.0.0.0 --port "$ORBIT_BRIDGE_PORT"

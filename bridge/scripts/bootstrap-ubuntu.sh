#!/usr/bin/env bash
# Prepara runtime Ubuntu: Wine Python + ffmpeg estático + deps
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
RUNTIME="$ROOT/.runtime"
mkdir -p "$RUNTIME"
cd "$RUNTIME"

if ! command -v wine >/dev/null; then
  echo "Instale wine: sudo apt install wine wine64 winetricks"
  exit 1
fi

# ffmpeg estático
if [[ ! -x ffmpeg-bin/bin/ffmpeg ]]; then
  echo "Baixando ffmpeg…"
  curl -fsSL -o ffmpeg.tar.xz \
    'https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-linux64-gpl.tar.xz'
  mkdir -p ffmpeg-bin
  tar -xJf ffmpeg.tar.xz -C ffmpeg-bin --strip-components=1
fi

# Python embeddable Windows
if [[ ! -f winpython/python.exe ]]; then
  echo "Baixando Python embeddable (Windows)…"
  curl -fsSL -o python-embed.zip \
    'https://www.python.org/ftp/python/3.12.8/python-3.12.8-embed-amd64.zip'
  rm -rf winpython && mkdir winpython
  unzip -q python-embed.zip -d winpython
  # enable site-packages
  PTH=$(echo winpython/python*._pth)
  python3 - <<'PY'
from pathlib import Path
p=next(Path('winpython').glob('python*._pth'))
lines=['Lib/site-packages']
for line in p.read_text().splitlines():
    if line.strip().startswith('#import site'):
        lines.append('import site')
    elif line.strip() and line.strip()!='Lib/site-packages':
        lines.append(line)
p.write_text('\n'.join(lines)+'\n')
PY
  curl -fsSL -o get-pip.py https://bootstrap.pypa.io/get-pip.py
  export WINEPREFIX="$RUNTIME/wineprefix" WINEARCH=win64 WINEDEBUG=-all
  wine "$RUNTIME/winpython/python.exe" get-pip.py --no-warn-script-location
  wine "$RUNTIME/winpython/python.exe" -m pip install \
    fastapi==0.116.1 'uvicorn[standard]==0.35.0' pydantic==2.11.7
fi

if [[ ! -f "$ROOT/vendor/NetSdk.dll" ]]; then
  echo "Coloque NetSdk.dll e StreamReader.dll em bridge/vendor/"
  echo "(kit NetSDK Xiongmai / pasta netsdk de exemplos)"
  exit 1
fi

cp "$ROOT/vendor/NetSdk.dll" "$ROOT/vendor/StreamReader.dll" winpython/
echo "OK — rode: bridge/run-ubuntu.sh"

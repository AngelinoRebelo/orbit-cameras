@echo off
cd /d "%~dp0"
if not defined ORBIT_BRIDGE_PORT set ORBIT_BRIDGE_PORT=8787
if not defined ORBIT_BRIDGE_PUBLIC_URL set ORBIT_BRIDGE_PUBLIC_URL=http://127.0.0.1:%ORBIT_BRIDGE_PORT%
if not exist .venv (
  py -3 -m venv .venv
  .venv\Scripts\pip install -r requirements.txt
)
call .venv\Scripts\activate.bat
uvicorn app.main:app --host 0.0.0.0 --port %ORBIT_BRIDGE_PORT%

"""HTTP API for Orbit ORBIT_CLOUD_GATEWAY."""

from __future__ import annotations

import os
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from .netsdk import NetSdk, NetSdkError
from .streamer import DATA_DIR, StreamManager

PUBLIC_BASE = os.environ.get("ORBIT_BRIDGE_PUBLIC_URL", "http://127.0.0.1:8787").rstrip(
    "/"
)
PORT = int(os.environ.get("ORBIT_BRIDGE_PORT", "8787"))

app = FastAPI(title="Orbit NetSDK Cloud Bridge", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/hls", StaticFiles(directory=str(DATA_DIR)), name="hls")

_manager: StreamManager | None = None


def get_manager() -> StreamManager:
    global _manager
    if _manager is None:
        _manager = StreamManager(public_base=PUBLIC_BASE)
    return _manager


class ConnectBody(BaseModel):
    serialNumber: str = Field(min_length=6)
    username: str = "admin"
    password: str
    cameraId: str | None = None
    channel: int = 0
    stream: int = Field(default=1, description="0=main, 1=sub")
    platform: str | None = "XMeye"


@app.get("/")
def root():
    sdk_ok = False
    sdk_msg = ""
    try:
        NetSdk()
        sdk_ok = True
        sdk_msg = "NetSDK carregado"
    except NetSdkError as exc:
        sdk_msg = str(exc)
    return {
        "service": "orbit-netsdk-bridge",
        "publicBase": PUBLIC_BASE,
        "sdk": sdk_ok,
        "sdkMessage": sdk_msg,
        "ffmpegHint": "ffmpeg must be on PATH",
        "endpoints": {"connect": "POST /connect", "health": "GET /health"},
    }


@app.get("/health")
def health():
    try:
        NetSdk()
        sdk = True
        msg = "ok"
    except NetSdkError as exc:
        sdk = False
        msg = str(exc)
    return {"ok": sdk, "sdk": sdk, "message": msg, "publicBase": PUBLIC_BASE}


@app.post("/connect")
def connect(body: ConnectBody):
    from fastapi.responses import JSONResponse

    try:
        result = get_manager().connect(
            serial=body.serialNumber.strip(),
            username=(body.username or "admin").strip(),
            password=body.password,
            channel=body.channel,
            stream=body.stream,
        )
        return result
    except NetSdkError as exc:
        return JSONResponse(
            status_code=502,
            content={
                "ok": False,
                "error": str(exc),
                "message": str(exc),
                "code": exc.code,
            },
        )


@app.get("/status")
def status():
    return get_manager().status()


@app.get("/hls/{session}/index.m3u8")
def playlist(session: str):
    path = DATA_DIR / session / "index.m3u8"
    if not path.is_file():
        raise HTTPException(404, "playlist ainda não disponível")
    return FileResponse(path, media_type="application/vnd.apple.mpegurl")


def run():
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=PORT,
        reload=False,
    )


if __name__ == "__main__":
    run()

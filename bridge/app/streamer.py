"""Manage cloud sessions: NetSDK RealPlay → ffmpeg HLS."""

from __future__ import annotations

import os
import shutil
import subprocess
import threading
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

from .netsdk import NetSdk, NetSdkError

DATA_DIR = Path(__file__).resolve().parent.parent / "data" / "hls"


@dataclass
class Session:
    key: str
    serial: str
    login_id: int = 0
    real_handle: int = 0
    cb: object | None = None
    ffmpeg: subprocess.Popen | None = None
    started_at: float = field(default_factory=time.time)
    last_data_at: float = 0.0
    bytes_written: int = 0
    error: str | None = None
    playlist: Path | None = None


class StreamManager:
    def __init__(self, public_base: str, sdk: NetSdk | None = None):
        self.public_base = public_base.rstrip("/")
        self.sdk = sdk or NetSdk()
        self._sessions: dict[str, Session] = {}
        self._lock = threading.RLock()
        DATA_DIR.mkdir(parents=True, exist_ok=True)

    def _session_key(self, serial: str, channel: int, stream: int) -> str:
        safe = "".join(c if c.isalnum() else "_" for c in serial.strip())
        return f"{safe}_c{channel}_s{stream}"

    def connect(
        self,
        serial: str,
        username: str,
        password: str,
        channel: int = 0,
        stream: int = 1,
    ) -> dict:
        key = self._session_key(serial, channel, stream)
        with self._lock:
            existing = self._sessions.get(key)
            if (
                existing
                and existing.playlist
                and existing.playlist.is_file()
                and existing.error is None
                and (time.time() - existing.last_data_at < 30 or existing.bytes_written > 0)
            ):
                return self._result(existing, reused=True)

            if existing:
                self._stop_unlocked(existing)
                self._sessions.pop(key, None)

            session = Session(key=key, serial=serial)
            self._sessions[key] = session

        try:
            login_id, info = self.sdk.login_cloud(serial, username, password)
            session.login_id = login_id
            out_dir = DATA_DIR / key
            if out_dir.exists():
                shutil.rmtree(out_dir, ignore_errors=True)
            out_dir.mkdir(parents=True, exist_ok=True)
            playlist = out_dir / "index.m3u8"
            session.playlist = playlist

            root = Path(__file__).resolve().parent.parent
            candidates = [
                os.environ.get("ORBIT_FFMPEG") or "",
                shutil.which("ffmpeg") or "",
                str(root / ".runtime" / "winpython" / "ffmpeg.exe"),
                str(root / ".runtime" / "ffmpeg-bin" / "bin" / "ffmpeg"),
                "ffmpeg.exe",
                "ffmpeg",
            ]
            ffmpeg_bin = next((c for c in candidates if c and Path(c).is_file()), None)
            if not ffmpeg_bin:
                raise NetSdkError(
                    "ffmpeg não encontrado (use bootstrap-ubuntu.sh ou ORBIT_FFMPEG=...)"
                )

            # Raw frames from NetSDK → remux/re-encode to HLS
            cmd = [
                ffmpeg_bin,
                "-hide_banner",
                "-loglevel",
                "error",
                "-fflags",
                "+genpts+discardcorrupt",
                "-f",
                "h264",
                "-i",
                "pipe:0",
                "-an",
                "-c:v",
                "copy",
                "-f",
                "hls",
                "-hls_time",
                "1",
                "-hls_list_size",
                "6",
                "-hls_flags",
                "delete_segments+append_list",
                "-hls_segment_filename",
                str(out_dir / "seg_%03d.ts"),
                str(playlist),
            ]
            # Fallback path if copy fails often: user can set ORBIT_BRIDGE_REENCODE=1
            if os.environ.get("ORBIT_BRIDGE_REENCODE", "").strip() in {
                "1",
                "true",
                "yes",
            }:
                cmd = [
                    ffmpeg_bin,
                    "-hide_banner",
                    "-loglevel",
                    "error",
                    "-fflags",
                    "+genpts+discardcorrupt",
                    "-f",
                    "h264",
                    "-i",
                    "pipe:0",
                    "-an",
                    "-c:v",
                    "libx264",
                    "-preset",
                    "veryfast",
                    "-tune",
                    "zerolatency",
                    "-f",
                    "hls",
                    "-hls_time",
                    "1",
                    "-hls_list_size",
                    "6",
                    "-hls_flags",
                    "delete_segments+append_list",
                    "-hls_segment_filename",
                    str(out_dir / "seg_%03d.ts"),
                    str(playlist),
                ]

            proc = subprocess.Popen(
                cmd,
                stdin=subprocess.PIPE,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.PIPE,
            )
            session.ffmpeg = proc

            def on_data(data_type: int, payload: bytes) -> None:
                # 0 = often system header; still useful for some firmwares
                if not payload or not session.ffmpeg or not session.ffmpeg.stdin:
                    return
                try:
                    session.ffmpeg.stdin.write(payload)
                    session.ffmpeg.stdin.flush()
                    session.bytes_written += len(payload)
                    session.last_data_at = time.time()
                except BrokenPipeError:
                    session.error = "ffmpeg pipe quebrado"
                except Exception as exc:  # noqa: BLE001
                    session.error = str(exc)

            real_handle, cb = self.sdk.real_play(
                login_id,
                on_data,
                channel=channel,
                stream=stream,
            )
            session.real_handle = real_handle
            session.cb = cb

            # Wait briefly for first media / playlist
            deadline = time.time() + 12
            while time.time() < deadline:
                if playlist.is_file() and playlist.stat().st_size > 0:
                    break
                if session.error:
                    break
                if proc.poll() is not None:
                    err = b""
                    if proc.stderr:
                        err = proc.stderr.read() or b""
                    raise NetSdkError(
                        "ffmpeg encerrou cedo: "
                        + err.decode("utf-8", errors="ignore")[:400]
                    )
                time.sleep(0.25)

            if not playlist.is_file():
                # Still return URL — player may buffer; note soft start
                pass

            model = info.sHardWare.split(b"\x00", 1)[0].decode(
                "utf-8",
                errors="ignore",
            )
            result = self._result(session, reused=False)
            result["deviceModel"] = model or None
            result["channels"] = int(info.byChanNum or 1)
            return result
        except Exception as exc:
            with self._lock:
                self._stop_unlocked(session)
                self._sessions.pop(key, None)
            if isinstance(exc, NetSdkError):
                raise
            raise NetSdkError(str(exc)) from exc

    def _result(self, session: Session, reused: bool) -> dict:
        path = f"/hls/{session.key}/index.m3u8"
        return {
            "ok": True,
            "playbackUrl": f"{self.public_base}{path}",
            "kind": "hls",
            "label": "Cloud NetSDK HLS",
            "online": True,
            "reused": reused,
            "bytes": session.bytes_written,
            "message": "Stream cloud via NetSDK (padrão VMS).",
        }

    def _stop_unlocked(self, session: Session) -> None:
        try:
            if session.real_handle:
                self.sdk.stop_real_play(session.real_handle, session.cb)
        except Exception:
            pass
        session.real_handle = 0
        try:
            if session.ffmpeg and session.ffmpeg.stdin:
                session.ffmpeg.stdin.close()
        except Exception:
            pass
        try:
            if session.ffmpeg and session.ffmpeg.poll() is None:
                session.ffmpeg.terminate()
                try:
                    session.ffmpeg.wait(timeout=3)
                except subprocess.TimeoutExpired:
                    session.ffmpeg.kill()
        except Exception:
            pass
        session.ffmpeg = None
        try:
            if session.login_id:
                self.sdk.logout(session.login_id)
        except Exception:
            pass
        session.login_id = 0

    def stop(self, serial: str, channel: int = 0, stream: int = 1) -> None:
        key = self._session_key(serial, channel, stream)
        with self._lock:
            session = self._sessions.pop(key, None)
            if session:
                self._stop_unlocked(session)

    def status(self) -> dict:
        with self._lock:
            return {
                "sessions": [
                    {
                        "key": s.key,
                        "serial": s.serial,
                        "bytes": s.bytes_written,
                        "ageSec": int(time.time() - s.started_at),
                        "error": s.error,
                    }
                    for s in self._sessions.values()
                ]
            }

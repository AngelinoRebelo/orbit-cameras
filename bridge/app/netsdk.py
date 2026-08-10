"""ctypes wrapper for Xiongmai NetSDK — H264_DVR_Login_Cloud + RealPlay."""

from __future__ import annotations

import ctypes
import platform
import threading
from ctypes import (
    CFUNCTYPE,
    POINTER,
    Structure,
    byref,
    c_char,
    c_char_p,
    c_int,
    c_long,
    c_ubyte,
    c_uint,
    c_ulong,
    c_ushort,
    c_void_p,
)
from pathlib import Path
from typing import Callable, Optional

VENDOR = Path(__file__).resolve().parent.parent / "vendor"
NET_MAX_PATH_LENGTH = 260


class SDK_SYSTEM_TIME(Structure):
    _fields_ = [
        ("year", c_int),
        ("month", c_int),
        ("day", c_int),
        ("wday", c_int),
        ("hour", c_int),
        ("minute", c_int),
        ("second", c_int),
        ("isdst", c_int),
    ]


class H264_DVR_DEVICEINFO(Structure):
    _fields_ = [
        ("sSoftWareVersion", c_char * 64),
        ("sHardWareVersion", c_char * 64),
        ("sEncryptVersion", c_char * 64),
        ("tmBuildTime", SDK_SYSTEM_TIME),
        ("sSerialNumber", c_char * 64),
        ("byChanNum", c_int),
        ("iVideoOutChannel", c_int),
        ("byAlarmInPortNum", c_int),
        ("byAlarmOutPortNum", c_int),
        ("iTalkInChannel", c_int),
        ("iTalkOutChannel", c_int),
        ("iExtraChannel", c_int),
        ("iAudioInChannel", c_int),
        ("iCombineSwitch", c_int),
        ("iDigChannel", c_int),
        ("uiDeviceRunTime", c_uint),
        ("deviceTye", c_int),
        ("sHardWare", c_char * 64),
        ("uUpdataTime", c_char * 20),
        ("uUpdataType", c_uint),
        ("sDeviceModel", c_char * 16),
        ("nLanguage", c_int),
        ("sCloudErrCode", c_char * NET_MAX_PATH_LENGTH),
        ("status", c_int * 32),
    ]


class H264_DVR_CLIENTINFO(Structure):
    _fields_ = [
        ("nChannel", c_int),
        ("nStream", c_int),  # 0=main, 1=sub
        ("nMode", c_int),  # 0=TCP
        ("nComType", c_int),
        ("hWnd", c_void_p),
    ]


# int (*)(long, long, unsigned char*, long, long)
fRealDataCallBack = CFUNCTYPE(
    c_int, c_long, c_long, POINTER(c_ubyte), c_long, c_long
)
fDisConnect = CFUNCTYPE(None, c_long, c_char_p, c_long, c_ulong)


class NetSdkError(RuntimeError):
    def __init__(self, message: str, code: int | None = None):
        super().__init__(message)
        self.code = code


class NetSdk:
    def __init__(self, vendor_dir: Path | None = None):
        self.vendor = Path(vendor_dir or VENDOR)
        self._lib = self._load()
        self._bind()
        self._cb_keep: list = []  # prevent GC of callbacks
        self._lock = threading.RLock()
        self._inited = False

    def _load(self):
        system = platform.system()
        candidates: list[Path] = []
        # Under Wine on Ubuntu, platform is Windows and NetSdk.dll works.
        if system == "Windows":
            candidates = [
                self.vendor / "NetSdk.dll",
                self.vendor / "NetSDK.dll",
                Path("NetSdk.dll"),
                Path(__file__).resolve().parent.parent / ".runtime" / "winpython" / "NetSdk.dll",
            ]
            loader = ctypes.WinDLL
        else:
            candidates = [
                self.vendor / "libxmnetsdk.so",
                self.vendor / "libNetSdk.so",
                Path("libxmnetsdk.so"),
            ]
            loader = ctypes.CDLL

        for path in candidates:
            if path.is_file():
                return loader(str(path))

        raise NetSdkError(
            f"NetSDK não encontrado em {self.vendor}. "
            "Copie NetSdk.dll (Windows) ou libxmnetsdk.so (Linux) para bridge/vendor/."
        )

    def _bind(self) -> None:
        lib = self._lib
        lib.H264_DVR_Init.argtypes = [fDisConnect, c_ulong]
        lib.H264_DVR_Init.restype = c_long

        lib.H264_DVR_Cleanup.argtypes = []
        lib.H264_DVR_Cleanup.restype = None

        lib.H264_DVR_Login_Cloud.argtypes = [
            c_char_p,
            c_ushort,
            c_char_p,
            c_char_p,
            POINTER(H264_DVR_DEVICEINFO),
            POINTER(c_int),
            c_char_p,
        ]
        lib.H264_DVR_Login_Cloud.restype = c_long

        lib.H264_DVR_Logout.argtypes = [c_long]
        lib.H264_DVR_Logout.restype = c_long

        lib.H264_DVR_RealPlay.argtypes = [c_long, POINTER(H264_DVR_CLIENTINFO)]
        lib.H264_DVR_RealPlay.restype = c_long

        lib.H264_DVR_StopRealPlay.argtypes = [c_long, c_void_p]
        lib.H264_DVR_StopRealPlay.restype = ctypes.c_bool

        lib.H264_DVR_SetRealDataCallBack.argtypes = [
            c_long,
            fRealDataCallBack,
            c_long,
        ]
        lib.H264_DVR_SetRealDataCallBack.restype = ctypes.c_bool

        lib.H264_DVR_DelRealDataCallBack.argtypes = [
            c_long,
            fRealDataCallBack,
            c_long,
        ]
        lib.H264_DVR_DelRealDataCallBack.restype = ctypes.c_bool

        lib.H264_DVR_GetLastError.argtypes = []
        lib.H264_DVR_GetLastError.restype = c_long

        lib.H264_DVR_CatchPicInBuffer.argtypes = [
            c_long,
            c_int,
            c_char_p,
            c_int,
            POINTER(c_int),
            c_int,
        ]
        lib.H264_DVR_CatchPicInBuffer.restype = ctypes.c_bool

    def init(self) -> None:
        with self._lock:
            if self._inited:
                return

            @fDisConnect
            def _on_disconnect(login_id, ip, port, user):  # noqa: ARG001
                return None

            self._cb_keep.append(_on_disconnect)
            ok = self._lib.H264_DVR_Init(_on_disconnect, 0)
            if not ok:
                raise NetSdkError("H264_DVR_Init falhou", self.last_error())
            self._inited = True

    def cleanup(self) -> None:
        with self._lock:
            if self._inited:
                self._lib.H264_DVR_Cleanup()
                self._inited = False

    def last_error(self) -> int:
        return int(self._lib.H264_DVR_GetLastError())

    def login_cloud(
        self,
        serial: str,
        username: str,
        password: str,
        port: int = 34567,
    ) -> tuple[int, H264_DVR_DEVICEINFO]:
        self.init()
        info = H264_DVR_DEVICEINFO()
        err = c_int(0)
        login_id = self._lib.H264_DVR_Login_Cloud(
            serial.encode("utf-8"),
            c_ushort(port),
            username.encode("utf-8"),
            password.encode("utf-8"),
            byref(info),
            byref(err),
            None,
        )
        if not login_id:
            cloud_err = info.sCloudErrCode.split(b"\x00", 1)[0].decode(
                "utf-8",
                errors="ignore",
            )
            raise NetSdkError(
                f"Login cloud falhou (error={err.value}"
                + (f", cloud={cloud_err}" if cloud_err else "")
                + f", last={self.last_error()})",
                err.value or self.last_error(),
            )
        return int(login_id), info

    def logout(self, login_id: int) -> None:
        if login_id:
            self._lib.H264_DVR_Logout(c_long(login_id))

    def real_play(
        self,
        login_id: int,
        on_data: Callable[[int, bytes], None],
        channel: int = 0,
        stream: int = 1,
    ) -> tuple[int, object]:
        """Start preview; returns (real_handle, callback_ref). stream: 0=main 1=sub."""
        client = H264_DVR_CLIENTINFO()
        client.nChannel = channel
        client.nStream = stream
        client.nMode = 0
        client.nComType = 0
        client.hWnd = None

        handle = self._lib.H264_DVR_RealPlay(c_long(login_id), byref(client))
        if not handle:
            raise NetSdkError(
                f"RealPlay falhou (last={self.last_error()})",
                self.last_error(),
            )

        @fRealDataCallBack
        def _cb(real_handle, data_type, buf, size, user):  # noqa: ARG001
            try:
                if size > 0 and buf:
                    data = ctypes.string_at(buf, size)
                    on_data(int(data_type), data)
            except Exception:
                pass
            return 1

        self._cb_keep.append(_cb)
        ok = self._lib.H264_DVR_SetRealDataCallBack(c_long(handle), _cb, 0)
        if not ok:
            self._lib.H264_DVR_StopRealPlay(c_long(handle), None)
            raise NetSdkError(
                f"SetRealDataCallBack falhou (last={self.last_error()})",
                self.last_error(),
            )
        return int(handle), _cb

    def stop_real_play(self, real_handle: int, cb=None) -> None:
        if cb is not None:
            try:
                self._lib.H264_DVR_DelRealDataCallBack(c_long(real_handle), cb, 0)
            except Exception:
                pass
        if real_handle:
            self._lib.H264_DVR_StopRealPlay(c_long(real_handle), None)

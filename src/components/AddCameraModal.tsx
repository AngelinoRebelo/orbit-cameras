"use client";

import { useState } from "react";
import { Cloud, QrCode, Network, ScanSearch, Link2 } from "lucide-react";
import {
  BRAND_PRESETS,
  REGISTER_MODES,
  SITES,
  parseQrPayload,
  type Camera,
  type RegisterMode,
} from "@/lib/data";
import { cn } from "@/lib/utils";

const MODE_ICONS: Record<RegisterMode, typeof Cloud> = {
  cloud: Cloud,
  qr: QrCode,
  ip: Network,
  onvif: ScanSearch,
  rtsp: Link2,
};

const emptyForm = {
  name: "",
  site: "casa",
  brand: "XM / XMeye / ICSee",
  cloudPlatform: "XMeye" as NonNullable<Camera["cloudPlatform"]>,
  serialNumber: "",
  pid: "",
  deviceLogin: "admin",
  devicePassword: "",
  deviceVersion: "X6E-WEQ",
  qrPayload: "",
  ipAddress: "",
  ipPort: "34567",
  rtspUrl: "",
  onvifHost: "",
};

interface AddCameraModalProps {
  onClose: () => void;
  onAdd: (cam: Camera) => void;
}

export function AddCameraModal({ onClose, onAdd }: AddCameraModalProps) {
  const [mode, setMode] = useState<RegisterMode>("cloud");
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  function set<K extends keyof typeof emptyForm>(key: K, value: (typeof emptyForm)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function buildCamera(): Camera | null {
    const id = `cam-${Date.now()}`;
    const name = form.name.trim() || `Câmera ${mode.toUpperCase()}`;
    const base: Camera = {
      id,
      name,
      location: mode === "cloud" || mode === "qr" ? "Cloud" : "LAN",
      site: form.site,
      status: "online",
      protocol: "WebRTC",
      brand: form.brand,
      model: BRAND_PRESETS.find((b) => b.brand === form.brand)?.models[0] ?? "Custom",
      resolution: "1080p",
      fps: 15,
      codec: "H.264",
      nightVision: true,
      twoWayAudio: true,
      ptz: false,
      wifiRssi: -52,
      storageDays: 7,
      thumbnailHue: Math.floor(Math.random() * 360),
      scene: `Cadastrada via ${mode}`,
      lastSeen: new Date().toISOString(),
      streamLatencyMs: 480,
      registerMode: mode,
      hasDevicePassword: Boolean(form.devicePassword),
      deviceLogin: form.deviceLogin || undefined,
    };

    if (mode === "cloud") {
      if (!form.serialNumber.trim() || !form.devicePassword) {
        setError("Informe o N.º de série (Cloud ID) e a senha do dispositivo.");
        return null;
      }
      return {
        ...base,
        protocol: "XM / ICSee",
        cloudPlatform: form.cloudPlatform,
        serialNumber: form.serialNumber.trim(),
        pid: form.pid.trim() || undefined,
        deviceVersion: form.deviceVersion || undefined,
        model: form.deviceVersion || base.model,
        softwareVersion: "V5.04.R02.000A07F3.10",
        firmwarePublishedAt: new Date().toISOString().slice(0, 19).replace("T", " "),
        timezone: "Oeste3.0",
        scene: `Cloud ${form.cloudPlatform} · SN ${form.serialNumber.trim()}`,
      };
    }

    if (mode === "qr") {
      const sn = parseQrPayload(form.qrPayload || form.serialNumber);
      if (!sn || sn.length < 8) {
        setError("Cole o conteúdo do QR ou o N.º de série do dispositivo.");
        return null;
      }
      if (!form.devicePassword) {
        setError("Informe a senha do dispositivo após ler o QR.");
        return null;
      }
      return {
        ...base,
        protocol: "Cloud P2P",
        cloudPlatform: form.cloudPlatform,
        registerMode: "qr",
        serialNumber: sn,
        pid: form.pid.trim() || undefined,
        deviceVersion: form.deviceVersion || "X6E-WEQ",
        model: form.deviceVersion || "X6E-WEQ",
        softwareVersion: "V5.04.R02.000A07F3.10",
        timezone: "Oeste3.0",
        scene: `QR → Cloud ID ${sn}`,
      };
    }

    if (mode === "ip") {
      if (!form.ipAddress.trim() || !form.devicePassword) {
        setError("Informe IP e senha do dispositivo.");
        return null;
      }
      const port = Number(form.ipPort) || 34567;
      return {
        ...base,
        protocol: "XM / ICSee",
        ipAddress: form.ipAddress.trim(),
        ipPort: port,
        deviceLogin: form.deviceLogin || "admin",
        location: "LAN",
        scene: `IP ${form.ipAddress.trim()}:${port}`,
        streamLatencyMs: 220,
      };
    }

    if (mode === "onvif") {
      if (!form.onvifHost.trim()) {
        setError("Informe o host/IP ONVIF.");
        return null;
      }
      return {
        ...base,
        protocol: "ONVIF",
        brand: form.brand === "XM / XMeye / ICSee" ? "Genérica ONVIF" : form.brand,
        ipAddress: form.onvifHost.trim(),
        ipPort: Number(form.ipPort) || 80,
        deviceLogin: form.deviceLogin || "admin",
        ptz: true,
        codec: "H.265",
        scene: `ONVIF ${form.onvifHost.trim()}`,
      };
    }

    // rtsp
    if (!form.rtspUrl.trim().toLowerCase().startsWith("rtsp://")) {
      setError("Informe uma URL RTSP válida (rtsp://…).");
      return null;
    }
    return {
      ...base,
      protocol: "RTSP",
      rtspUrl: form.rtspUrl.trim(),
      codec: "H.265",
      fps: 25,
      scene: form.rtspUrl.trim(),
      streamLatencyMs: 350,
    };
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const cam = buildCamera();
    if (!cam) return;
    onAdd(cam);
    onClose();
  }

  const Icon = MODE_ICONS[mode];

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/65 p-4 backdrop-blur-sm">
      <form
        onSubmit={submit}
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-line bg-ink-2 p-5 shadow-2xl scrollbar-thin sm:p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-semibold">
              Cadastrar câmera
            </h2>
            <p className="mt-1 text-sm text-mist-dim">
              Cloud (XMeye/ICSee), QR, IP/LAN, ONVIF ou RTSP
            </p>
          </div>
          <Icon className="size-5 text-signal" />
        </div>

        <div className="mt-5 flex flex-wrap gap-1 rounded-xl border border-line p-1">
          {REGISTER_MODES.map((m) => {
            const MIcon = MODE_ICONS[m.id];
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setMode(m.id);
                  setError("");
                }}
                className={cn(
                  "inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-medium sm:flex-none sm:px-3",
                  mode === m.id
                    ? "bg-signal/20 text-signal"
                    : "text-mist-dim hover:text-mist",
                )}
              >
                <MIcon className="size-3.5" />
                {m.label}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-mist-dim">
          {REGISTER_MODES.find((m) => m.id === mode)?.hint}
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <label className="block text-xs text-mist-dim sm:col-span-2">
            Nome amigável
            <input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className="mt-1 w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm text-mist outline-none focus:border-signal/40"
              placeholder="Ex.: Casa Rua"
            />
          </label>

          <label className="block text-xs text-mist-dim">
            Site
            <select
              value={form.site}
              onChange={(e) => set("site", e.target.value)}
              className="mt-1 w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm text-mist outline-none"
            >
              {SITES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-xs text-mist-dim">
            Marca / família
            <select
              value={form.brand}
              onChange={(e) => set("brand", e.target.value)}
              className="mt-1 w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm text-mist outline-none"
            >
              {BRAND_PRESETS.map((b) => (
                <option key={b.brand} value={b.brand}>
                  {b.brand}
                </option>
              ))}
            </select>
          </label>

          {(mode === "cloud" || mode === "qr") && (
            <>
              <label className="block text-xs text-mist-dim">
                Plataforma cloud
                <select
                  value={form.cloudPlatform}
                  onChange={(e) =>
                    set(
                      "cloudPlatform",
                      e.target.value as typeof form.cloudPlatform,
                    )
                  }
                  className="mt-1 w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm text-mist outline-none"
                >
                  {["XMeye", "ICSee", "XMCloud", "P2P", "Outro"].map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs text-mist-dim">
                Versão do dispositivo
                <input
                  value={form.deviceVersion}
                  onChange={(e) => set("deviceVersion", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm text-mist outline-none focus:border-signal/40"
                  placeholder="X6E-WEQ"
                />
              </label>
            </>
          )}

          {mode === "qr" && (
            <label className="block text-xs text-mist-dim sm:col-span-2">
              Conteúdo do QR / N.º de série
              <textarea
                value={form.qrPayload}
                onChange={(e) => set("qrPayload", e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-lg border border-line bg-ink px-3 py-2 font-mono text-xs text-mist outline-none focus:border-signal/40"
                placeholder="Cole o serial do QR (ex.: f9b1765cf546a7b15nr0) ou URL do dispositivo"
              />
            </label>
          )}

          {mode === "cloud" && (
            <>
              <label className="block text-xs text-mist-dim sm:col-span-2">
                N.º de série (Cloud ID)
                <input
                  value={form.serialNumber}
                  onChange={(e) => set("serialNumber", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-line bg-ink px-3 py-2 font-mono text-sm text-mist outline-none focus:border-signal/40"
                  placeholder="f9b1765cf546a7b15nr0"
                  required
                />
              </label>
              <label className="block text-xs text-mist-dim">
                PID (opcional)
                <input
                  value={form.pid}
                  onChange={(e) => set("pid", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-line bg-ink px-3 py-2 font-mono text-sm text-mist outline-none focus:border-signal/40"
                  placeholder="A90A007F3000000C"
                />
              </label>
            </>
          )}

          {mode === "ip" && (
            <>
              <label className="block text-xs text-mist-dim">
                Endereço IP
                <input
                  value={form.ipAddress}
                  onChange={(e) => set("ipAddress", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-line bg-ink px-3 py-2 font-mono text-sm text-mist outline-none focus:border-signal/40"
                  placeholder="192.168.0.20"
                  required
                />
              </label>
              <label className="block text-xs text-mist-dim">
                Porta
                <input
                  value={form.ipPort}
                  onChange={(e) => set("ipPort", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-line bg-ink px-3 py-2 font-mono text-sm text-mist outline-none focus:border-signal/40"
                  placeholder="34567 (XM) · 80 · 554"
                />
              </label>
            </>
          )}

          {mode === "onvif" && (
            <>
              <label className="block text-xs text-mist-dim">
                Host / IP ONVIF
                <input
                  value={form.onvifHost}
                  onChange={(e) => set("onvifHost", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-line bg-ink px-3 py-2 font-mono text-sm text-mist outline-none focus:border-signal/40"
                  placeholder="192.168.0.50"
                />
              </label>
              <label className="block text-xs text-mist-dim">
                Porta
                <input
                  value={form.ipPort}
                  onChange={(e) => set("ipPort", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-line bg-ink px-3 py-2 font-mono text-sm text-mist outline-none focus:border-signal/40"
                  placeholder="80"
                />
              </label>
            </>
          )}

          {mode === "rtsp" && (
            <label className="block text-xs text-mist-dim sm:col-span-2">
              URL RTSP
              <input
                value={form.rtspUrl}
                onChange={(e) => set("rtspUrl", e.target.value)}
                className="mt-1 w-full rounded-lg border border-line bg-ink px-3 py-2 font-mono text-xs text-mist outline-none focus:border-signal/40"
                placeholder="rtsp://admin:senha@192.168.0.20:554/stream1"
              />
            </label>
          )}

          {mode !== "rtsp" && (
            <>
              <label className="block text-xs text-mist-dim">
                Nome de login do dispositivo
                <input
                  value={form.deviceLogin}
                  onChange={(e) => set("deviceLogin", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm text-mist outline-none focus:border-signal/40"
                  placeholder="admin"
                />
              </label>
              <label className="block text-xs text-mist-dim">
                Senha do dispositivo
                <input
                  type="password"
                  value={form.devicePassword}
                  onChange={(e) => set("devicePassword", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm text-mist outline-none focus:border-signal/40"
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
              </label>
            </>
          )}
        </div>

        {error && (
          <p className="mt-4 rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-mist-dim hover:text-mist"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="rounded-lg bg-signal px-4 py-2 text-sm font-semibold text-ink"
          >
            Cadastrar
          </button>
        </div>
      </form>
    </div>
  );
}

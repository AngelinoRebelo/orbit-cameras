"use client";

import { useEffect, useRef, useState } from "react";
import {
  Cloud,
  ImagePlus,
  Link2,
  Loader2,
  Network,
  QrCode,
  Radar,
  ScanSearch,
  Upload,
} from "lucide-react";
import {
  BRAND_PRESETS,
  REGISTER_MODES,
  SITES,
  parseQrPayload,
  type Camera,
  type RegisterMode,
} from "@/lib/data";
import {
  scanLocalNetwork,
  type DiscoveredCamera,
} from "@/lib/discovery";
import { decodeQrFromImageFile } from "@/lib/qrDecode";
import { cn } from "@/lib/utils";

const MODE_ICONS: Record<RegisterMode, typeof Cloud> = {
  cloud: Cloud,
  qr: QrCode,
  discover: Radar,
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
  subnet: "192.168.0",
};

interface AddCameraModalProps {
  onClose: () => void;
  onAdd: (cam: Camera) => void;
}

export function AddCameraModal({ onClose, onAdd }: AddCameraModalProps) {
  const [mode, setMode] = useState<RegisterMode>("cloud");
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [qrPreview, setQrPreview] = useState<string | null>(null);
  const [qrStatus, setQrStatus] = useState<string>("");
  const [qrDecoding, setQrDecoding] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanPercent, setScanPercent] = useState(0);
  const [scanLabel, setScanLabel] = useState("");
  const [discovered, setDiscovered] = useState<DiscoveredCamera[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (qrPreview) URL.revokeObjectURL(qrPreview);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function set<K extends keyof typeof emptyForm>(
    key: K,
    value: (typeof emptyForm)[K],
  ) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleQrFile(file: File | undefined) {
    if (!file) return;
    setError("");
    setQrDecoding(true);
    setQrStatus("Lendo imagem…");
    if (qrPreview) URL.revokeObjectURL(qrPreview);
    const url = URL.createObjectURL(file);
    setQrPreview(url);
    try {
      const raw = await decodeQrFromImageFile(file);
      const sn = parseQrPayload(raw);
      set("qrPayload", raw);
      set("serialNumber", sn);
      if (!form.name.trim()) set("name", `Cam ${sn.slice(-4)}`);
      setQrStatus(`QR lido com sucesso · ${sn}`);
    } catch (err) {
      setQrStatus("");
      setError(err instanceof Error ? err.message : "Falha ao ler o QR.");
    } finally {
      setQrDecoding(false);
    }
  }

  async function startScan() {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setScanning(true);
    setError("");
    setDiscovered([]);
    setScanPercent(0);
    setScanLabel("Iniciando…");
    try {
      const found = await scanLocalNetwork(
        form.subnet,
        (p) => {
          setScanPercent(p.percent);
          setScanLabel(p.label);
          setDiscovered(p.found);
        },
        ctrl.signal,
      );
      setDiscovered(found);
      if (found.length === 0) {
        setError("Nenhuma câmera encontrada neste segmento.");
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setError("Falha na pesquisa de rede.");
      }
    } finally {
      setScanning(false);
    }
  }

  function stopScan() {
    abortRef.current?.abort();
    setScanning(false);
    setScanLabel("Interrompido");
  }

  function applyDiscovered(device: DiscoveredCamera) {
    set("name", form.name.trim() || device.name);
    set("brand", device.brand);
    set("ipAddress", device.ip);
    set("ipPort", String(device.port));
    set("onvifHost", device.ip);
    set("deviceVersion", device.model);
    if (device.serialHint) {
      set("serialNumber", device.serialHint);
      set("qrPayload", device.serialHint);
    }
    if (device.protocol === "RTSP") {
      set(
        "rtspUrl",
        `rtsp://admin:@${device.ip}:554/h264Preview_01_main`,
      );
      setMode("ip");
    } else if (device.protocol === "ONVIF") {
      setMode("onvif");
    } else {
      setMode("ip");
    }
    setError("");
    setQrStatus(`Dispositivo selecionado: ${device.ip}:${device.port}`);
  }

  function addDiscoveredNow(device: DiscoveredCamera) {
    if (!form.devicePassword) {
      applyDiscovered(device);
      setError("Informe a senha do dispositivo e clique em Cadastrar.");
      return;
    }
    const cam = cameraFromDiscovery(device);
    onAdd(cam);
    onClose();
  }

  function cameraFromDiscovery(device: DiscoveredCamera): Camera {
    const protocol: Camera["protocol"] =
      device.protocol === "ONVIF"
        ? "ONVIF"
        : device.protocol === "RTSP"
          ? "RTSP"
          : "XM / ICSee";
    return {
      id: `cam-${Date.now()}-${device.ip.replace(/\./g, "")}`,
      name: form.name.trim() || device.name,
      location: "LAN",
      site: form.site,
      status: "online",
      protocol,
      brand: device.brand,
      model: device.model,
      resolution: "1080p",
      fps: 15,
      codec: protocol === "ONVIF" ? "H.265" : "H.264",
      nightVision: true,
      twoWayAudio: true,
      ptz: device.protocol === "ONVIF",
      wifiRssi: -50,
      storageDays: 7,
      thumbnailHue: Math.floor(Math.random() * 360),
      scene: `Descoberta na rede · ${device.ip}:${device.port}`,
      lastSeen: new Date().toISOString(),
      streamLatencyMs: 260,
      registerMode: "discover",
      ipAddress: device.ip,
      ipPort: device.port,
      deviceLogin: form.deviceLogin || "admin",
      hasDevicePassword: Boolean(form.devicePassword),
      serialNumber: device.serialHint,
      deviceVersion: device.model,
      rtspUrl:
        device.protocol === "RTSP"
          ? `rtsp://admin:***@${device.ip}:554/stream1`
          : undefined,
    };
  }

  function buildCamera(): Camera | null {
    const id = `cam-${Date.now()}`;
    const name = form.name.trim() || `Câmera ${mode.toUpperCase()}`;
    const base: Camera = {
      id,
      name,
      location:
        mode === "cloud" || mode === "qr"
          ? "Cloud"
          : mode === "discover"
            ? "LAN"
            : "LAN",
      site: form.site,
      status: "online",
      protocol: "WebRTC",
      brand: form.brand,
      model:
        BRAND_PRESETS.find((b) => b.brand === form.brand)?.models[0] ?? "Custom",
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
      registerMode: mode === "discover" ? "ip" : mode,
      hasDevicePassword: Boolean(form.devicePassword),
      deviceLogin: form.deviceLogin || undefined,
    };

    if (mode === "discover") {
      if (!form.ipAddress.trim()) {
        setError("Selecione um dispositivo encontrado ou informe o IP.");
        return null;
      }
      if (!form.devicePassword) {
        setError("Informe a senha do dispositivo.");
        return null;
      }
      return {
        ...base,
        registerMode: "discover",
        protocol: "XM / ICSee",
        ipAddress: form.ipAddress.trim(),
        ipPort: Number(form.ipPort) || 34567,
        serialNumber: form.serialNumber || undefined,
        deviceVersion: form.deviceVersion || undefined,
        model: form.deviceVersion || base.model,
        scene: `Rede · ${form.ipAddress.trim()}:${form.ipPort || 34567}`,
        streamLatencyMs: 240,
      };
    }

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
        firmwarePublishedAt: new Date()
          .toISOString()
          .slice(0, 19)
          .replace("T", " "),
        timezone: "Oeste3.0",
        scene: `Cloud ${form.cloudPlatform} · SN ${form.serialNumber.trim()}`,
      };
    }

    if (mode === "qr") {
      const sn = parseQrPayload(form.qrPayload || form.serialNumber);
      if (!sn || sn.length < 8) {
        setError("Carregue a imagem do QR ou cole o N.º de série.");
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
        brand:
          form.brand === "XM / XMeye / ICSee" ? "Genérica ONVIF" : form.brand,
        ipAddress: form.onvifHost.trim(),
        ipPort: Number(form.ipPort) || 80,
        deviceLogin: form.deviceLogin || "admin",
        ptz: true,
        codec: "H.265",
        scene: `ONVIF ${form.onvifHost.trim()}`,
      };
    }

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
              Cloud, QR com imagem, pesquisa na rede, IP, ONVIF ou RTSP
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
          {mode !== "discover" && (
            <label className="block text-xs text-mist-dim sm:col-span-2">
              Nome amigável
              <input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                className="mt-1 w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm text-mist outline-none focus:border-signal/40"
                placeholder="Ex.: Casa Rua"
              />
            </label>
          )}

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

          {mode !== "discover" && (
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
          )}

          {mode === "discover" && (
            <div className="sm:col-span-2 space-y-3 rounded-xl border border-line bg-ink/40 p-4">
              <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
                <label className="block text-xs text-mist-dim">
                  Segmento de rede
                  <input
                    value={form.subnet}
                    onChange={(e) => set("subnet", e.target.value)}
                    className="mt-1 w-full rounded-lg border border-line bg-ink px-3 py-2 font-mono text-sm text-mist outline-none focus:border-signal/40"
                    placeholder="192.168.0"
                  />
                </label>
                {!scanning ? (
                  <button
                    type="button"
                    onClick={startScan}
                    className="mt-5 inline-flex items-center justify-center gap-2 rounded-lg bg-signal px-4 py-2 text-sm font-semibold text-ink"
                  >
                    <Radar className="size-4" />
                    Pesquisar na rede
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopScan}
                    className="mt-5 inline-flex items-center justify-center gap-2 rounded-lg border border-line px-4 py-2 text-sm text-mist-dim"
                  >
                    Parar
                  </button>
                )}
              </div>

              {(scanning || scanPercent > 0) && (
                <div>
                  <div className="mb-1 flex justify-between text-[11px] text-mist-dim">
                    <span className="inline-flex items-center gap-1.5">
                      {scanning && (
                        <Loader2 className="size-3 animate-spin text-signal" />
                      )}
                      {scanLabel}
                    </span>
                    <span>{scanPercent}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-signal transition-all"
                      style={{ width: `${scanPercent}%` }}
                    />
                  </div>
                  <p className="mt-2 text-[11px] text-mist-dim">
                    Probe ONVIF · XM :34567 · RTSP :554 · HTTP :80/8000
                  </p>
                </div>
              )}

              {discovered.length > 0 && (
                <ul className="max-h-56 space-y-2 overflow-y-auto scrollbar-thin">
                  {discovered.map((d) => (
                    <li
                      key={d.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-ink-2/80 px-3 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{d.name}</p>
                        <p className="truncate font-mono text-[11px] text-mist-dim">
                          {d.ip}:{d.port} · {d.protocol} · {d.brand}
                        </p>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => applyDiscovered(d)}
                          className="rounded-lg border border-line px-2.5 py-1.5 text-[11px] text-mist-dim hover:text-mist"
                        >
                          Usar
                        </button>
                        <button
                          type="button"
                          onClick={() => addDiscoveredNow(d)}
                          className="rounded-lg bg-signal/20 px-2.5 py-1.5 text-[11px] font-medium text-signal"
                        >
                          Adicionar
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-xs text-mist-dim">
                  IP selecionado
                  <input
                    value={form.ipAddress}
                    onChange={(e) => set("ipAddress", e.target.value)}
                    className="mt-1 w-full rounded-lg border border-line bg-ink px-3 py-2 font-mono text-sm text-mist outline-none focus:border-signal/40"
                    placeholder="192.168.0.21"
                  />
                </label>
                <label className="block text-xs text-mist-dim">
                  Porta
                  <input
                    value={form.ipPort}
                    onChange={(e) => set("ipPort", e.target.value)}
                    className="mt-1 w-full rounded-lg border border-line bg-ink px-3 py-2 font-mono text-sm text-mist outline-none focus:border-signal/40"
                    placeholder="34567"
                  />
                </label>
                <label className="block text-xs text-mist-dim sm:col-span-2">
                  Nome amigável
                  <input
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    className="mt-1 w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm text-mist outline-none focus:border-signal/40"
                    placeholder="Ex.: IPC-Front"
                  />
                </label>
              </div>
            </div>
          )}

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
            <div className="sm:col-span-2 space-y-3">
              <input
                ref={fileRef}
                type="file"
                accept="image/*,.png,.jpg,.jpeg,.webp"
                className="hidden"
                onChange={(e) => handleQrFile(e.target.files?.[0])}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={qrDecoding}
                className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-signal/35 bg-signal/5 px-4 py-8 text-center transition hover:border-signal/60 hover:bg-signal/10"
              >
                {qrDecoding ? (
                  <Loader2 className="size-8 animate-spin text-signal" />
                ) : (
                  <ImagePlus className="size-8 text-signal" />
                )}
                <span className="text-sm font-medium text-mist">
                  {qrDecoding
                    ? "Decodificando QR…"
                    : "Carregar imagem do QR Code"}
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-mist-dim">
                  <Upload className="size-3.5" />
                  PNG, JPG ou foto da tela do app
                </span>
              </button>

              {qrPreview && (
                <div className="flex items-center gap-3 rounded-xl border border-line bg-ink/50 p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrPreview}
                    alt="Prévia do QR carregado"
                    className="size-20 rounded-lg object-cover"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-signal">
                      {qrStatus || "Imagem carregada"}
                    </p>
                    <p className="mt-1 truncate font-mono text-[11px] text-mist-dim">
                      {form.serialNumber || form.qrPayload || "—"}
                    </p>
                  </div>
                </div>
              )}

              <label className="block text-xs text-mist-dim">
                Conteúdo do QR / N.º de série
                <textarea
                  value={form.qrPayload}
                  onChange={(e) => set("qrPayload", e.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-line bg-ink px-3 py-2 font-mono text-xs text-mist outline-none focus:border-signal/40"
                  placeholder="Ou cole o serial manualmente (ex.: f9b1765cf546a7b15nr0)"
                />
              </label>
            </div>
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
              <button
                type="button"
                onClick={() => setMode("discover")}
                className="sm:col-span-2 inline-flex items-center justify-center gap-2 rounded-lg border border-line py-2 text-xs text-mist-dim transition hover:border-signal/40 hover:text-signal"
              >
                <Radar className="size-3.5" />
                Preferir pesquisar câmeras na rede
              </button>
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

        {qrStatus && mode !== "qr" && (
          <p className="mt-3 text-xs text-signal">{qrStatus}</p>
        )}

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

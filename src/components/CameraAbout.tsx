"use client";

import { useEffect, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Eye, EyeOff, Radio, Trash2, X } from "lucide-react";
import {
  deviceQrValue,
  maskSecret,
  type Camera,
} from "@/lib/data";
import { detectPlaybackKind } from "@/lib/streaming";
import { formatClock } from "@/lib/utils";

interface CameraAboutProps {
  camera: Camera;
  onClose: () => void;
  onDelete?: () => void;
  onSave?: (patch: Partial<Camera>) => void;
}

export function CameraAbout({
  camera,
  onClose,
  onDelete,
  onSave,
}: CameraAboutProps) {
  const [showLogin, setShowLogin] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [ipAddress, setIpAddress] = useState(camera.ipAddress ?? "");
  const [ipPort, setIpPort] = useState(String(camera.ipPort ?? 34567));
  const [devicePassword, setDevicePassword] = useState(
    camera.devicePassword ?? "",
  );
  const [playbackUrl, setPlaybackUrl] = useState(camera.playbackUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState("");
  const qrValue = useMemo(() => deviceQrValue(camera), [camera]);

  useEffect(() => setMounted(true), []);

  async function copySerial() {
    if (!camera.serialNumber) return;
    try {
      await navigator.clipboard.writeText(camera.serialNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  function saveStream() {
    if (!onSave) return;
    setSaving(true);
    const port = Number(ipPort) || 34567;
    const patch: Partial<Camera> = {
      ipAddress: ipAddress.trim() || undefined,
      ipPort: port,
      devicePassword: devicePassword || camera.devicePassword,
      hasDevicePassword: Boolean(devicePassword || camera.devicePassword),
      playbackUrl: playbackUrl.trim() || undefined,
      playbackType: playbackUrl.trim()
        ? detectPlaybackKind(playbackUrl.trim())
        : undefined,
      streamError: undefined,
      protocol:
        camera.protocol === "Cloud P2P" && ipAddress.trim()
          ? "XM / ICSee"
          : camera.protocol,
    };
    onSave(patch);
    setNote("Stream atualizado — o player vai reconectar.");
    setSaving(false);
  }

  const rows: { label: string; value: React.ReactNode; hide?: boolean }[] = [
    {
      label: "N.º de série",
      value: camera.serialNumber ? (
        <span className="inline-flex items-center gap-2 font-mono text-sm">
          {maskSecret(camera.serialNumber, 6)}
          <button
            type="button"
            onClick={copySerial}
            className="text-mist-dim hover:text-signal"
            aria-label="Copiar serial"
          >
            <Copy className="size-3.5" />
          </button>
          {copied && <span className="text-[10px] text-signal">copiado</span>}
        </span>
      ) : (
        "—"
      ),
      hide: !camera.serialNumber,
    },
    {
      label: "Nome de login do dispositivo",
      value: camera.deviceLogin ? (
        <span className="inline-flex items-center gap-2">
          {showLogin ? camera.deviceLogin : maskSecret(camera.deviceLogin, 2)}
          <button
            type="button"
            onClick={() => setShowLogin((v) => !v)}
            className="text-mist-dim hover:text-signal"
          >
            {showLogin ? (
              <EyeOff className="size-3.5" />
            ) : (
              <Eye className="size-3.5" />
            )}
          </button>
        </span>
      ) : (
        "—"
      ),
      hide: !camera.deviceLogin,
    },
    {
      label: "Senha do dispositivo",
      value: camera.hasDevicePassword || camera.devicePassword ? "••••••••" : "não definida",
    },
    {
      label: "Versão do dispositivo",
      value: camera.deviceVersion || camera.model,
    },
    {
      label: "PID",
      value: camera.pid ? (
        <span className="font-mono text-xs">{camera.pid}</span>
      ) : (
        "—"
      ),
      hide: !camera.pid,
    },
    {
      label: "Versão do software",
      value: camera.softwareVersion || "—",
      hide: !camera.softwareVersion,
    },
    {
      label: "Data da publicação",
      value: camera.firmwarePublishedAt || "—",
      hide: !camera.firmwarePublishedAt,
    },
    {
      label: "Fuso horário",
      value: camera.timezone || "—",
      hide: !camera.timezone,
    },
    {
      label: "Hora do dispositivo",
      value: (
        <span suppressHydrationWarning>
          {mounted ? formatClock(new Date()) : "--:--:--"}
        </span>
      ),
    },
    {
      label: "Modo de cadastro",
      value: camera.registerMode?.toUpperCase() || "—",
    },
    {
      label: "Plataforma cloud",
      value: camera.cloudPlatform || "—",
      hide: !camera.cloudPlatform,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/65 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-2xl border border-line bg-ink-2 shadow-2xl scrollbar-thin">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-mist-dim">
              Sobre o disp.
            </p>
            <h2 className="font-display text-lg font-semibold">{camera.name}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-mist-dim hover:bg-white/5 hover:text-mist"
            aria-label="Fechar"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex flex-col items-center border-b border-line bg-mist px-6 py-6 text-ink">
          <QRCodeSVG
            value={qrValue}
            size={168}
            level="M"
            bgColor="#e8f1f2"
            fgColor="#071016"
            includeMargin={false}
          />
          <p className="mt-3 text-center text-[11px] text-ink/55">
            QR do dispositivo — escaneável para entrada na rede/sessão
          </p>
        </div>

        <ul className="divide-y divide-line">
          {rows
            .filter((r) => !r.hide)
            .map((row) => (
              <li
                key={row.label}
                className="flex items-start justify-between gap-4 px-4 py-3 text-sm"
              >
                <span className="shrink-0 text-mist-dim">{row.label}</span>
                <span className="max-w-[58%] text-right text-mist">
                  {row.value}
                </span>
              </li>
            ))}
        </ul>

        <div className="border-t border-line p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-mist">
            <Radio className="size-4 text-signal" />
            Stream no browser
          </div>
          <p className="mb-3 text-[11px] leading-relaxed text-mist-dim">
            XMeye/ICSee (Cloud P2P / DVRIP :34567) não toca direto no Chrome.
            Informe o <strong className="text-mist">IP na LAN</strong> + senha
            (gateway go2rtc) ou cole uma{" "}
            <strong className="text-mist">URL HLS/MJPEG/WebRTC</strong>.
          </p>
          <div className="space-y-2">
            <label className="block text-xs text-mist-dim">
              IP da câmera (LAN)
              <input
                value={ipAddress}
                onChange={(e) => setIpAddress(e.target.value)}
                className="mt-1 w-full rounded-lg border border-line bg-ink px-3 py-2 font-mono text-sm text-mist outline-none focus:border-signal/40"
                placeholder="192.168.0.20"
              />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="block text-xs text-mist-dim">
                Porta DVRIP
                <input
                  value={ipPort}
                  onChange={(e) => setIpPort(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-line bg-ink px-3 py-2 font-mono text-sm text-mist outline-none focus:border-signal/40"
                  placeholder="34567"
                />
              </label>
              <label className="block text-xs text-mist-dim">
                Senha (stream)
                <input
                  type="password"
                  value={devicePassword}
                  onChange={(e) => setDevicePassword(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm text-mist outline-none focus:border-signal/40"
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
              </label>
            </div>
            <label className="block text-xs text-mist-dim">
              URL HLS / MJPEG / WHEP (opcional)
              <input
                value={playbackUrl}
                onChange={(e) => setPlaybackUrl(e.target.value)}
                className="mt-1 w-full rounded-lg border border-line bg-ink px-3 py-2 font-mono text-[11px] text-mist outline-none focus:border-signal/40"
                placeholder="https://go2rtc/api/stream.m3u8?src=casa_rua"
              />
            </label>
            {onSave && (
              <button
                type="button"
                onClick={saveStream}
                disabled={saving}
                className="mt-1 inline-flex w-full items-center justify-center rounded-xl bg-signal py-2.5 text-sm font-semibold text-ink"
              >
                Salvar e reconectar vídeo
              </button>
            )}
            {note && <p className="text-[11px] text-signal">{note}</p>}
          </div>
        </div>

        {onDelete && (
          <div className="border-t border-line p-4">
            <button
              type="button"
              onClick={onDelete}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-danger/35 bg-danger/10 py-3 text-sm font-medium text-danger transition hover:bg-danger/20"
            >
              <Trash2 className="size-4" />
              Excluir dispositivo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Eye, EyeOff, X } from "lucide-react";
import {
  deviceQrValue,
  maskSecret,
  type Camera,
} from "@/lib/data";
import { formatClock } from "@/lib/utils";

interface CameraAboutProps {
  camera: Camera;
  onClose: () => void;
}

export function CameraAbout({ camera, onClose }: CameraAboutProps) {
  const [showLogin, setShowLogin] = useState(false);
  const [copied, setCopied] = useState(false);
  const qrValue = useMemo(() => deviceQrValue(camera), [camera]);

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
          {showLogin
            ? camera.deviceLogin
            : maskSecret(camera.deviceLogin, 2)}
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
      value: camera.hasDevicePassword ? "••••••••" : "não definida",
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
      value: formatClock(new Date()),
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
    {
      label: "IP / porta",
      value:
        camera.ipAddress != null
          ? `${camera.ipAddress}:${camera.ipPort ?? "—"}`
          : "—",
      hide: !camera.ipAddress,
    },
    {
      label: "RTSP",
      value: camera.rtspUrl ? (
        <span className="break-all font-mono text-[11px]">{camera.rtspUrl}</span>
      ) : (
        "—"
      ),
      hide: !camera.rtspUrl,
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
      </div>
    </div>
  );
}

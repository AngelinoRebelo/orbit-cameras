"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Battery,
  Loader2,
  Mic,
  MicOff,
  Moon,
  Signal,
  Sun,
  Video,
  VideoOff,
  Wifi,
} from "lucide-react";
import type { Camera } from "@/lib/data";
import { explainMissingStream } from "@/lib/streaming";
import type { PlaybackKind } from "@/lib/streaming";
import { StreamPlayer } from "@/components/StreamPlayer";
import { cn, formatClock, wifiBars } from "@/lib/utils";

interface CameraFeedProps {
  camera: Camera;
  active?: boolean;
  compact?: boolean;
  nightMode?: boolean;
  muted?: boolean;
  showHud?: boolean;
  className?: string;
  onClick?: () => void;
  onConfigureStream?: () => void;
}

interface ActiveStream {
  url: string;
  kind: PlaybackKind;
  label: string;
}

export function CameraFeed({
  camera,
  active,
  compact,
  nightMode,
  muted = true,
  showHud = true,
  className,
  onClick,
  onConfigureStream,
}: CameraFeedProps) {
  const offline = camera.status === "offline";
  const bars = wifiBars(camera.wifiRssi);
  const [mounted, setMounted] = useState(false);
  const [clock, setClock] = useState("--:--:--");
  const [connecting, setConnecting] = useState(false);
  const [stream, setStream] = useState<ActiveStream | null>(null);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    setMounted(true);
    const tick = () => setClock(formatClock(new Date()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  const connect = useCallback(async () => {
    if (offline) return;
    setConnecting(true);
    setStreamError(null);
    setPlaying(false);
    try {
      const res = await fetch("/api/stream/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ camera }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        stream?: ActiveStream & { via?: string };
        error?: string;
      };
      if (data.ok && data.stream) {
        setStream({
          url: data.stream.url,
          kind: data.stream.kind,
          label: data.stream.label,
        });
      } else {
        setStream(null);
        setStreamError(data.error || explainMissingStream(camera));
      }
    } catch {
      setStream(null);
      setStreamError("Falha de rede ao resolver o stream");
    } finally {
      setConnecting(false);
    }
  }, [camera, offline]);

  useEffect(() => {
    setStream(null);
    setPlaying(false);
    setStreamError(null);
    void connect();
  }, [connect]);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden text-left outline-none transition",
        "focus-visible:ring-2 focus-visible:ring-signal",
        active ? "ring-2 ring-signal" : "ring-1 ring-line",
        className,
      )}
    >
      <div
        className={cn(
          "absolute inset-0 feed-texture transition duration-700",
          nightMode && "saturate-0 brightness-90 contrast-125",
          offline && "grayscale opacity-60",
        )}
        style={{
          background: `
            radial-gradient(ellipse at ${30 + (camera.thumbnailHue % 40)}% 35%, hsla(${camera.thumbnailHue}, 35%, 28%, 0.7), transparent 55%),
            radial-gradient(ellipse at 70% 65%, hsla(${(camera.thumbnailHue + 40) % 360}, 25%, 18%, 0.6), transparent 50%),
            linear-gradient(145deg, #1a2a32 0%, #0f1a20 55%, #162428 100%)
          `,
        }}
      />

      {stream && !offline && (
        <StreamPlayer
          url={stream.url}
          kind={stream.kind}
          muted={muted}
          nightMode={nightMode}
          onPlaying={() => setPlaying(true)}
          onError={(msg) => {
            setPlaying(false);
            setStreamError(msg);
          }}
        />
      )}

      {!stream && !offline && !connecting && (
        <div className="absolute inset-0 z-[1] flex flex-col items-center justify-center gap-2 bg-black/55 px-4 text-center">
          <VideoOff className="size-6 text-mist-dim" />
          <p className="max-w-xs text-[11px] leading-relaxed text-mist-dim">
            {streamError || explainMissingStream(camera)}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                void connect();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.stopPropagation();
                  void connect();
                }
              }}
              className="rounded-md bg-signal/20 px-2.5 py-1 text-[11px] font-medium text-signal"
            >
              Tentar de novo
            </span>
            {onConfigureStream && (
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  onConfigureStream();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.stopPropagation();
                    onConfigureStream();
                  }
                }}
                className="rounded-md border border-line px-2.5 py-1 text-[11px] text-mist"
              >
                Configurar stream
              </span>
            )}
          </div>
        </div>
      )}

      {connecting && (
        <div className="absolute inset-0 z-[1] flex flex-col items-center justify-center gap-2 bg-black/50 text-xs text-mist">
          <Loader2 className="size-5 animate-spin text-signal" />
          Resolvendo DVRIP / RTSP / HLS…
        </div>
      )}

      {!offline && !stream && <div className="absolute inset-0 scanline opacity-40" />}

      <div className="pointer-events-none absolute inset-0 opacity-[0.08] mix-blend-overlay">
        <div className="h-full w-full lens-grid" />
      </div>

      {camera.status === "alert" && (
        <motion.div
          className="absolute inset-0 border-2 border-danger/80"
          animate={{ opacity: [0.35, 0.9, 0.35] }}
          transition={{ duration: 1.4, repeat: Infinity }}
        />
      )}

      {showHud && (
        <>
          <div className="pointer-events-none absolute left-3 top-3 z-[2] flex items-center gap-2">
            {!offline ? (
              <span className="inline-flex items-center gap-1.5 rounded bg-black/45 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-mist backdrop-blur-sm">
                <span
                  className={cn(
                    "live-dot size-1.5 rounded-full",
                    playing ? "bg-danger" : "bg-amber",
                  )}
                />
                {playing ? "Live" : stream ? "Buffer" : "Standby"}
              </span>
            ) : (
              <span className="rounded bg-black/55 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-mist-dim backdrop-blur-sm">
                Offline
              </span>
            )}
            {camera.status === "recording" && playing && (
              <span className="inline-flex items-center gap-1 rounded bg-danger/20 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-danger backdrop-blur-sm">
                <Video className="size-3" /> REC
              </span>
            )}
            {stream && (
              <span className="rounded bg-black/45 px-2 py-1 text-[10px] uppercase tracking-wider text-signal backdrop-blur-sm">
                {stream.label}
              </span>
            )}
          </div>

          <div className="pointer-events-none absolute right-3 top-3 z-[2] flex items-center gap-2 text-mist/80">
            {nightMode ? (
              <Moon className="size-3.5" />
            ) : (
              <Sun className="size-3.5 opacity-70" />
            )}
            {muted ? (
              <MicOff className="size-3.5 opacity-70" />
            ) : (
              <Mic className="size-3.5 text-signal" />
            )}
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] bg-gradient-to-t from-black/75 via-black/35 to-transparent p-3 pt-10">
            <div className="flex items-end justify-between gap-3">
              <div className="min-w-0">
                <p
                  className={cn(
                    "truncate font-display font-semibold text-mist",
                    compact ? "text-sm" : "text-base",
                  )}
                >
                  {camera.name}
                </p>
                <p className="truncate text-xs text-mist-dim">
                  {camera.location} · {camera.protocol} · {camera.resolution}
                </p>
              </div>
              {!compact && (
                <div className="shrink-0 text-right font-mono text-[10px] text-mist-dim">
                  <div suppressHydrationWarning>{mounted ? clock : "--:--:--"}</div>
                  <div className="mt-0.5 flex items-center justify-end gap-2">
                    <span className="inline-flex items-center gap-1">
                      <Wifi className="size-3" />
                      {bars}/4
                    </span>
                    {typeof camera.battery === "number" && (
                      <span className="inline-flex items-center gap-1">
                        <Battery className="size-3" />
                        {camera.battery}%
                      </span>
                    )}
                    {!offline && playing && (
                      <span className="inline-flex items-center gap-1 text-signal">
                        <Signal className="size-3" />
                        {camera.streamLatencyMs}ms
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {offline && (
        <div className="absolute inset-0 z-[2] flex items-center justify-center">
          <p className="rounded bg-black/50 px-3 py-2 text-xs text-mist-dim backdrop-blur-sm">
            Sem sinal · última vez{" "}
            <span suppressHydrationWarning>
              {mounted ? formatClock(camera.lastSeen) : "--:--:--"}
            </span>
          </p>
        </div>
      )}
    </button>
  );
}

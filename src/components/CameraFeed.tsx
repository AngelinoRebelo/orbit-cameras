"use client";

import { motion } from "framer-motion";
import {
  Battery,
  Mic,
  MicOff,
  Moon,
  Signal,
  Sun,
  Video,
  Wifi,
} from "lucide-react";
import type { Camera } from "@/lib/data";
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
}: CameraFeedProps) {
  const offline = camera.status === "offline";
  const bars = wifiBars(camera.wifiRssi);

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

      {!offline && <div className="absolute inset-0 scanline opacity-70" />}

      <div className="absolute inset-0 opacity-[0.12] mix-blend-overlay">
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
          <div className="absolute left-3 top-3 flex items-center gap-2">
            {!offline ? (
              <span className="inline-flex items-center gap-1.5 rounded bg-black/45 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-mist backdrop-blur-sm">
                <span className="live-dot size-1.5 rounded-full bg-danger" />
                Live
              </span>
            ) : (
              <span className="rounded bg-black/55 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-mist-dim backdrop-blur-sm">
                Offline
              </span>
            )}
            {camera.status === "recording" && (
              <span className="inline-flex items-center gap-1 rounded bg-danger/20 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-danger backdrop-blur-sm">
                <Video className="size-3" /> REC
              </span>
            )}
          </div>

          <div className="absolute right-3 top-3 flex items-center gap-2 text-mist/80">
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

          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/35 to-transparent p-3 pt-10">
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
                  <div>{formatClock(new Date())}</div>
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
                    {!offline && (
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
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="rounded bg-black/50 px-3 py-2 text-xs text-mist-dim backdrop-blur-sm">
            Sem sinal · última vez {formatClock(camera.lastSeen)}
          </p>
        </div>
      )}
    </button>
  );
}

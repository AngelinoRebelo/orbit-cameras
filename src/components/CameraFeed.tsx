"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Battery,
  Cloud,
  ExternalLink,
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
import {
  cloudLoginPatch,
  isCloudCamera,
  type CloudConnectResult,
} from "@/lib/cloud";
import { buildLanCandidateUrls, needsLanIp } from "@/lib/lanStreams";
import { explainMissingStream } from "@/lib/streaming";
import type { PlaybackKind } from "@/lib/streaming";
import { LanMjpegPlayer } from "@/components/LanMjpegPlayer";
import { StreamPlayer } from "@/components/StreamPlayer";
import { cn, formatClock, wifiBars } from "@/lib/utils";

interface CameraFeedProps {
  camera: Camera;
  active?: boolean;
  compact?: boolean;
  nightMode?: boolean;
  muted?: boolean;
  showHud?: boolean;
  /** Prioriza login cloud (Serial+senha) como no VMS Windows */
  preferCloud?: boolean;
  className?: string;
  onClick?: () => void;
  onConfigureStream?: () => void;
  onUpdateCamera?: (id: string, patch: Partial<Camera>) => void;
}

interface ActiveStream {
  url: string;
  kind: PlaybackKind | "lan";
  label: string;
}

export function CameraFeed({
  camera,
  active,
  compact,
  nightMode,
  muted = true,
  showHud = true,
  preferCloud = false,
  className,
  onClick,
  onConfigureStream,
  onUpdateCamera,
}: CameraFeedProps) {
  const offline = camera.status === "offline";
  const cloud = isCloudCamera(camera);
  const bars = wifiBars(camera.wifiRssi);
  const [mounted, setMounted] = useState(false);
  const [clock, setClock] = useState("--:--:--");
  const [connecting, setConnecting] = useState(false);
  const [stream, setStream] = useState<ActiveStream | null>(null);
  const [lanCandidates, setLanCandidates] = useState<string[]>([]);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [showLanAlt, setShowLanAlt] = useState(false);
  const [cloudReady, setCloudReady] = useState(false);
  const [draftSerial, setDraftSerial] = useState(camera.serialNumber ?? "");
  const [draftUser, setDraftUser] = useState(camera.deviceLogin || "admin");
  const [draftPass, setDraftPass] = useState(camera.devicePassword ?? "");
  const [draftHls, setDraftHls] = useState(camera.playbackUrl ?? "");
  const [draftIp, setDraftIp] = useState(camera.ipAddress ?? "");
  const [draftSaving, setDraftSaving] = useState(false);

  const lanUrls = useMemo(
    () => buildLanCandidateUrls(camera),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      camera.ipAddress,
      camera.ipPort,
      camera.deviceLogin,
      camera.devicePassword,
      camera.id,
    ],
  );

  useEffect(() => {
    setMounted(true);
    setDraftSerial(camera.serialNumber ?? "");
    setDraftUser(camera.deviceLogin || "admin");
    setDraftPass(camera.devicePassword ?? "");
    setDraftHls(camera.playbackUrl ?? "");
    setDraftIp(camera.ipAddress ?? "");
    const tick = () => setClock(formatClock(new Date()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [
    camera.ipAddress,
    camera.devicePassword,
    camera.serialNumber,
    camera.deviceLogin,
    camera.playbackUrl,
  ]);

  const startLan = useCallback(
    (cam: Camera = camera) => {
      const urls = buildLanCandidateUrls(cam);
      if (!urls.length) return false;
      setLanCandidates(urls);
      setStream({
        url: urls[0],
        kind: "lan",
        label: "LAN HTTP",
      });
      setStreamError(null);
      setPlaying(false);
      return true;
    },
    [camera],
  );

  const connect = useCallback(async () => {
    if (offline) return;
    setConnecting(true);
    setStreamError(null);
    setPlaying(false);
    setStream(null);
    setLanCandidates([]);

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
        tryLan?: boolean;
        tryCloud?: boolean;
      };

      if (data.ok && data.stream && data.stream.kind !== "lan") {
        setStream({
          url: data.stream.url,
          kind: data.stream.kind,
          label: data.stream.label,
        });
        return;
      }

      // LAN só como fallback (mesma Wi‑Fi)
      if (!preferCloud && startLan(camera)) return;
      if (camera.ipAddress && startLan(camera)) return;

      setStreamError(data.error || explainMissingStream(camera));
    } catch {
      if (camera.ipAddress && startLan(camera)) return;
      setStreamError("Falha de rede ao resolver o stream");
    } finally {
      setConnecting(false);
    }
  }, [camera, offline, preferCloud, startLan]);

  useEffect(() => {
    void connect();
  }, [connect]);

  async function saveCloudAndConnect(e: React.MouseEvent) {
    e.stopPropagation();
    if (!draftSerial.trim() || !draftPass) {
      setStreamError("Informe Serial NO e senha do dispositivo.");
      return;
    }
    setDraftSaving(true);
    setStreamError(null);
    const patch = cloudLoginPatch({
      serialNumber: draftSerial,
      username: draftUser,
      password: draftPass,
      platform: camera.cloudPlatform,
    });
    const next = { ...camera, ...patch };
    onUpdateCamera?.(camera.id, patch);

    try {
      const res = await fetch("/api/cloud/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serialNumber: draftSerial,
          username: draftUser,
          password: draftPass,
          cameraId: camera.id,
          platform: camera.cloudPlatform ?? "XMeye",
        }),
      });
      const data = (await res.json()) as CloudConnectResult;
      if (data.ok && data.playbackUrl) {
        const withPlay: Partial<Camera> = {
          ...patch,
          playbackUrl: data.playbackUrl,
          playbackType: data.playbackKind ?? "auto",
          status: "online",
        };
        onUpdateCamera?.(camera.id, withPlay);
        setStream({
          url: data.playbackUrl,
          kind: data.playbackKind ?? "hls",
          label: data.label || "Cloud",
        });
        setPlaying(false);
        setStreamError(null);
      } else if (data.ok) {
        setCloudReady(true);
        setStreamError(null);
        const resolve = await fetch("/api/stream/resolve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ camera: { ...next, ...patch } }),
        });
        const resolved = (await resolve.json()) as {
          ok?: boolean;
          stream?: ActiveStream;
          error?: string;
        };
        if (resolved.ok && resolved.stream) {
          setStream(resolved.stream);
          setCloudReady(false);
        } else if (resolved.error) {
          // dica amigável, não erro de login
          setStreamError(resolved.error);
        }
      } else {
        setCloudReady(false);
        setStreamError(data.message || "Falha no login cloud.");
      }
    } catch {
      setStreamError("Falha ao conectar na nuvem.");
    } finally {
      setDraftSaving(false);
    }
  }

  function saveHlsAndPlay(e: React.MouseEvent) {
    e.stopPropagation();
    const url = draftHls.trim();
    if (!url) {
      setStreamError("Cole uma URL HLS (.m3u8) ou MJPEG para tocar no browser.");
      return;
    }
    const kind: PlaybackKind =
      url.includes("m3u8") || url.includes("hls")
        ? "hls"
        : url.includes("mjpg") || url.includes("mjpeg")
          ? "mjpeg"
          : url.includes("whep") || url.includes("webrtc")
            ? "webrtc"
            : "video";
    const patch: Partial<Camera> = {
      playbackUrl: url,
      playbackType: kind,
      status: "online",
      streamError: undefined,
    };
    onUpdateCamera?.(camera.id, patch);
    setStream({ url, kind, label: kind.toUpperCase() });
    setCloudReady(false);
    setStreamError(null);
    setPlaying(false);
  }

  function saveLanAndConnect(e: React.MouseEvent) {
    e.stopPropagation();
    if (!draftIp.trim()) {
      setStreamError("Informe o IP da câmera na sua Wi‑Fi.");
      return;
    }
    setDraftSaving(true);
    const patch: Partial<Camera> = {
      ipAddress: draftIp.trim(),
      ipPort: 80,
      devicePassword: draftPass || camera.devicePassword,
      hasDevicePassword: Boolean(draftPass || camera.devicePassword),
    };
    onUpdateCamera?.(camera.id, patch);
    startLan({ ...camera, ...patch });
    setDraftSaving(false);
  }

  const needsSetup =
    !offline &&
    !playing &&
    !connecting &&
    !stream &&
    (Boolean(streamError) ||
      needsLanIp(camera) ||
      (cloud && !camera.playbackUrl));

  const showCloudForm =
    needsSetup && (preferCloud || cloud) && !showLanAlt;

  const showLanForm = needsSetup && (!showCloudForm || showLanAlt);

  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") onClick();
            }
          : undefined
      }
      className={cn(
        "group relative overflow-hidden text-left outline-none transition",
        "focus-visible:ring-2 focus-visible:ring-signal",
        active ? "ring-2 ring-signal" : "ring-1 ring-line",
        onClick && "cursor-pointer",
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

      {stream && stream.kind === "lan" && lanCandidates.length > 0 && !offline && (
        <LanMjpegPlayer
          candidates={lanCandidates.length ? lanCandidates : lanUrls}
          nightMode={nightMode}
          onPlaying={() => setPlaying(true)}
          onError={(msg) => {
            setPlaying(false);
            setStream(null);
            setStreamError(msg);
          }}
        />
      )}

      {stream && stream.kind !== "lan" && !offline && (
        <StreamPlayer
          url={stream.url}
          kind={stream.kind}
          muted={muted}
          nightMode={nightMode}
          onPlaying={() => setPlaying(true)}
          onError={(msg) => {
            setPlaying(false);
            if (camera.ipAddress && startLan()) return;
            setStreamError(msg);
          }}
        />
      )}

      {showCloudForm && (
        <div
          className="absolute inset-0 z-[3] flex flex-col items-center justify-center gap-2 bg-black/75 px-3 text-center"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <Cloud className="size-5 text-signal" />
          <p className="max-w-[300px] text-[11px] leading-relaxed text-mist-dim">
            {cloudReady ? (
              <>
                <span className="text-signal">Login cloud OK</span> — o Chrome
                não toca P2P XMeye. Cole uma{" "}
                <span className="text-mist">URL HLS</span> ou abra o app
                oficial.
              </>
            ) : (
              <>
                Conexão <span className="text-mist">cloud</span> (como no VMS
                Windows): Serial NO + usuário + senha — sem precisar da mesma
                Wi‑Fi.
              </>
            )}
          </p>
          <div className="flex w-full max-w-[300px] flex-col gap-1.5">
            {!cloudReady && (
              <>
                <input
                  value={draftSerial}
                  onChange={(e) => setDraftSerial(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="Serial NO / Cloud ID"
                  className="rounded-md border border-line bg-ink px-2 py-1.5 font-mono text-xs text-mist outline-none focus:border-signal/50"
                  autoComplete="off"
                />
                <input
                  value={draftUser}
                  onChange={(e) => setDraftUser(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="Usuário (admin)"
                  className="rounded-md border border-line bg-ink px-2 py-1.5 text-xs text-mist outline-none focus:border-signal/50"
                  autoComplete="username"
                />
                <input
                  type="password"
                  value={draftPass}
                  onChange={(e) => setDraftPass(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="Senha do dispositivo"
                  className="rounded-md border border-line bg-ink px-2 py-1.5 text-xs text-mist outline-none focus:border-signal/50"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  disabled={draftSaving}
                  onClick={(e) => void saveCloudAndConnect(e)}
                  className="rounded-md bg-signal px-2 py-1.5 text-xs font-semibold text-ink"
                >
                  {draftSaving ? "Conectando…" : "Conectar na nuvem"}
                </button>
              </>
            )}
            <input
              value={draftHls}
              onChange={(e) => setDraftHls(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              placeholder="URL HLS opcional (…/live.m3u8)"
              className="rounded-md border border-line bg-ink px-2 py-1.5 font-mono text-[11px] text-mist outline-none focus:border-signal/50"
              autoComplete="off"
            />
            <button
              type="button"
              disabled={draftSaving || !draftHls.trim()}
              onClick={saveHlsAndPlay}
              className="rounded-md border border-signal/40 bg-signal/15 px-2 py-1.5 text-xs font-semibold text-signal disabled:opacity-40"
            >
              Tocar URL no Orbit
            </button>
          </div>
          {streamError && (
            <p className="max-w-[300px] text-[10px] text-mist-dim">{streamError}</p>
          )}
          <div className="flex flex-wrap justify-center gap-2">
            <a
              href="https://v2.xmeye.net/#/login"
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-1 text-[11px] text-mist"
            >
              <ExternalLink className="size-3" />
              Abrir XMeye Web
            </a>
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                setShowLanAlt(true);
                setCloudReady(false);
              }}
              className="rounded-md border border-line px-2 py-1 text-[11px] text-mist"
            >
              Estou na mesma Wi‑Fi (IP)
            </span>
          </div>
        </div>
      )}

      {showLanForm && (
        <div
          className="absolute inset-0 z-[3] flex flex-col items-center justify-center gap-2 bg-black/70 px-3 text-center"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <VideoOff className="size-5 text-mist-dim" />
          <p className="max-w-[280px] text-[11px] leading-relaxed text-mist-dim">
            Preview pela <span className="text-mist">mesma Wi‑Fi</span>: informe
            o IP local da câmera.
          </p>
          <div className="flex w-full max-w-[280px] flex-col gap-1.5">
            <input
              value={draftIp}
              onChange={(e) => setDraftIp(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              placeholder="IP LAN ex.: 192.168.0.20"
              className="rounded-md border border-line bg-ink px-2 py-1.5 font-mono text-xs text-mist outline-none focus:border-signal/50"
            />
            <input
              type="password"
              value={draftPass}
              onChange={(e) => setDraftPass(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              placeholder="Senha do dispositivo"
              className="rounded-md border border-line bg-ink px-2 py-1.5 text-xs text-mist outline-none focus:border-signal/50"
              autoComplete="new-password"
            />
            <button
              type="button"
              disabled={draftSaving}
              onClick={saveLanAndConnect}
              className="rounded-md bg-signal px-2 py-1.5 text-xs font-semibold text-ink"
            >
              {draftSaving ? "Salvando…" : "Conectar vídeo na LAN"}
            </button>
          </div>
          {streamError && (
            <p className="max-w-[280px] text-[10px] text-amber">{streamError}</p>
          )}
          <div className="flex flex-wrap justify-center gap-2">
            {(preferCloud || cloud) && (
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowLanAlt(false);
                }}
                className="rounded-md border border-line px-2 py-1 text-[11px] text-mist"
              >
                Voltar ao login cloud
              </span>
            )}
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                void connect();
              }}
              className="rounded-md bg-white/10 px-2 py-1 text-[11px] text-mist"
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
                className="rounded-md border border-line px-2 py-1 text-[11px] text-mist"
              >
                Mais opções
              </span>
            )}
          </div>
        </div>
      )}

      {connecting && (
        <div className="absolute inset-0 z-[1] flex flex-col items-center justify-center gap-2 bg-black/50 text-xs text-mist">
          <Loader2 className="size-5 animate-spin text-signal" />
          Conectando stream…
        </div>
      )}

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
            {stream && playing && (
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
                  {camera.serialNumber
                    ? `SN ${camera.serialNumber}`
                    : `${camera.location} · ${camera.protocol}`}{" "}
                  · {camera.resolution}
                </p>
              </div>
              {!compact && (
                <div className="shrink-0 text-right font-mono text-[10px] text-mist-dim">
                  <div suppressHydrationWarning>
                    {mounted ? clock : "--:--:--"}
                  </div>
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
    </div>
  );
}

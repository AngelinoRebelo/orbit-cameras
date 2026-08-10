"use client";

import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { Loader2, VideoOff } from "lucide-react";
import type { PlaybackKind } from "@/lib/streaming";
import { cn } from "@/lib/utils";

interface StreamPlayerProps {
  url: string;
  kind: PlaybackKind;
  muted?: boolean;
  nightMode?: boolean;
  className?: string;
  onPlaying?: () => void;
  onError?: (message: string) => void;
}

export function StreamPlayer({
  url,
  kind,
  muted = true,
  nightMode,
  className,
  onPlaying,
  onError,
}: StreamPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<"loading" | "playing" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("Conectando stream…");

  useEffect(() => {
    let hls: Hls | null = null;
    let cancelled = false;
    setStatus("loading");
    setMessage("Negociando protocolo…");

    async function start() {
      if (kind === "mjpeg") {
        setStatus("playing");
        onPlaying?.();
        return;
      }

      const video = videoRef.current;
      if (!video) return;

      const onPlay = () => {
        if (cancelled) return;
        setStatus("playing");
        onPlaying?.();
      };
      const onFail = () => {
        if (cancelled) return;
        const msg = "Falha ao reproduzir o stream";
        setStatus("error");
        setMessage(msg);
        onError?.(msg);
      };

      video.addEventListener("playing", onPlay);
      video.addEventListener("error", onFail);

      try {
        if (kind === "hls" || url.includes(".m3u8")) {
          if (video.canPlayType("application/vnd.apple.mpegurl")) {
            video.src = url;
            await video.play().catch(() => undefined);
          } else if (Hls.isSupported()) {
            hls = new Hls({
              enableWorker: true,
              lowLatencyMode: true,
              backBufferLength: 30,
            });
            hls.loadSource(url);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
              video.play().catch(() => undefined);
            });
            hls.on(Hls.Events.ERROR, (_, data) => {
              if (data.fatal) {
                const msg = `HLS error: ${data.type}`;
                setStatus("error");
                setMessage(msg);
                onError?.(msg);
              }
            });
          } else {
            throw new Error("HLS não suportado neste navegador");
          }
        } else if (kind === "webrtc") {
          const pc = new RTCPeerConnection({
            iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
          });
          pc.addTransceiver("video", { direction: "recvonly" });
          pc.addTransceiver("audio", { direction: "recvonly" });
          pc.ontrack = (ev) => {
            if (video.srcObject !== ev.streams[0]) {
              video.srcObject = ev.streams[0];
              video.play().catch(() => undefined);
            }
          };
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          const whepUrl = url.replace(/\/+$/, "");
          const res = await fetch(whepUrl, {
            method: "POST",
            headers: { "Content-Type": "application/sdp" },
            body: offer.sdp ?? "",
          });
          if (!res.ok) throw new Error(`WHEP HTTP ${res.status}`);
          const answer = await res.text();
          await pc.setRemoteDescription({ type: "answer", sdp: answer });
          (video as HTMLVideoElement & { __pc?: RTCPeerConnection }).__pc = pc;
        } else {
          video.src = url;
          await video.play().catch(() => undefined);
        }
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : "Erro de stream";
        setStatus("error");
        setMessage(msg);
        onError?.(msg);
      }

      return () => {
        video.removeEventListener("playing", onPlay);
        video.removeEventListener("error", onFail);
      };
    }

    void start();

    return () => {
      cancelled = true;
      hls?.destroy();
      const video = videoRef.current;
      if (video) {
        const pc = (video as HTMLVideoElement & { __pc?: RTCPeerConnection })
          .__pc;
        pc?.close();
        video.srcObject = null;
        video.removeAttribute("src");
        video.load();
      }
    };
    // Intentional: reconnect only when url/kind change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, kind]);

  if (kind === "mjpeg") {
    return (
      <div className={cn("absolute inset-0 bg-black", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt="Stream MJPEG"
          className={cn(
            "h-full w-full object-cover",
            nightMode && "saturate-0 contrast-125",
          )}
          onLoad={() => {
            setStatus("playing");
            onPlaying?.();
          }}
          onError={() => {
            setStatus("error");
            setMessage("Falha no MJPEG");
            onError?.("Falha no MJPEG");
          }}
        />
        {status === "error" && (
          <div className="absolute inset-0 grid place-items-center bg-black/70 text-xs text-mist-dim">
            {message}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn("absolute inset-0 bg-black", className)}>
      <video
        ref={videoRef}
        className={cn(
          "h-full w-full object-cover",
          nightMode && "saturate-0 contrast-125",
        )}
        muted={muted}
        autoPlay
        playsInline
        controls={false}
      />
      {status === "loading" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/55 text-xs text-mist">
          <Loader2 className="size-5 animate-spin text-signal" />
          {message}
        </div>
      )}
      {status === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/70 px-4 text-center text-xs text-mist-dim">
          <VideoOff className="size-5 text-danger" />
          {message}
        </div>
      )}
    </div>
  );
}

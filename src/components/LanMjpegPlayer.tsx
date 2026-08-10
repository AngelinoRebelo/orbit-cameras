"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LanMjpegPlayerProps {
  candidates: string[];
  nightMode?: boolean;
  className?: string;
  onPlaying?: (url: string) => void;
  onError?: (message: string) => void;
}

/**
 * Tenta URLs HTTP da câmera a partir do browser (mesma LAN).
 * Railway na nuvem não alcança 192.168.x.x — o cliente sim.
 */
export function LanMjpegPlayer({
  candidates,
  nightMode,
  className,
  onPlaying,
  onError,
}: LanMjpegPlayerProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<"probing" | "playing" | "error">(
    "probing",
  );
  const [index, setIndex] = useState(0);
  const imgRef = useRef<HTMLImageElement>(null);
  const timerRef = useRef<number | null>(null);

  const candidateKey = candidates.join("|");

  useEffect(() => {
    setUrl(null);
    setIndex(0);
    setStatus("probing");
  }, [candidateKey]);

  useEffect(() => {
    if (!candidates.length) {
      setStatus("error");
      onError?.("Sem candidatos LAN");
      return;
    }
    if (index >= candidates.length) {
      setStatus("error");
      onError?.(
        "Nenhum snapshot/MJPEG respondeu neste IP. Confirme IP, senha e se você está na mesma Wi‑Fi da câmera.",
      );
      return;
    }

    setStatus("probing");
    const candidate = candidates[index];
    const probe = new Image();
    let settled = false;

    const fail = () => {
      if (settled) return;
      settled = true;
      setIndex((i) => i + 1);
    };

    const ok = () => {
      if (settled) return;
      settled = true;
      setUrl(candidate);
      setStatus("playing");
      onPlaying?.(candidate);
    };

    probe.onload = ok;
    probe.onerror = fail;
    // cache-bust
    probe.src = candidate.includes("?")
      ? `${candidate}&_=${Date.now()}`
      : `${candidate}?_=${Date.now()}`;

    const timeout = window.setTimeout(fail, 3500);
    return () => {
      settled = true;
      window.clearTimeout(timeout);
      probe.onload = null;
      probe.onerror = null;
    };
  }, [candidates, index, onError, onPlaying]);

  // Atualiza snapshot periodicamente (efeito "ao vivo")
  useEffect(() => {
    if (!url || status !== "playing") return;
    const isMjpeg = /mjpg|mjpeg|videostream|video\.cgi/i.test(url);

    if (isMjpeg) {
      // stream contínuo — só seta src uma vez
      if (imgRef.current) imgRef.current.src = url;
      return;
    }

    const refresh = () => {
      if (!imgRef.current) return;
      const bust = url.includes("?")
        ? `${url}&_=${Date.now()}`
        : `${url}?_=${Date.now()}`;
      imgRef.current.src = bust;
    };
    refresh();
    timerRef.current = window.setInterval(refresh, 400);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [url, status]);

  return (
    <div className={cn("absolute inset-0 bg-black", className)}>
      {status === "playing" && url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={imgRef}
          alt="Stream LAN"
          className={cn(
            "h-full w-full object-cover",
            nightMode && "saturate-0 contrast-125",
          )}
        />
      )}
      {status === "probing" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60 text-xs text-mist">
          <Loader2 className="size-5 animate-spin text-signal" />
          Testando HTTP/MJPEG na LAN… ({index + 1}/{candidates.length})
        </div>
      )}
    </div>
  );
}

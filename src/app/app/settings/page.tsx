"use client";

import { useEffect, useState } from "react";
import { PROTOCOLS } from "@/lib/data";
import { useOrbitStore } from "@/lib/store";

export default function SettingsPage() {
  const armed = useOrbitStore((s) => s.armed);
  const setArmed = useOrbitStore((s) => s.setArmed);
  const [go2rtc, setGo2rtc] = useState<boolean | null>(null);
  const [protocols, setProtocols] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/stream/resolve")
      .then((r) => r.json())
      .then((d: { go2rtcConfigured?: boolean; protocols?: string[] }) => {
        setGo2rtc(Boolean(d.go2rtcConfigured));
        setProtocols(d.protocols ?? []);
      })
      .catch(() => setGo2rtc(false));
  }, []);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold">Ajustes</h1>
        <p className="text-sm text-mist-dim">
          Operação · gateway de vídeo · protocolos
        </p>
      </div>

      <section className="rounded-2xl border border-line bg-ink-2/45 p-5">
        <h2 className="font-display text-lg font-semibold">Modo armado</h2>
        <p className="mt-1 text-sm text-mist-dim">
          Define quais eventos geram push e sirene local.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {(
            [
              ["home", "Casa — perímetro"],
              ["away", "Ausente — tudo armado"],
              ["disarmed", "Desarmado"],
            ] as const
          ).map(([mode, label]) => (
            <button
              key={mode}
              type="button"
              onClick={() => setArmed(mode)}
              className={
                armed === mode
                  ? "rounded-lg bg-signal/20 px-3 py-2 text-sm text-signal"
                  : "rounded-lg border border-line px-3 py-2 text-sm text-mist-dim"
              }
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-ink-2/45 p-5">
        <h2 className="font-display text-lg font-semibold">
          Gateway de streaming (XMeye / DVRIP / RTSP)
        </h2>
        <p className="mt-1 text-sm text-mist-dim">
          O browser não fala Cloud P2P nem RTSP cru. Use{" "}
          <strong className="text-mist">go2rtc</strong> na mesma rede das
          câmeras (ou tunelado) e aponte no Railway:
        </p>
        <div className="mt-4 space-y-2 rounded-xl border border-line bg-ink/50 p-3 font-mono text-xs text-mist-dim">
          <p>ORBIT_GO2RTC_URL=https://seu-go2rtc.exemplo</p>
          <p className="text-[11px] text-mist/80">
            # go2rtc.yaml — exemplo XMeye/ICSee
          </p>
          <p>streams:</p>
          <p className="pl-3">
            casa_rua: dvrip://admin:SENHA@192.168.0.20:34567?channel=0&amp;subtype=0
          </p>
        </div>
        <p className="mt-3 text-sm">
          Status:{" "}
          {go2rtc === null ? (
            <span className="text-mist-dim">verificando…</span>
          ) : go2rtc ? (
            <span className="text-signal">go2rtc configurado</span>
          ) : (
            <span className="text-amber">
              go2rtc não configurado — use URL HLS manual em Detalhes
            </span>
          )}
        </p>
        {protocols.length > 0 && (
          <ul className="mt-3 space-y-1 text-xs text-mist-dim">
            {protocols.map((p) => (
              <li key={p}>· {p}</li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-line bg-ink-2/45 p-5">
        <h2 className="font-display text-lg font-semibold">
          Protocolos do inventário
        </h2>
        <ul className="mt-4 space-y-2">
          {PROTOCOLS.map((p) => (
            <li
              key={p.name}
              className="flex items-center justify-between border-b border-line/60 py-2 text-sm last:border-0"
            >
              <span>{p.name}</span>
              <span className="text-xs text-signal">ativo</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

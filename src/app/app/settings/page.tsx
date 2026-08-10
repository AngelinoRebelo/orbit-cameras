"use client";

import { PROTOCOLS } from "@/lib/data";
import { useOrbitStore } from "@/lib/store";

export default function SettingsPage() {
  const armed = useOrbitStore((s) => s.armed);
  const setArmed = useOrbitStore((s) => s.setArmed);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold">Ajustes</h1>
        <p className="text-sm text-mist-dim">
          Preferências da conta demo · prontas para API real
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
          Gateway de streaming
        </h2>
        <p className="mt-1 text-sm text-mist-dim">
          No Railway, aponte variáveis de ambiente para o worker RTSP→WebRTC.
        </p>
        <div className="mt-4 space-y-2 font-mono text-xs text-mist-dim">
          <p>ORBIT_WEBRTC_GATEWAY=wss://…</p>
          <p>ORBIT_ONVIF_DISCOVERY=true</p>
          <p>ORBIT_STORAGE_BUCKET=s3://…</p>
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-ink-2/45 p-5">
        <h2 className="font-display text-lg font-semibold">
          Protocolos habilitados
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

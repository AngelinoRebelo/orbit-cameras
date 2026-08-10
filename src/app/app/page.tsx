"use client";

import Link from "next/link";
import { Bell, Camera, Radio, ShieldAlert } from "lucide-react";
import { CameraFeed } from "@/components/CameraFeed";
import { EVENTS, SITES } from "@/lib/data";
import { useOrbitStore } from "@/lib/store";
import { formatRelative } from "@/lib/utils";

export default function DashboardPage() {
  const cameras = useOrbitStore((s) => s.cameras);
  const nightMode = useOrbitStore((s) => s.nightMode);
  const muted = useOrbitStore((s) => s.muted);
  const armed = useOrbitStore((s) => s.armed);
  const setSelected = useOrbitStore((s) => s.setSelected);

  const online = cameras.filter((c) => c.status !== "offline").length;
  const alerts = cameras.filter((c) => c.status === "alert").length;
  const recording = cameras.filter((c) => c.status === "recording").length;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            Visão geral
          </h1>
          <p className="mt-1 text-sm text-mist-dim">
            Saúde da frota · {SITES.length} sites · modo{" "}
            {armed === "home" ? "Casa" : armed === "away" ? "Ausente" : "Off"}
          </p>
        </div>
        <Link
          href="/app/live"
          className="inline-flex items-center gap-2 rounded-lg bg-signal px-4 py-2.5 text-sm font-semibold text-ink"
        >
          <Radio className="size-4" />
          Abrir live
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Câmeras online",
            value: `${online}/${cameras.length}`,
            icon: Camera,
          },
          { label: "Gravando agora", value: String(recording), icon: Radio },
          { label: "Alertas ativos", value: String(alerts), icon: ShieldAlert },
          {
            label: "Eventos (24h)",
            value: String(EVENTS.length),
            icon: Bell,
          },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="rounded-2xl border border-line bg-ink-2/50 p-4"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.14em] text-mist-dim">
                  {stat.label}
                </p>
                <Icon className="size-4 text-signal" />
              </div>
              <p className="mt-3 font-display text-3xl font-bold">{stat.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Grade rápida</h2>
            <Link href="/app/live" className="text-xs text-signal">
              Ver tudo
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {cameras.slice(0, 6).map((cam) => (
              <Link
                key={cam.id}
                href="/app/live"
                onClick={() => setSelected(cam.id)}
                className="block aspect-video overflow-hidden rounded-xl"
              >
                <CameraFeed
                  camera={cam}
                  compact
                  nightMode={nightMode}
                  muted={muted}
                  className="h-full w-full rounded-xl"
                />
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-3 font-display text-lg font-semibold">
            Últimos eventos IA
          </h2>
          <div className="space-y-2">
            {EVENTS.slice(0, 5).map((ev) => {
              const cam = cameras.find((c) => c.id === ev.cameraId);
              return (
                <Link
                  key={ev.id}
                  href="/app/events"
                  className="block rounded-xl border border-line bg-ink-2/40 px-4 py-3 transition hover:border-signal/30"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{ev.label}</p>
                      <p className="mt-1 text-xs text-mist-dim">
                        {cam?.name ?? "Câmera"} ·{" "}
                        {Math.round(ev.confidence * 100)}% confiança
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-mist-dim">
                      {formatRelative(ev.at)}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

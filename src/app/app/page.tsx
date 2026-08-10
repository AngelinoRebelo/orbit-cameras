"use client";

import Link from "next/link";
import { Bell, Camera, Plus, Radio, ShieldAlert } from "lucide-react";
import { CameraFeed } from "@/components/CameraFeed";
import { EVENTS, SITES } from "@/lib/data";
import { useOrbitStore } from "@/lib/store";
import { formatRelative, statusLabel } from "@/lib/utils";

export default function DashboardPage() {
  const cameras = useOrbitStore((s) => s.cameras);
  const nightMode = useOrbitStore((s) => s.nightMode);
  const muted = useOrbitStore((s) => s.muted);
  const armed = useOrbitStore((s) => s.armed);
  const setSelected = useOrbitStore((s) => s.setSelected);

  const online = cameras.filter((c) => c.status !== "offline").length;
  const alerts = cameras.filter((c) => c.status === "alert").length;
  const recording = cameras.filter((c) => c.status === "recording").length;
  const modeLabel =
    armed === "home" ? "Casa" : armed === "away" ? "Ausente" : "Desarmado";

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-signal">
            Painel
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">
            Visão geral
          </h1>
          <p className="mt-1 text-sm text-mist-dim">
            {SITES.length} sites · modo {modeLabel} · {cameras.length} câmeras
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/app/cameras"
            className="inline-flex items-center gap-2 rounded-lg border border-line px-4 py-2.5 text-sm text-mist-dim transition hover:border-signal/40 hover:text-mist"
          >
            <Plus className="size-4" />
            Gerenciar
          </Link>
          <Link
            href="/app/live"
            className="inline-flex items-center gap-2 rounded-lg bg-signal px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-signal/90"
          >
            <Radio className="size-4" />
            Abrir live
          </Link>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Câmeras online",
            value: `${online}/${cameras.length}`,
            icon: Camera,
            tone: "text-signal",
          },
          {
            label: "Gravando agora",
            value: String(recording),
            icon: Radio,
            tone: "text-danger",
          },
          {
            label: "Alertas ativos",
            value: String(alerts),
            icon: ShieldAlert,
            tone: "text-amber",
          },
          {
            label: "Eventos (24h)",
            value: String(EVENTS.length),
            icon: Bell,
            tone: "text-signal",
          },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="rounded-2xl border border-line bg-ink-2/55 p-4 transition hover:border-white/15"
            >
              <div className="flex items-center justify-between">
                <p className="text-[11px] uppercase tracking-[0.14em] text-mist-dim">
                  {stat.label}
                </p>
                <Icon className={`size-4 ${stat.tone}`} />
              </div>
              <p className="mt-3 font-display text-3xl font-bold tracking-tight">
                {stat.value}
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Grade rápida</h2>
            <Link
              href="/app/live"
              className="text-xs font-medium text-signal hover:underline"
            >
              Ver mosaic
            </Link>
          </div>
          {cameras.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line px-6 py-16 text-center text-sm text-mist-dim">
              Nenhuma câmera no inventário.{" "}
              <Link href="/app/cameras" className="text-signal">
                Cadastrar agora
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {cameras.slice(0, 6).map((cam) => (
                <Link
                  key={cam.id}
                  href="/app/live"
                  onClick={() => setSelected(cam.id)}
                  className="group relative block aspect-video overflow-hidden rounded-xl ring-1 ring-line transition hover:ring-signal/40"
                >
                  <CameraFeed
                    camera={cam}
                    compact
                    nightMode={nightMode}
                    muted={muted}
                    className="h-full w-full rounded-xl"
                  />
                  <span className="pointer-events-none absolute bottom-2 left-2 rounded bg-black/50 px-1.5 py-0.5 text-[10px] text-mist backdrop-blur-sm">
                    {statusLabel(cam.status)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">
              Últimos eventos IA
            </h2>
            <Link
              href="/app/events"
              className="text-xs font-medium text-signal hover:underline"
            >
              Ver todos
            </Link>
          </div>
          <div className="space-y-2">
            {EVENTS.slice(0, 5).map((ev) => {
              const cam = cameras.find((c) => c.id === ev.cameraId);
              return (
                <Link
                  key={ev.id}
                  href="/app/events"
                  className="block rounded-xl border border-line bg-ink-2/45 px-4 py-3 transition hover:border-signal/30 hover:bg-ink-2/70"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{ev.label}</p>
                      <p className="mt-1 text-xs text-mist-dim">
                        {cam?.name ?? "Câmera removida"} ·{" "}
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

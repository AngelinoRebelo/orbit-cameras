"use client";

import {
  Box,
  Car,
  Dog,
  Footprints,
  User,
  Volume2,
} from "lucide-react";
import { EVENTS, getCamera, type DetectionType } from "@/lib/data";
import { formatRelative } from "@/lib/utils";

const ICONS: Record<DetectionType, typeof User> = {
  person: User,
  vehicle: Car,
  package: Box,
  pet: Dog,
  motion: Footprints,
  sound: Volume2,
};

export default function EventsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Eventos</h1>
        <p className="text-sm text-mist-dim">
          Detecção por IA · zonas · confiança · clipes prontos
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            "Todos",
            "Pessoa",
            "Veículo",
            "Pacote",
            "Pet",
            "Movimento",
            "Som",
          ] as const
        ).map((label, i) => (
          <button
            key={label}
            type="button"
            className={
              i === 0
                ? "rounded-full bg-signal/20 px-3 py-1.5 text-xs font-medium text-signal"
                : "rounded-full border border-line px-3 py-1.5 text-xs text-mist-dim hover:text-mist"
            }
          >
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {EVENTS.map((ev) => {
          const Icon = ICONS[ev.type];
          const cam = getCamera(ev.cameraId);
          return (
            <article
              key={ev.id}
              className="grid gap-4 rounded-2xl border border-line bg-ink-2/45 p-4 sm:grid-cols-[auto_1fr_auto] sm:items-center"
            >
              <div className="grid size-12 place-items-center rounded-xl bg-signal/10 text-signal">
                <Icon className="size-5" />
              </div>
              <div>
                <h2 className="font-medium">{ev.label}</h2>
                <p className="mt-1 text-sm text-mist-dim">
                  {cam?.name} · {cam?.location} · clipe {ev.clipDurationSec}s
                </p>
                <div className="mt-2 h-1.5 max-w-xs overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-signal"
                    style={{ width: `${ev.confidence * 100}%` }}
                  />
                </div>
                <p className="mt-1 text-[11px] text-mist-dim">
                  Confiança {Math.round(ev.confidence * 100)}%
                </p>
              </div>
              <div className="flex flex-col items-start gap-2 sm:items-end">
                <span className="text-xs text-mist-dim">
                  {formatRelative(ev.at)}
                </span>
                <button
                  type="button"
                  className="rounded-lg border border-line px-3 py-1.5 text-xs text-mist hover:border-signal/40"
                >
                  Ver clipe
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

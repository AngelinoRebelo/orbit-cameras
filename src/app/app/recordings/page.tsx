"use client";

import { Download, Play } from "lucide-react";
import { getCamera, RECORDINGS } from "@/lib/data";
import { formatClock, formatRelative } from "@/lib/utils";

export default function RecordingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Gravações</h1>
        <p className="text-sm text-mist-dim">
          Contínua · por evento · timeline forense · export MP4
        </p>
      </div>

      <div className="rounded-2xl border border-line bg-ink-2/40 p-4">
        <div className="mb-3 flex items-center justify-between text-xs text-mist-dim">
          <span>Timeline · últimas horas</span>
          <span>Cloud + edge</span>
        </div>
        <div className="relative h-16 overflow-hidden rounded-xl bg-ink">
          <div className="absolute inset-y-3 left-0 right-0 flex gap-1 px-2">
            {Array.from({ length: 48 }).map((_, i) => (
              <div
                key={i}
                className="flex-1 rounded-sm"
                style={{
                  background:
                    i % 7 === 0
                      ? "var(--amber)"
                      : i % 3 === 0
                        ? "var(--signal)"
                        : "rgba(232,241,242,0.12)",
                  opacity: 0.35 + (i % 5) * 0.1,
                }}
              />
            ))}
          </div>
          <div className="absolute inset-y-0 left-1/2 w-px bg-danger" />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-line">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-ink-2/70 text-xs uppercase tracking-wider text-mist-dim">
            <tr>
              <th className="px-4 py-3 font-medium">Câmera</th>
              <th className="hidden px-4 py-3 font-medium sm:table-cell">
                Início
              </th>
              <th className="px-4 py-3 font-medium">Duração</th>
              <th className="hidden px-4 py-3 font-medium md:table-cell">
                Trigger
              </th>
              <th className="px-4 py-3 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {RECORDINGS.map((rec) => {
              const cam = getCamera(rec.cameraId);
              return (
                <tr key={rec.id} className="border-b border-line/70">
                  <td className="px-4 py-3">
                    <p className="font-medium">{cam?.name}</p>
                    <p className="text-xs text-mist-dim">{rec.sizeMb} MB</p>
                  </td>
                  <td className="hidden px-4 py-3 text-mist-dim sm:table-cell">
                    {formatClock(rec.startedAt)} · {formatRelative(rec.startedAt)}
                  </td>
                  <td className="px-4 py-3">
                    {Math.round(rec.durationSec / 60)} min
                  </td>
                  <td className="hidden px-4 py-3 capitalize text-mist-dim md:table-cell">
                    {rec.trigger}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="rounded-lg border border-line p-2 text-mist-dim hover:text-signal"
                        aria-label="Reproduzir"
                      >
                        <Play className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        className="rounded-lg border border-line p-2 text-mist-dim hover:text-signal"
                        aria-label="Baixar"
                      >
                        <Download className="size-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

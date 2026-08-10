"use client";

import {
  Maximize2,
  Mic,
  MicOff,
  Moon,
  Move,
  Sun,
  Volume2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { CameraFeed } from "@/components/CameraFeed";
import { useOrbitStore, type GridLayout } from "@/lib/store";
import { cn } from "@/lib/utils";

const GRIDS: GridLayout[] = [1, 4, 9, 16];

export default function LivePage() {
  const cameras = useOrbitStore((s) => s.cameras);
  const selectedCameraId = useOrbitStore((s) => s.selectedCameraId);
  const setSelected = useOrbitStore((s) => s.setSelected);
  const grid = useOrbitStore((s) => s.grid);
  const setGrid = useOrbitStore((s) => s.setGrid);
  const muted = useOrbitStore((s) => s.muted);
  const toggleMute = useOrbitStore((s) => s.toggleMute);
  const nightMode = useOrbitStore((s) => s.nightMode);
  const toggleNight = useOrbitStore((s) => s.toggleNight);

  const selected =
    cameras.find((c) => c.id === selectedCameraId) ?? cameras[0];
  const visible = cameras.slice(0, grid === 1 ? 1 : grid);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Ao vivo</h1>
          <p className="text-sm text-mist-dim">
            Mosaic WebRTC · PTZ · áudio bidirecional
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-line p-1">
            {GRIDS.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGrid(g)}
                className={cn(
                  "rounded-md px-2.5 py-1.5 text-xs font-medium",
                  grid === g
                    ? "bg-signal/20 text-signal"
                    : "text-mist-dim hover:text-mist",
                )}
              >
                {g}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={toggleMute}
            className="rounded-lg border border-line p-2 text-mist-dim hover:text-mist"
            aria-label="Áudio"
          >
            {muted ? <MicOff className="size-4" /> : <Mic className="size-4" />}
          </button>
          <button
            type="button"
            onClick={toggleNight}
            className="rounded-lg border border-line p-2 text-mist-dim hover:text-mist"
            aria-label="Visão noturna"
          >
            {nightMode ? (
              <Moon className="size-4" />
            ) : (
              <Sun className="size-4" />
            )}
          </button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_280px]">
        <div
          className={cn(
            "grid gap-2",
            grid === 1 && "grid-cols-1",
            grid === 4 && "grid-cols-1 sm:grid-cols-2",
            grid === 9 && "grid-cols-2 lg:grid-cols-3",
            grid === 16 && "grid-cols-2 md:grid-cols-4",
          )}
        >
          {(grid === 1 ? [selected] : visible).map((cam) => (
            <CameraFeed
              key={cam.id}
              camera={cam}
              active={cam.id === selected.id}
              nightMode={nightMode}
              muted={muted}
              onClick={() => setSelected(cam.id)}
              className={cn(
                "w-full rounded-xl",
                grid === 1 ? "aspect-video min-h-[360px]" : "aspect-video",
              )}
            />
          ))}
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-line bg-ink-2/50 p-4">
            <h2 className="font-display text-sm font-semibold">
              Controles PTZ
            </h2>
            <p className="mt-1 text-xs text-mist-dim">
              {selected.ptz
                ? `${selected.name} · ONVIF PTZ`
                : "Câmera sem PTZ — zoom digital"}
            </p>
            <div className="mt-4 grid grid-cols-3 gap-2 place-items-center">
              <span />
              <button
                type="button"
                className="grid size-10 place-items-center rounded-lg border border-line text-mist-dim hover:border-signal/40 hover:text-signal"
              >
                ▲
              </button>
              <span />
              <button
                type="button"
                className="grid size-10 place-items-center rounded-lg border border-line text-mist-dim hover:border-signal/40 hover:text-signal"
              >
                ◀
              </button>
              <button
                type="button"
                className="grid size-10 place-items-center rounded-lg bg-signal/15 text-signal"
              >
                <Move className="size-4" />
              </button>
              <button
                type="button"
                className="grid size-10 place-items-center rounded-lg border border-line text-mist-dim hover:border-signal/40 hover:text-signal"
              >
                ▶
              </button>
              <span />
              <button
                type="button"
                className="grid size-10 place-items-center rounded-lg border border-line text-mist-dim hover:border-signal/40 hover:text-signal"
              >
                ▼
              </button>
              <span />
            </div>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-line py-2 text-xs text-mist-dim"
              >
                <ZoomOut className="size-3.5" /> Zoom −
              </button>
              <button
                type="button"
                className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-line py-2 text-xs text-mist-dim"
              >
                <ZoomIn className="size-3.5" /> Zoom +
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-ink-2/50 p-4">
            <h2 className="font-display text-sm font-semibold">Stream</h2>
            <dl className="mt-3 space-y-2 text-xs">
              <div className="flex justify-between gap-2">
                <dt className="text-mist-dim">Protocolo</dt>
                <dd>{selected.protocol}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-mist-dim">Codec</dt>
                <dd>{selected.codec}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-mist-dim">FPS / Res</dt>
                <dd>
                  {selected.fps} · {selected.resolution}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-mist-dim">Latência</dt>
                <dd className="text-signal">{selected.streamLatencyMs} ms</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-mist-dim">Áudio</dt>
                <dd className="inline-flex items-center gap-1">
                  {selected.twoWayAudio ? (
                    <>
                      <Volume2 className="size-3" /> Bidirecional
                    </>
                  ) : (
                    "Somente escuta"
                  )}
                </dd>
              </div>
            </dl>
            <button
              type="button"
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-line py-2 text-xs text-mist-dim"
            >
              <Maximize2 className="size-3.5" />
              Tela cheia
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

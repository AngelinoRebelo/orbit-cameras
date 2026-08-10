"use client";

import { useCallback, useState } from "react";
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
import { VmsCloudPanel } from "@/components/VmsCloudPanel";
import type { CloudConnectResult } from "@/lib/cloud";
import { isCloudCamera } from "@/lib/cloud";
import { useOrbitStore, type GridLayout } from "@/lib/store";
import { cn, statusLabel } from "@/lib/utils";

const GRIDS: GridLayout[] = [1, 4, 9, 16];

export default function LivePage() {
  const cameras = useOrbitStore((s) => s.cameras);
  const selectedCameraId = useOrbitStore((s) => s.selectedCameraId);
  const setSelected = useOrbitStore((s) => s.setSelected);
  const updateCamera = useOrbitStore((s) => s.updateCamera);
  const grid = useOrbitStore((s) => s.grid);
  const setGrid = useOrbitStore((s) => s.setGrid);
  const muted = useOrbitStore((s) => s.muted);
  const toggleMute = useOrbitStore((s) => s.toggleMute);
  const nightMode = useOrbitStore((s) => s.nightMode);
  const toggleNight = useOrbitStore((s) => s.toggleNight);
  const [feedKey, setFeedKey] = useState(0);

  const selected =
    cameras.find((c) => c.id === selectedCameraId) ?? cameras[0];
  const visible = cameras.slice(0, grid === 1 ? 1 : grid);
  const cloudDevices = cameras.filter(isCloudCamera);

  const onCloudConnected = useCallback(
    (_id: string, result: CloudConnectResult) => {
      if (result.ok) setFeedKey((k) => k + 1);
    },
    [],
  );

  if (!selected) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line px-6 py-24 text-center">
        <h1 className="font-display text-2xl font-bold">Sem câmeras ao vivo</h1>
        <p className="mt-2 max-w-sm text-sm text-mist-dim">
          Cadastre um dispositivo com N.º de série e senha (modo VMS / Cloud).
        </p>
        <a
          href="/app/cameras"
          className="mt-6 rounded-lg bg-signal px-4 py-2.5 text-sm font-semibold text-ink"
        >
          Ir para câmeras
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Ao vivo · VMS</h1>
          <p className="text-sm text-mist-dim">
            Conexão cloud por Serial NO + login/senha do dispositivo
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

      <div className="grid gap-4 xl:grid-cols-[240px_1fr_300px]">
        {/* Lista de dispositivos — padrão VMS */}
        <aside className="rounded-2xl border border-line bg-ink-2/50 p-3">
          <h2 className="px-1 font-display text-sm font-semibold">
            Dispositivos
          </h2>
          <p className="mb-2 px-1 text-[11px] text-mist-dim">
            {cloudDevices.length} cloud · {cameras.length} total
          </p>
          <ul className="max-h-[70vh] space-y-1 overflow-y-auto">
            {cameras.map((cam) => {
              const active = cam.id === selected.id;
              const cloud = isCloudCamera(cam);
              return (
                <li key={cam.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(cam.id)}
                    onDoubleClick={() => {
                      setSelected(cam.id);
                      setGrid(1);
                      setFeedKey((k) => k + 1);
                    }}
                    className={cn(
                      "w-full rounded-xl border px-3 py-2.5 text-left transition",
                      active
                        ? "border-signal/40 bg-signal/10"
                        : "border-transparent hover:border-line hover:bg-white/5",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium">
                        {cam.name}
                      </span>
                      <span
                        className={cn(
                          "size-1.5 shrink-0 rounded-full",
                          cam.status === "offline"
                            ? "bg-mist-dim"
                            : cam.status === "alert"
                              ? "bg-danger"
                              : "bg-signal",
                        )}
                      />
                    </div>
                    <p className="mt-0.5 truncate font-mono text-[10px] text-mist-dim">
                      {cam.serialNumber
                        ? `SN ${cam.serialNumber}`
                        : cam.ipAddress
                          ? cam.ipAddress
                          : statusLabel(cam.status)}
                    </p>
                    {cloud && (
                      <p className="mt-0.5 text-[10px] uppercase tracking-wider text-signal/80">
                        Cloud P2P
                      </p>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        {/* Preview */}
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
              key={`${cam.id}-${feedKey}`}
              camera={cam}
              active={cam.id === selected.id}
              nightMode={nightMode}
              muted={muted}
              preferCloud
              onClick={() => setSelected(cam.id)}
              onUpdateCamera={updateCamera}
              className={cn(
                "w-full rounded-xl",
                grid === 1 ? "aspect-video min-h-[360px]" : "aspect-video",
              )}
            />
          ))}
        </div>

        {/* Painel direito: login cloud + PTZ */}
        <aside className="space-y-4">
          <VmsCloudPanel
            camera={selected}
            onUpdateCamera={updateCamera}
            onConnected={onCloudConnected}
          />

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
                <dt className="text-mist-dim">Serial</dt>
                <dd className="truncate font-mono">
                  {selected.serialNumber || "—"}
                </dd>
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

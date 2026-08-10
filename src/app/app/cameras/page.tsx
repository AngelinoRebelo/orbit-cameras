"use client";

import { useMemo, useState } from "react";
import { Info, Plus, Search } from "lucide-react";
import { AddCameraModal } from "@/components/AddCameraModal";
import { CameraAbout } from "@/components/CameraAbout";
import { CameraFeed } from "@/components/CameraFeed";
import { SITES, type Camera } from "@/lib/data";
import { useOrbitStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export default function CamerasPage() {
  const cameras = useOrbitStore((s) => s.cameras);
  const addCamera = useOrbitStore((s) => s.addCamera);
  const nightMode = useOrbitStore((s) => s.nightMode);
  const muted = useOrbitStore((s) => s.muted);
  const [site, setSite] = useState<string>("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<Camera | null>(null);

  const filtered = useMemo(() => {
    return cameras.filter((c) => {
      if (site !== "all" && c.site !== site) return false;
      if (!q.trim()) return true;
      const hay =
        `${c.name} ${c.brand} ${c.model} ${c.location} ${c.serialNumber ?? ""} ${c.ipAddress ?? ""} ${c.registerMode ?? ""}`.toLowerCase();
      return hay.includes(q.toLowerCase());
    });
  }, [cameras, site, q]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Câmeras</h1>
          <p className="text-sm text-mist-dim">
            Cadastro Cloud / QR / IP / ONVIF / RTSP · tipo XMeye & ICSee
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-signal px-4 py-2.5 text-sm font-semibold text-ink"
        >
          <Plus className="size-4" />
          Adicionar
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-mist-dim" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar nome, serial, IP, marca…"
            className="w-full rounded-xl border border-line bg-ink-2/60 py-2.5 pl-10 pr-3 text-sm outline-none placeholder:text-mist-dim focus:border-signal/40"
          />
        </div>
        <div className="flex flex-wrap gap-1 rounded-xl border border-line p-1">
          <button
            type="button"
            onClick={() => setSite("all")}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs",
              site === "all"
                ? "bg-signal/20 text-signal"
                : "text-mist-dim hover:text-mist",
            )}
          >
            Todos
          </button>
          {SITES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSite(s.id)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs",
                site === s.id
                  ? "bg-signal/20 text-signal"
                  : "text-mist-dim hover:text-mist",
              )}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((cam) => (
          <div
            key={cam.id}
            className="overflow-hidden rounded-2xl border border-line bg-ink-2/40"
          >
            <CameraFeed
              camera={cam}
              nightMode={nightMode}
              muted={muted}
              className="aspect-video w-full"
            />
            <div className="space-y-2 p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-display font-semibold">{cam.name}</p>
                  <p className="text-xs text-mist-dim">
                    {cam.brand} · {cam.model}
                  </p>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider",
                    cam.status === "offline"
                      ? "bg-white/10 text-mist-dim"
                      : cam.status === "alert"
                        ? "bg-danger/20 text-danger"
                        : "bg-signal/15 text-signal",
                  )}
                >
                  {cam.status}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 text-[11px] text-mist-dim">
                <span className="rounded border border-line px-2 py-0.5">
                  {cam.protocol}
                </span>
                {cam.registerMode && (
                  <span className="rounded border border-signal/30 px-2 py-0.5 text-signal">
                    {cam.registerMode}
                  </span>
                )}
                {cam.serialNumber && (
                  <span className="rounded border border-line px-2 py-0.5 font-mono">
                    SN …{cam.serialNumber.slice(-4)}
                  </span>
                )}
                {cam.ipAddress && (
                  <span className="rounded border border-line px-2 py-0.5 font-mono">
                    {cam.ipAddress}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setDetail(cam)}
                className="inline-flex items-center gap-1.5 text-xs text-mist-dim transition hover:text-signal"
              >
                <Info className="size-3.5" />
                Sobre o dispositivo
              </button>
            </div>
          </div>
        ))}
      </div>

      {open && (
        <AddCameraModal onClose={() => setOpen(false)} onAdd={addCamera} />
      )}
      {detail && (
        <CameraAbout camera={detail} onClose={() => setDetail(null)} />
      )}
    </div>
  );
}

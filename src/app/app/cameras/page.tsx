"use client";

import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { CameraFeed } from "@/components/CameraFeed";
import { BRAND_PRESETS, SITES, type Camera } from "@/lib/data";
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
  const [form, setForm] = useState({
    name: "",
    brand: BRAND_PRESETS[0].brand as string,
    protocol: "ONVIF" as Camera["protocol"],
    rtsp: "",
    site: "casa",
  });

  const filtered = useMemo(() => {
    return cameras.filter((c) => {
      if (site !== "all" && c.site !== site) return false;
      if (!q.trim()) return true;
      const hay = `${c.name} ${c.brand} ${c.model} ${c.location}`.toLowerCase();
      return hay.includes(q.toLowerCase());
    });
  }, [cameras, site, q]);

  function submitCamera(e: React.FormEvent) {
    e.preventDefault();
    const preset = BRAND_PRESETS.find((b) => b.brand === form.brand);
    const id = `cam-${Date.now()}`;
    const cam: Camera = {
      id,
      name: form.name || `Nova câmera ${cameras.length + 1}`,
      location: "Custom",
      site: form.site,
      status: "online",
      protocol: form.protocol,
      brand: form.brand,
      model: preset?.models[0] ?? "Custom",
      resolution: "1080p",
      fps: 25,
      codec: "H.265",
      nightVision: true,
      twoWayAudio: true,
      ptz: form.protocol === "ONVIF",
      wifiRssi: -50,
      storageDays: 14,
      thumbnailHue: Math.floor(Math.random() * 360),
      scene: form.rtsp || "Stream configurado",
      lastSeen: new Date().toISOString(),
      streamLatencyMs: 320,
    };
    addCamera(cam);
    setOpen(false);
    setForm({
      name: "",
      brand: BRAND_PRESETS[0].brand,
      protocol: "ONVIF",
      rtsp: "",
      site: "casa",
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Câmeras</h1>
          <p className="text-sm text-mist-dim">
            Inventário multi-marca · ONVIF discovery · RTSP manual
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
            placeholder="Buscar nome, marca, modelo…"
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
                <span className="rounded border border-line px-2 py-0.5">
                  {cam.codec}
                </span>
                <span className="rounded border border-line px-2 py-0.5">
                  {cam.resolution}
                </span>
                {cam.ptz && (
                  <span className="rounded border border-line px-2 py-0.5">
                    PTZ
                  </span>
                )}
                {cam.nightVision && (
                  <span className="rounded border border-line px-2 py-0.5">
                    IR / ColorVu
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/65 p-4 backdrop-blur-sm">
          <form
            onSubmit={submitCamera}
            className="w-full max-w-lg rounded-2xl border border-line bg-ink-2 p-6 shadow-2xl"
          >
            <h2 className="font-display text-xl font-semibold">
              Adicionar câmera Wi‑Fi
            </h2>
            <p className="mt-1 text-sm text-mist-dim">
              Preset de marca, URL RTSP ou descoberta ONVIF.
            </p>

            <div className="mt-5 space-y-3">
              <label className="block text-xs text-mist-dim">
                Nome
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm text-mist outline-none focus:border-signal/40"
                  placeholder="Ex.: Portaria lateral"
                />
              </label>
              <label className="block text-xs text-mist-dim">
                Marca
                <select
                  value={form.brand}
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm text-mist outline-none"
                >
                  {BRAND_PRESETS.map((b) => (
                    <option key={b.brand} value={b.brand}>
                      {b.brand}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-xs text-mist-dim">
                  Protocolo
                  <select
                    value={form.protocol}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        protocol: e.target.value as Camera["protocol"],
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm text-mist outline-none"
                  >
                    {["ONVIF", "RTSP", "RTMP", "WebRTC", "HLS"].map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-xs text-mist-dim">
                  Site
                  <select
                    value={form.site}
                    onChange={(e) => setForm({ ...form, site: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm text-mist outline-none"
                  >
                    {SITES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="block text-xs text-mist-dim">
                URL RTSP / endpoint
                <input
                  value={form.rtsp}
                  onChange={(e) => setForm({ ...form, rtsp: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-line bg-ink px-3 py-2 font-mono text-xs text-mist outline-none focus:border-signal/40"
                  placeholder="rtsp://user:pass@192.168.0.20:554/stream1"
                />
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg px-4 py-2 text-sm text-mist-dim hover:text-mist"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-lg bg-signal px-4 py-2 text-sm font-semibold text-ink"
              >
                Conectar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import {
  CheckSquare,
  Info,
  Plus,
  Search,
  Square,
  Trash2,
  VideoOff,
} from "lucide-react";
import { AddCameraModal } from "@/components/AddCameraModal";
import { CameraAbout } from "@/components/CameraAbout";
import { CameraFeed } from "@/components/CameraFeed";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { SITES, type Camera } from "@/lib/data";
import { useOrbitStore } from "@/lib/store";
import { cn, statusLabel } from "@/lib/utils";

export default function CamerasPage() {
  const cameras = useOrbitStore((s) => s.cameras);
  const addCamera = useOrbitStore((s) => s.addCamera);
  const removeCamera = useOrbitStore((s) => s.removeCamera);
  const removeCameras = useOrbitStore((s) => s.removeCameras);
  const nightMode = useOrbitStore((s) => s.nightMode);
  const muted = useOrbitStore((s) => s.muted);

  const [site, setSite] = useState<string>("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<Camera | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [pendingDelete, setPendingDelete] = useState<
    { type: "one"; camera: Camera } | { type: "many"; ids: string[] } | null
  >(null);

  const filtered = useMemo(() => {
    return cameras.filter((c) => {
      if (site !== "all" && c.site !== site) return false;
      if (!q.trim()) return true;
      const hay =
        `${c.name} ${c.brand} ${c.model} ${c.location} ${c.serialNumber ?? ""} ${c.ipAddress ?? ""} ${c.registerMode ?? ""}`.toLowerCase();
      return hay.includes(q.toLowerCase());
    });
  }, [cameras, site, q]);

  function toggleSelect(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function confirmDelete() {
    if (!pendingDelete) return;
    if (pendingDelete.type === "one") {
      removeCamera(pendingDelete.camera.id);
      if (detail?.id === pendingDelete.camera.id) setDetail(null);
      setSelected((ids) => ids.filter((id) => id !== pendingDelete.camera.id));
    } else {
      removeCameras(pendingDelete.ids);
      setSelected([]);
      setSelectMode(false);
      if (detail && pendingDelete.ids.includes(detail.id)) setDetail(null);
    }
    setPendingDelete(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-signal">
            Inventário
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">
            Câmeras
          </h1>
          <p className="mt-1 text-sm text-mist-dim">
            {cameras.length} dispositivo{cameras.length === 1 ? "" : "s"} · QR por
            imagem, pesquisa na rede, Cloud, IP, ONVIF e RTSP
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setSelectMode((v) => !v);
              setSelected([]);
            }}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition",
              selectMode
                ? "border-signal/40 bg-signal/10 text-signal"
                : "border-line text-mist-dim hover:text-mist",
            )}
          >
            {selectMode ? (
              <CheckSquare className="size-4" />
            ) : (
              <Square className="size-4" />
            )}
            {selectMode ? "Cancelar seleção" : "Selecionar"}
          </button>
          {selectMode && selected.length > 0 && (
            <button
              type="button"
              onClick={() => setPendingDelete({ type: "many", ids: selected })}
              className="inline-flex items-center gap-2 rounded-lg border border-danger/40 bg-danger/10 px-3 py-2.5 text-sm font-medium text-danger transition hover:bg-danger/20"
            >
              <Trash2 className="size-4" />
              Excluir ({selected.length})
            </button>
          )}
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-signal px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-signal/90"
          >
            <Plus className="size-4" />
            Adicionar
          </button>
        </div>
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
        <div className="flex flex-wrap gap-1 rounded-xl border border-line bg-ink-2/30 p-1">
          <button
            type="button"
            onClick={() => setSite("all")}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs transition",
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
                "rounded-lg px-3 py-1.5 text-xs transition",
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

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-ink-2/30 px-6 py-20 text-center">
          <VideoOff className="size-10 text-mist-dim/60" />
          <h2 className="mt-4 font-display text-xl font-semibold">
            Nenhum dispositivo
          </h2>
          <p className="mt-2 max-w-sm text-sm text-mist-dim">
            Cadastre câmeras via Cloud, QR, IP, ONVIF ou RTSP para começar a
            monitorar.
          </p>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-signal px-4 py-2.5 text-sm font-semibold text-ink"
          >
            <Plus className="size-4" />
            Cadastrar câmera
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((cam) => {
            const isSelected = selected.includes(cam.id);
            return (
              <div
                key={cam.id}
                className={cn(
                  "group overflow-hidden rounded-2xl border bg-ink-2/40 transition",
                  isSelected
                    ? "border-signal/50 ring-1 ring-signal/30"
                    : "border-line hover:border-white/15",
                )}
              >
                <div className="relative">
                  <CameraFeed
                    camera={cam}
                    nightMode={nightMode}
                    muted={muted}
                    className="aspect-video w-full"
                    onClick={
                      selectMode
                        ? () => toggleSelect(cam.id)
                        : () => setDetail(cam)
                    }
                  />
                  {selectMode && (
                    <button
                      type="button"
                      onClick={() => toggleSelect(cam.id)}
                      className="absolute left-3 top-3 z-10 rounded-md bg-black/55 p-1.5 text-mist backdrop-blur-sm"
                      aria-label="Selecionar"
                    >
                      {isSelected ? (
                        <CheckSquare className="size-4 text-signal" />
                      ) : (
                        <Square className="size-4" />
                      )}
                    </button>
                  )}
                </div>
                <div className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-display font-semibold">
                        {cam.name}
                      </p>
                      <p className="truncate text-xs text-mist-dim">
                        {cam.brand} · {cam.model}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
                        cam.status === "offline"
                          ? "bg-white/10 text-mist-dim"
                          : cam.status === "alert"
                            ? "bg-danger/20 text-danger"
                            : cam.status === "recording"
                              ? "bg-danger/15 text-danger"
                              : "bg-signal/15 text-signal",
                      )}
                    >
                      {statusLabel(cam.status)}
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
                  <div className="flex items-center gap-2 border-t border-line/70 pt-3">
                    <button
                      type="button"
                      onClick={() => setDetail(cam)}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-line py-2 text-xs text-mist-dim transition hover:border-signal/40 hover:text-signal"
                    >
                      <Info className="size-3.5" />
                      Detalhes
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setPendingDelete({ type: "one", camera: cam })
                      }
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-line px-3 py-2 text-xs text-mist-dim transition hover:border-danger/40 hover:bg-danger/10 hover:text-danger"
                      aria-label={`Excluir ${cam.name}`}
                    >
                      <Trash2 className="size-3.5" />
                      Excluir
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {open && (
        <AddCameraModal onClose={() => setOpen(false)} onAdd={addCamera} />
      )}
      {detail && (
        <CameraAbout
          camera={detail}
          onClose={() => setDetail(null)}
          onDelete={() => {
            setPendingDelete({ type: "one", camera: detail });
          }}
        />
      )}
      {pendingDelete && (
        <ConfirmDialog
          title={
            pendingDelete.type === "one"
              ? `Excluir “${pendingDelete.camera.name}”?`
              : `Excluir ${pendingDelete.ids.length} dispositivos?`
          }
          description={
            pendingDelete.type === "one"
              ? "O dispositivo será removido do inventário Orbit. Gravações e eventos vinculados deixam de aparecer no painel."
              : "Os dispositivos selecionados serão removidos permanentemente deste inventário."
          }
          confirmLabel="Excluir"
          onConfirm={confirmDelete}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  );
}

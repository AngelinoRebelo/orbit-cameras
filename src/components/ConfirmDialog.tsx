"use client";

import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  danger = true,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/70 p-4 backdrop-blur-sm">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="w-full max-w-md rounded-2xl border border-line bg-ink-2 p-6 shadow-2xl"
      >
        <div className="flex gap-3">
          <div
            className={
              danger
                ? "grid size-10 shrink-0 place-items-center rounded-xl bg-danger/15 text-danger"
                : "grid size-10 shrink-0 place-items-center rounded-xl bg-signal/15 text-signal"
            }
          >
            <AlertTriangle className="size-5" />
          </div>
          <div>
            <h2 id="confirm-title" className="font-display text-lg font-semibold">
              {title}
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-mist-dim">
              {description}
            </p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-4 py-2.5 text-sm text-mist-dim transition hover:bg-white/5 hover:text-mist"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={
              danger
                ? "rounded-lg bg-danger px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-danger/90"
                : "rounded-lg bg-signal px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-signal/90"
            }
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

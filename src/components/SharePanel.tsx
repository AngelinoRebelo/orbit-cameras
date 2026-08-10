"use client";

import { QRCodeSVG } from "qrcode.react";
import { Copy, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import { useOrbitStore } from "@/lib/store";

export function SharePanel({ origin }: { origin: string }) {
  const shareCode = useOrbitStore((s) => s.shareCode);
  const shareExpiresAt = useOrbitStore((s) => s.shareExpiresAt);
  const refreshShare = useOrbitStore((s) => s.refreshShare);
  const [copied, setCopied] = useState(false);

  const joinUrl = useMemo(
    () => `${origin}/join/${shareCode}`,
    [origin, shareCode],
  );

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="rounded-2xl border border-line bg-ink-2/60 p-6">
        <h2 className="font-display text-2xl font-semibold">
          Sessão de visualização
        </h2>
        <p className="mt-2 max-w-lg text-sm text-mist-dim">
          Compartilhe o acesso ao vivo com convidados. O código abre a rede de
          câmeras em modo leitor — sem painel de administração.
        </p>

        <div className="mt-6 flex flex-wrap items-end gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-mist-dim">
              Código da sessão
            </p>
            <p className="mt-1 font-display text-4xl font-bold tracking-[0.2em] text-signal">
              {shareCode}
            </p>
          </div>
          <button
            type="button"
            onClick={refreshShare}
            className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm text-mist-dim transition hover:border-signal/40 hover:text-mist"
          >
            <RefreshCw className="size-4" />
            Novo código
          </button>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <code className="flex-1 truncate rounded-lg border border-line bg-ink/70 px-3 py-3 font-mono text-xs text-mist">
            {joinUrl}
          </code>
          <button
            type="button"
            onClick={copyLink}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-signal px-4 py-3 text-sm font-semibold text-ink transition hover:bg-signal/90"
          >
            <Copy className="size-4" />
            {copied ? "Copiado" : "Copiar link"}
          </button>
        </div>

        <p className="mt-4 text-xs text-mist-dim">
          Expira em{" "}
          {new Date(shareExpiresAt).toLocaleString("pt-BR", {
            dateStyle: "short",
            timeStyle: "short",
          })}
        </p>
      </div>

      <div className="flex flex-col items-center justify-center rounded-2xl border border-line bg-mist p-8 text-ink">
        <p className="mb-4 text-center text-sm font-medium text-ink/70">
          Escaneie para entrar na sessão
        </p>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <QRCodeSVG
            value={joinUrl}
            size={200}
            level="M"
            bgColor="#ffffff"
            fgColor="#071016"
            includeMargin={false}
          />
        </div>
        <p className="mt-4 max-w-[220px] text-center text-xs text-ink/55">
          QR com o link de entrada na rede/sessão Orbit
        </p>
      </div>
    </div>
  );
}

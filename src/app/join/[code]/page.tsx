"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { CameraFeed } from "@/components/CameraFeed";
import { useOrbitStore } from "@/lib/store";

export default function JoinSessionPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const cameras = useOrbitStore((s) => s.cameras);
  const shareCode = useOrbitStore((s) => s.shareCode);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const valid = code.toUpperCase() === shareCode;
  const liveCams = cameras.filter((c) => c.status !== "offline").slice(0, 4);
  const joinUrl = origin ? `${origin}/join/${code}` : "";

  return (
    <div className="atmosphere noise min-h-screen">
      <div className="relative z-10 mx-auto max-w-5xl px-4 py-8 md:px-6">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-full border border-signal/40 bg-signal/10">
              <span className="size-2.5 rounded-full bg-signal" />
            </span>
            <div>
              <p className="font-display text-lg font-bold">ORBIT</p>
              <p className="text-xs text-mist-dim">Sessão convidado</p>
            </div>
          </div>
          <Link href="/" className="text-sm text-mist-dim hover:text-mist">
            Sair
          </Link>
        </header>

        {!valid ? (
          <div className="rounded-2xl border border-danger/40 bg-danger/10 p-8 text-center">
            <h1 className="font-display text-2xl font-semibold">
              Código inválido ou expirado
            </h1>
            <p className="mt-2 text-sm text-mist-dim">
              Peça um novo QR/código em Compartilhar no painel Orbit.
            </p>
            <p className="mt-4 font-mono text-lg tracking-widest text-mist">
              {code}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div>
                <h1 className="font-display text-3xl font-bold">
                  Você está na sessão
                </h1>
                <p className="mt-2 text-sm text-mist-dim">
                  Código{" "}
                  <span className="font-mono tracking-[0.2em] text-signal">
                    {code.toUpperCase()}
                  </span>{" "}
                  · somente visualização
                </p>
              </div>
              {joinUrl && (
                <div className="rounded-xl bg-mist p-3 text-ink">
                  <QRCodeSVG
                    value={joinUrl}
                    size={120}
                    bgColor="#e8f1f2"
                    fgColor="#071016"
                  />
                  <p className="mt-2 max-w-[120px] text-center text-[10px] text-ink/60">
                    QR da sessão
                  </p>
                </div>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {liveCams.map((cam) => (
                <CameraFeed
                  key={cam.id}
                  camera={cam}
                  className="aspect-video w-full rounded-xl"
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

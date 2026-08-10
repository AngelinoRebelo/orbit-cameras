"use client";

import { useEffect, useState } from "react";
import { SharePanel } from "@/components/SharePanel";

export default function SharePage() {
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  if (!origin) {
    return (
      <div className="space-y-2">
        <h1 className="font-display text-3xl font-bold">Compartilhar</h1>
        <p className="text-sm text-mist-dim">Preparando sessão…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Compartilhar</h1>
        <p className="text-sm text-mist-dim">
          Link + QR code escaneável para entrada na rede/sessão
        </p>
      </div>
      <SharePanel origin={origin} />
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Cloud, Loader2, Radio } from "lucide-react";
import type { Camera } from "@/lib/data";
import {
  cloudLoginPatch,
  type CloudConnectResult,
} from "@/lib/cloud";

interface VmsCloudPanelProps {
  camera?: Camera;
  onUpdateCamera: (id: string, patch: Partial<Camera>) => void;
  onConnected?: (cameraId: string, result: CloudConnectResult) => void;
}

export function VmsCloudPanel({
  camera,
  onUpdateCamera,
  onConnected,
}: VmsCloudPanelProps) {
  const [serial, setSerial] = useState(camera?.serialNumber ?? "");
  const [user, setUser] = useState(camera?.deviceLogin || "admin");
  const [pass, setPass] = useState(camera?.devicePassword ?? "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [gateway, setGateway] = useState<boolean | null>(null);

  useEffect(() => {
    setSerial(camera?.serialNumber ?? "");
    setUser(camera?.deviceLogin || "admin");
    setPass(camera?.devicePassword ?? "");
    setMsg(null);
    setOk(false);
  }, [camera?.id, camera?.serialNumber, camera?.deviceLogin, camera?.devicePassword]);

  useEffect(() => {
    fetch("/api/cloud/connect")
      .then((r) => r.json())
      .then((d: { gatewayConfigured?: boolean }) =>
        setGateway(Boolean(d.gatewayConfigured)),
      )
      .catch(() => setGateway(false));
  }, []);

  async function connect() {
    if (!camera) {
      setMsg("Selecione um dispositivo na lista.");
      setOk(false);
      return;
    }
    if (!serial.trim() || !pass) {
      setMsg("Preencha Serial NO e senha do dispositivo.");
      setOk(false);
      return;
    }

    setBusy(true);
    setMsg(null);
    try {
      const patch = cloudLoginPatch({
        serialNumber: serial,
        username: user,
        password: pass,
        platform: camera.cloudPlatform,
      });
      onUpdateCamera(camera.id, patch);

      const res = await fetch("/api/cloud/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serialNumber: serial,
          username: user,
          password: pass,
          cameraId: camera.id,
          platform: camera.cloudPlatform ?? "XMeye",
        }),
      });
      const data = (await res.json()) as CloudConnectResult;
      setOk(Boolean(data.ok));
      setMsg(data.message);

      if (data.ok && data.playbackUrl) {
        onUpdateCamera(camera.id, {
          ...patch,
          playbackUrl: data.playbackUrl,
          playbackType: data.playbackKind ?? "auto",
          status: "online",
        });
      } else if (data.ok) {
        onUpdateCamera(camera.id, {
          ...patch,
          status: "online",
        });
      }
      onConnected?.(camera.id, data);
    } catch {
      setOk(false);
      setMsg("Falha de rede ao conectar na nuvem.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-line bg-ink-2/50 p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="grid size-8 place-items-center rounded-lg bg-signal/15 text-signal">
          <Cloud className="size-4" />
        </span>
        <div>
          <h2 className="font-display text-sm font-semibold">
            Login dispositivo (nuvem)
          </h2>
          <p className="text-[11px] text-mist-dim">
            Padrão VMS Windows · Serial + user + senha
          </p>
        </div>
      </div>

      <div className="space-y-2.5">
        <label className="block text-[11px] text-mist-dim">
          Serial NO / Cloud ID
          <input
            value={serial}
            onChange={(e) => setSerial(e.target.value)}
            placeholder="ex.: f9b1765cf546a7b15nr0"
            className="mt-1 w-full rounded-lg border border-line bg-ink px-2.5 py-2 font-mono text-xs text-mist outline-none focus:border-signal/50"
            autoComplete="off"
          />
        </label>
        <label className="block text-[11px] text-mist-dim">
          Usuário do dispositivo
          <input
            value={user}
            onChange={(e) => setUser(e.target.value)}
            placeholder="admin"
            className="mt-1 w-full rounded-lg border border-line bg-ink px-2.5 py-2 text-xs text-mist outline-none focus:border-signal/50"
            autoComplete="username"
          />
        </label>
        <label className="block text-[11px] text-mist-dim">
          Senha do dispositivo
          <input
            type="password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            placeholder="••••••••"
            className="mt-1 w-full rounded-lg border border-line bg-ink px-2.5 py-2 text-xs text-mist outline-none focus:border-signal/50"
            autoComplete="current-password"
          />
        </label>

        <button
          type="button"
          disabled={busy || !camera}
          onClick={() => void connect()}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-signal px-3 py-2.5 text-sm font-semibold text-ink disabled:opacity-60"
        >
          {busy ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Radio className="size-4" />
          )}
          {busy ? "Conectando…" : "Conectar na nuvem"}
        </button>
      </div>

      <div className="mt-3 space-y-1.5 text-[11px] leading-relaxed">
        {msg && (
          <p className={ok ? "text-signal" : "text-amber"}>{msg}</p>
        )}
        <p className="text-mist-dim">
          Com o bridge NetSDK (pasta <span className="font-mono">bridge/</span>)
          + <span className="font-mono">ORBIT_CLOUD_GATEWAY</span>, o Conectar
          devolve HLS como o VMS. Sem bridge: cole HLS, use IP na LAN ou{" "}
          <a
            href="https://v2.xmeye.net/#/login"
            target="_blank"
            rel="noreferrer"
            className="text-signal underline-offset-2 hover:underline"
          >
            XMeye Web
          </a>
          .
        </p>
        {gateway ? (
          <p className="text-signal">Bridge NetSDK ativo</p>
        ) : gateway === false ? (
          <p className="text-mist-dim">Bridge ainda não apontado no Railway</p>
        ) : null}
      </div>
    </div>
  );
}

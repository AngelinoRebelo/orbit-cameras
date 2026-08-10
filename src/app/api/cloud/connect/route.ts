import { NextResponse } from "next/server";
import {
  cloudGatewayBase,
  normalizeSerial,
  parseGatewayPlayback,
  type CloudConnectPayload,
  type CloudConnectResult,
} from "@/lib/cloud";

export const runtime = "nodejs";

async function connectViaGateway(
  payload: CloudConnectPayload,
): Promise<CloudConnectResult | null> {
  const base = cloudGatewayBase();
  if (!base) return null;

  const res = await fetch(`${base}/connect`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      serialNumber: normalizeSerial(payload.serialNumber),
      username: payload.username,
      password: payload.password,
      cameraId: payload.cameraId,
      channel: payload.channel ?? 0,
      platform: payload.platform ?? "XMeye",
    }),
  });

  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    return {
      ok: false,
      mode: "gateway",
      gatewayConfigured: true,
      message:
        (typeof data.error === "string" && data.error) ||
        (typeof data.message === "string" && data.message) ||
        `Gateway cloud respondeu HTTP ${res.status}`,
    };
  }

  const playback = parseGatewayPlayback(data);
  if (playback) {
    return {
      ok: true,
      mode: "gateway",
      online: true,
      playbackUrl: playback.playbackUrl,
      playbackKind: playback.playbackKind,
      label: playback.label,
      gatewayConfigured: true,
      message: "Stream cloud obtido via gateway (padrão VMS / NetSDK).",
    };
  }

  return {
    ok: Boolean(data.ok !== false),
    mode: "gateway",
    online: data.online === true,
    gatewayConfigured: true,
    message:
      (typeof data.message === "string" && data.message) ||
      "Gateway aceitou o login, mas não devolveu URL HLS/WebRTC.",
  };
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CloudConnectPayload;
    const serialNumber = normalizeSerial(body.serialNumber || "");
    const username = (body.username || "admin").trim();
    const password = body.password || "";

    if (!serialNumber || serialNumber.length < 6) {
      return NextResponse.json(
        {
          ok: false,
          mode: "unavailable",
          gatewayConfigured: Boolean(cloudGatewayBase()),
          message: "Informe o N.º de série / Cloud ID do dispositivo.",
        } satisfies CloudConnectResult,
        { status: 400 },
      );
    }
    if (!password) {
      return NextResponse.json(
        {
          ok: false,
          mode: "unavailable",
          gatewayConfigured: Boolean(cloudGatewayBase()),
          message: "Informe a senha do dispositivo (como no VMS Windows).",
        } satisfies CloudConnectResult,
        { status: 400 },
      );
    }

    const viaGateway = await connectViaGateway({
      ...body,
      serialNumber,
      username,
      password,
    });
    if (viaGateway) {
      return NextResponse.json(viaGateway);
    }

    // Sem NetSDK no browser: registra sessão VMS e orienta gateway.
    const result: CloudConnectResult = {
      ok: true,
      mode: "session",
      online: undefined,
      gatewayConfigured: false,
      message:
        "Login cloud registrado (Serial + usuário + senha). O Chrome não fala P2P XMeye/ICSee como o VMS Windows — configure ORBIT_CLOUD_GATEWAY (bridge NetSDK→HLS) no Railway para o vídeo remoto, ou use go2rtc na LAN.",
    };
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        mode: "unavailable",
        gatewayConfigured: Boolean(cloudGatewayBase()),
        message:
          err instanceof Error ? err.message : "Falha ao conectar na nuvem",
      } satisfies CloudConnectResult,
      { status: 500 },
    );
  }
}

export async function GET() {
  const base = cloudGatewayBase();
  return NextResponse.json({
    gatewayConfigured: Boolean(base),
    pattern: "VMS Windows — Serial NO + device user + password",
    hint: base
      ? "ORBIT_CLOUD_GATEWAY ativo"
      : "Defina ORBIT_CLOUD_GATEWAY=https://seu-bridge (POST /connect → playbackUrl)",
  });
}

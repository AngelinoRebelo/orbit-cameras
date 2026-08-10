import { NextResponse } from "next/server";
import {
  buildDvripSource,
  buildRtspSource,
  detectPlaybackKind,
  resolveDirectPlayback,
  type ResolvedStream,
} from "@/lib/streaming";
import type { Camera } from "@/lib/data";

export const runtime = "nodejs";

function go2rtcBase() {
  return (process.env.ORBIT_GO2RTC_URL || "").replace(/\/$/, "");
}

async function registerGo2rtc(
  name: string,
  src: string,
): Promise<ResolvedStream | null> {
  const base = go2rtcBase();
  if (!base) return null;

  const putUrl = `${base}/api/streams?name=${encodeURIComponent(name)}&src=${encodeURIComponent(src)}`;
  try {
    const res = await fetch(putUrl, { method: "PUT" });
    // go2rtc returns 200 even when updating; 400 if bad
    if (!res.ok && res.status !== 400) {
      // try continue anyway — stream may already exist
      const text = await res.text().catch(() => "");
      if (res.status >= 500) {
        throw new Error(text || `go2rtc HTTP ${res.status}`);
      }
    }
  } catch (err) {
    throw new Error(
      err instanceof Error
        ? `Falha ao registrar no go2rtc: ${err.message}`
        : "Falha ao registrar no go2rtc",
    );
  }

  const hls = `${base}/api/stream.m3u8?src=${encodeURIComponent(name)}`;
  return {
    url: hls,
    kind: "hls",
    label: "HLS via go2rtc",
    via: "go2rtc",
  };
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { camera?: Camera };
    const camera = body.camera;
    if (!camera?.id) {
      return NextResponse.json({ error: "Câmera inválida" }, { status: 400 });
    }

    const direct = resolveDirectPlayback(camera);
    if (direct) {
      return NextResponse.json({
        ok: true,
        stream: direct,
        go2rtcConfigured: Boolean(go2rtcBase()),
      });
    }

    const dvrip = buildDvripSource(camera);
    const rtsp = buildRtspSource(camera);
    const preferred =
      camera.protocol === "RTSP" || camera.protocol === "ONVIF"
        ? rtsp || dvrip
        : dvrip || rtsp;

    if (preferred && go2rtcBase()) {
      const stream = await registerGo2rtc(camera.id, preferred);
      return NextResponse.json({
        ok: true,
        stream,
        source: preferred.replace(/:[^:@/]+@/, ":***@"),
        go2rtcConfigured: true,
      });
    }

    if (preferred && !go2rtcBase()) {
      return NextResponse.json({
        ok: false,
        tryLan: true,
        error:
          "Sem gateway go2rtc. Se você está na mesma Wi‑Fi da câmera, o Orbit tentará HTTP/MJPEG direto no navegador.",
        source: preferred.replace(/:[^:@/]+@/, ":***@"),
        go2rtcConfigured: false,
      });
    }

    return NextResponse.json({
      ok: false,
      tryLan: true,
      error:
        "Informe o IP local da câmera (mesma Wi‑Fi) para preview HTTP/MJPEG, ou cole uma URL HLS.",
      go2rtcConfigured: Boolean(go2rtcBase()),
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Erro ao resolver stream",
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  const base = go2rtcBase();
  return NextResponse.json({
    go2rtcConfigured: Boolean(base),
    go2rtcUrl: base ? "[configurado]" : null,
    protocols: [
      "HLS (.m3u8) — nativo no player",
      "MJPEG — img stream",
      "WebRTC/WHEP — via go2rtc",
      "DVRIP :34567 (XMeye/ICSee) — via go2rtc",
      "RTSP — via go2rtc → HLS/WebRTC",
    ],
    detectSample: detectPlaybackKind("https://example.com/live.m3u8"),
  });
}

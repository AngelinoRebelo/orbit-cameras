import type { Camera } from "./data";
import { cloudGatewayBase, isCloudCamera, parseGatewayPlayback } from "./cloud";

export type PlaybackKind = "hls" | "mjpeg" | "webrtc" | "video";

export interface ResolvedStream {
  url: string;
  kind: PlaybackKind;
  label: string;
  via: "direct" | "go2rtc" | "cloud" | "hint";
}

/** Monta fonte DVRIP (XMeye / ICSee / Sofia) para go2rtc */
export function buildDvripSource(camera: Camera): string | null {
  if (!camera.ipAddress) return null;
  const user = encodeURIComponent(camera.deviceLogin || "admin");
  const pass = encodeURIComponent(camera.devicePassword || "");
  const port = camera.ipPort && camera.ipPort > 0 ? camera.ipPort : 34567;
  return `dvrip://${user}:${pass}@${camera.ipAddress}:${port}?channel=0&subtype=0`;
}

export function buildRtspSource(camera: Camera): string | null {
  if (camera.rtspUrl?.toLowerCase().startsWith("rtsp://")) {
    return camera.rtspUrl;
  }
  if (!camera.ipAddress) return null;
  const user = encodeURIComponent(camera.deviceLogin || "admin");
  const pass = encodeURIComponent(camera.devicePassword || "");
  // Padrão comum em firmwares XM / Sofia
  return `rtsp://${user}:${pass}@${camera.ipAddress}:554/user=${user}&password=${pass}&channel=1&stream=0.sdp`;
}

export function detectPlaybackKind(url: string): PlaybackKind {
  const u = url.toLowerCase();
  if (u.includes(".m3u8") || u.includes("/hls") || u.includes("stream.m3u8")) {
    return "hls";
  }
  if (
    u.includes("mjpg") ||
    u.includes("mjpeg") ||
    u.includes("multipart") ||
    u.endsWith(".cgi")
  ) {
    return "mjpeg";
  }
  if (u.includes("whep") || u.includes("webrtc") || u.startsWith("webrtc:")) {
    return "webrtc";
  }
  return "video";
}

export function resolveDirectPlayback(camera: Camera): ResolvedStream | null {
  if (camera.playbackUrl) {
    const kind =
      camera.playbackType && camera.playbackType !== "auto"
        ? camera.playbackType
        : detectPlaybackKind(camera.playbackUrl);
    return {
      url: camera.playbackUrl,
      kind,
      label: kind.toUpperCase(),
      via: "direct",
    };
  }
  return null;
}

/** Tenta bridge NetSDK/VMS (serial + user + senha → HLS). */
export async function resolveCloudGateway(
  camera: Camera,
): Promise<ResolvedStream | null> {
  const base = cloudGatewayBase();
  if (!base) return null;
  if (!camera.serialNumber || !camera.devicePassword) return null;

  const res = await fetch(`${base}/connect`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      serialNumber: camera.serialNumber,
      username: camera.deviceLogin || "admin",
      password: camera.devicePassword,
      cameraId: camera.id,
      channel: 0,
      platform: camera.cloudPlatform ?? "XMeye",
    }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(
      (data && typeof data === "object" && "message" in data
        ? String((data as { message?: string }).message)
        : null) || `Cloud gateway HTTP ${res.status}`,
    );
  }
  const playback = parseGatewayPlayback(data);
  if (!playback) return null;
  return {
    url: playback.playbackUrl,
    kind: playback.playbackKind,
    label: playback.label,
    via: "cloud",
  };
}

export function explainMissingStream(camera: Camera): string {
  const cloud = isCloudCamera(camera);

  if (cloud && camera.serialNumber && (camera.hasDevicePassword || camera.devicePassword)) {
    if (!camera.playbackUrl && !camera.ipAddress) {
      return "Login cloud pronto (Serial + senha). Para vídeo remoto no browser (como VMS), o Railway precisa de ORBIT_CLOUD_GATEWAY (NetSDK→HLS). Sem bridge, use ICSee/XMeye no celular.";
    }
  }

  if (cloud && !camera.serialNumber) {
    return "Informe o N.º de série (Cloud ID) e a senha do dispositivo — padrão VMS Windows.";
  }

  if (cloud && !camera.ipAddress && !camera.playbackUrl) {
    return "Conecte por Serial + login/senha (nuvem). IP LAN só se estiver na mesma Wi‑Fi.";
  }
  if (camera.ipAddress && !camera.playbackUrl) {
    return "IP informado. Configure ORBIT_GO2RTC_URL no Railway ou cole uma URL HLS/MJPEG em Detalhes → Stream.";
  }
  if (camera.rtspUrl && !camera.playbackUrl) {
    return "RTSP não roda no browser. Use gateway go2rtc (RTSP→HLS/WebRTC) ou cole a URL HLS gerada.";
  }
  return "Nenhuma URL de reprodução configurada para esta câmera.";
}

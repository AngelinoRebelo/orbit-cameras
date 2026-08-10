import type { Camera } from "./data";

export type PlaybackKind = "hls" | "mjpeg" | "webrtc" | "video";

export interface ResolvedStream {
  url: string;
  kind: PlaybackKind;
  label: string;
  via: "direct" | "go2rtc" | "hint";
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

export function explainMissingStream(camera: Camera): string {
  const isXm =
    camera.protocol === "XM / ICSee" ||
    camera.protocol === "Cloud P2P" ||
    camera.cloudPlatform === "XMeye" ||
    camera.cloudPlatform === "ICSee" ||
    camera.registerMode === "qr" ||
    camera.registerMode === "cloud";

  if (isXm && !camera.ipAddress && !camera.playbackUrl) {
    return "XMeye/ICSee usa Cloud P2P/DVRIP — o browser não toca esse protocolo. Informe o IP da câmera na LAN ou uma URL HLS/WebRTC do gateway (go2rtc).";
  }
  if (camera.ipAddress && !camera.playbackUrl) {
    return "IP informado. Configure ORBIT_GO2RTC_URL no Railway ou cole uma URL HLS/MJPEG em Detalhes → Stream.";
  }
  if (camera.rtspUrl && !camera.playbackUrl) {
    return "RTSP não roda no browser. Use gateway go2rtc (RTSP→HLS/WebRTC) ou cole a URL HLS gerada.";
  }
  return "Nenhuma URL de reprodução configurada para esta câmera.";
}

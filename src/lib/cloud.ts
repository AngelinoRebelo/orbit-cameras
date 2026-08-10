import type { Camera } from "./data";

export type CloudPlaybackKind = "hls" | "mjpeg" | "webrtc" | "video";

export interface CloudConnectPayload {
  serialNumber: string;
  username: string;
  password: string;
  cameraId?: string;
  channel?: number;
  platform?: Camera["cloudPlatform"];
}

export interface CloudConnectResult {
  ok: boolean;
  mode: "gateway" | "session" | "unavailable";
  online?: boolean;
  playbackUrl?: string;
  playbackKind?: CloudPlaybackKind;
  label?: string;
  message: string;
  gatewayConfigured: boolean;
}

export function isCloudCamera(camera: Camera): boolean {
  return (
    camera.protocol === "XM / ICSee" ||
    camera.protocol === "Cloud P2P" ||
    camera.registerMode === "cloud" ||
    camera.registerMode === "qr" ||
    camera.cloudPlatform === "XMeye" ||
    camera.cloudPlatform === "ICSee" ||
    camera.cloudPlatform === "XMCloud" ||
    camera.cloudPlatform === "P2P" ||
    Boolean(camera.serialNumber)
  );
}

export function cloudGatewayBase(): string {
  return (process.env.ORBIT_CLOUD_GATEWAY || "").replace(/\/$/, "");
}

export function normalizeSerial(value: string): string {
  return value.trim().replace(/\s+/g, "");
}

/** Monta patch de câmera após login VMS (serial + user + senha). */
export function cloudLoginPatch(input: {
  serialNumber: string;
  username: string;
  password: string;
  platform?: Camera["cloudPlatform"];
}): Partial<Camera> {
  const serialNumber = normalizeSerial(input.serialNumber);
  return {
    serialNumber,
    deviceLogin: input.username.trim() || "admin",
    devicePassword: input.password,
    hasDevicePassword: Boolean(input.password),
    protocol: "Cloud P2P",
    registerMode: "cloud",
    cloudPlatform: input.platform ?? "XMeye",
    streamError: undefined,
    scene: `Cloud P2P · SN ${serialNumber}`,
  };
}

function detectKind(url: string): CloudPlaybackKind {
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

export function parseGatewayPlayback(data: unknown): {
  playbackUrl: string;
  playbackKind: CloudPlaybackKind;
  label: string;
} | null {
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;
  const url =
    (typeof d.playbackUrl === "string" && d.playbackUrl) ||
    (typeof d.url === "string" && d.url) ||
    (typeof d.hls === "string" && d.hls) ||
    null;
  if (!url) return null;
  const kindRaw = typeof d.kind === "string" ? d.kind : undefined;
  const kind: CloudPlaybackKind =
    kindRaw === "hls" ||
    kindRaw === "mjpeg" ||
    kindRaw === "webrtc" ||
    kindRaw === "video"
      ? kindRaw
      : detectKind(url);
  return {
    playbackUrl: url,
    playbackKind: kind,
    label:
      (typeof d.label === "string" && d.label) ||
      `Cloud ${kind.toUpperCase()}`,
  };
}

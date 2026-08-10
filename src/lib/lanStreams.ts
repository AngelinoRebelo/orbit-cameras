import type { Camera } from "./data";

/** URLs HTTP comuns em firmwares XM / Sofia / ICSee (acesso pela LAN do browser). */
export function buildLanCandidateUrls(camera: Camera): string[] {
  const ip = camera.ipAddress?.trim();
  if (!ip) return [];

  const user = encodeURIComponent(camera.deviceLogin || "admin");
  const pass = encodeURIComponent(camera.devicePassword || "");
  const httpPort =
    camera.ipPort && ![34567, 554, 8899].includes(camera.ipPort)
      ? camera.ipPort
      : 80;
  const base = `http://${ip}:${httpPort}`;

  return [
    // Snapshot XM / Sofia
    `${base}/webcapture.jpg?command=snap&channel=1&user=${user}&password=${pass}`,
    `${base}/webcapture.jpg?command=snap&channel=0&user=${user}&password=${pass}`,
    `${base}/cgi-bin/snapshot.cgi?chn=0&u=${user}&p=${pass}`,
    `${base}/cgi-bin/snapshot.cgi?channel=0`,
    `${base}/snapshot.cgi?user=${user}&pwd=${pass}`,
    // MJPEG / multipart
    `${base}/videostream.cgi?user=${user}&pwd=${pass}&resolution=32`,
    `${base}/cgi-bin/mjpg/video.cgi?channel=0&subtype=1`,
    `${base}/video.cgi?resolution=VGA`,
    // ONVIF-ish / genericos
    `${base}/onvif/snapshot`,
    `${base}/tmpfs/auto.jpg`,
  ];
}

export function needsLanIp(camera: Camera): boolean {
  if (camera.playbackUrl) return false;
  if (camera.ipAddress?.trim()) return false;
  return (
    camera.protocol === "XM / ICSee" ||
    camera.protocol === "Cloud P2P" ||
    camera.registerMode === "qr" ||
    camera.registerMode === "cloud" ||
    camera.cloudPlatform === "XMeye" ||
    camera.cloudPlatform === "ICSee"
  );
}

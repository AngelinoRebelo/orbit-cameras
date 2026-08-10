export type CameraProtocol =
  | "ONVIF"
  | "RTSP"
  | "RTMP"
  | "WebRTC"
  | "HLS"
  | "Cloud P2P"
  | "XM / ICSee";
export type CameraStatus = "online" | "offline" | "recording" | "alert";
export type RegisterMode =
  | "cloud"
  | "ip"
  | "onvif"
  | "rtsp"
  | "qr"
  | "discover";
export type DetectionType =
  | "person"
  | "vehicle"
  | "package"
  | "pet"
  | "motion"
  | "sound";

export interface Camera {
  id: string;
  name: string;
  location: string;
  site: string;
  status: CameraStatus;
  protocol: CameraProtocol;
  brand: string;
  model: string;
  resolution: string;
  fps: number;
  codec: "H.264" | "H.265" | "AV1";
  nightVision: boolean;
  twoWayAudio: boolean;
  ptz: boolean;
  battery?: number;
  wifiRssi: number;
  storageDays: number;
  thumbnailHue: number;
  scene: string;
  lastSeen: string;
  streamLatencyMs: number;
  /** Como a câmera foi cadastrada */
  registerMode?: RegisterMode;
  /** N.º de série / Cloud ID (XMeye, ICSee, etc.) */
  serialNumber?: string;
  /** Product ID (PID) */
  pid?: string;
  /** Login do dispositivo */
  deviceLogin?: string;
  /** Senha não é persistida em claro — só flag */
  hasDevicePassword?: boolean;
  /** Versão do dispositivo / hardware */
  deviceVersion?: string;
  /** Firmware */
  softwareVersion?: string;
  /** Data publicação firmware */
  firmwarePublishedAt?: string;
  /** Fuso horário do dispositivo */
  timezone?: string;
  /** Acesso por IP local */
  ipAddress?: string;
  ipPort?: number;
  rtspUrl?: string;
  cloudPlatform?: "XMeye" | "ICSee" | "XMCloud" | "P2P" | "Outro";
}

export interface EventItem {
  id: string;
  cameraId: string;
  type: DetectionType;
  label: string;
  confidence: number;
  at: string;
  clipDurationSec: number;
}

export interface RecordingClip {
  id: string;
  cameraId: string;
  startedAt: string;
  durationSec: number;
  sizeMb: number;
  trigger: "continuous" | "motion" | "ai" | "manual";
}

export const SITES = [
  { id: "casa", name: "Casa Principal", cameras: 5 },
  { id: "escritorio", name: "Escritório", cameras: 3 },
  { id: "galpao", name: "Galpão Norte", cameras: 4 },
] as const;

export const BRAND_PRESETS = [
  { brand: "XM / XMeye / ICSee", models: ["X6E-WEQ", "X5C", "Bullet Wi‑Fi"] },
  { brand: "Reolink", models: ["Argus 4 Pro", "TrackMix WiFi", "E1 Outdoor"] },
  { brand: "TP-Link Tapo", models: ["C425", "C320WS", "C210"] },
  { brand: "Eufy", models: ["SoloCam S340", "Cam 3C", "Floodlight E340"] },
  { brand: "Google Nest", models: ["Cam (battery)", "Cam with floodlight"] },
  { brand: "Ring", models: ["Stick Up Cam Pro", "Indoor Cam"] },
  { brand: "Hikvision", models: ["DS-2CD2387", "ColorVu Wi-Fi"] },
  { brand: "Dahua", models: ["Imou Cruiser Dual", "IPC-HFW"] },
  { brand: "Uniview / UniFi", models: ["G5 Bullet", "G4 Instant"] },
  { brand: "Axis", models: ["M5075-G", "P1465-LE"] },
  { brand: "Genérica ONVIF", models: ["Profile S", "Profile T"] },
] as const;

export const REGISTER_MODES: {
  id: RegisterMode;
  label: string;
  hint: string;
}[] = [
  {
    id: "cloud",
    label: "Cloud / P2P",
    hint: "N.º de série + senha (XMeye, ICSee, XM)",
  },
  {
    id: "qr",
    label: "QR Code",
    hint: "Carregue a imagem do QR ou cole o serial",
  },
  {
    id: "discover",
    label: "Rede",
    hint: "Pesquise câmeras na LAN (ONVIF, XM, RTSP)",
  },
  {
    id: "ip",
    label: "IP / LAN",
    hint: "IP, porta, usuário e senha locais",
  },
  {
    id: "onvif",
    label: "ONVIF",
    hint: "Descoberta e Profile S/T",
  },
  {
    id: "rtsp",
    label: "RTSP",
    hint: "URL rtsp:// completa",
  },
];

export const CAMERAS: Camera[] = [
  {
    id: "cam-casa-rua",
    name: "Casa Rua",
    location: "Fachada",
    site: "casa",
    status: "recording",
    protocol: "XM / ICSee",
    brand: "XM / XMeye / ICSee",
    model: "X6E-WEQ",
    resolution: "1080p",
    fps: 15,
    codec: "H.264",
    nightVision: true,
    twoWayAudio: true,
    ptz: false,
    wifiRssi: -46,
    storageDays: 7,
    thumbnailHue: 175,
    scene: "Câmera cloud P2P — fachada da rua",
    lastSeen: new Date().toISOString(),
    streamLatencyMs: 620,
    registerMode: "cloud",
    serialNumber: "f9b1765cf546a7b15nr0",
    pid: "A90A007F3000000C",
    deviceLogin: "camara",
    hasDevicePassword: true,
    deviceVersion: "X6E-WEQ",
    softwareVersion: "V5.04.R02.000A07F3.10 010.346532.0000010",
    firmwarePublishedAt: "2025-02-28 14:18:14",
    timezone: "Oeste3.0",
    cloudPlatform: "XMeye",
  },
  {
    id: "cam-entrada",
    name: "Entrada Principal",
    location: "Portão",
    site: "casa",
    status: "recording",
    protocol: "WebRTC",
    brand: "Reolink",
    model: "Argus 4 Pro",
    resolution: "4K",
    fps: 25,
    codec: "H.265",
    nightVision: true,
    twoWayAudio: true,
    ptz: false,
    battery: 78,
    wifiRssi: -48,
    storageDays: 30,
    thumbnailHue: 165,
    scene: "Portão e calçada sob luz natural",
    lastSeen: new Date().toISOString(),
    streamLatencyMs: 280,
    registerMode: "rtsp",
    rtspUrl: "rtsp://admin:***@192.168.0.21:554/h264Preview_01_main",
    ipAddress: "192.168.0.21",
    ipPort: 554,
  },
  {
    id: "cam-sala",
    name: "Sala de Estar",
    location: "Interno",
    site: "casa",
    status: "online",
    protocol: "HLS",
    brand: "TP-Link Tapo",
    model: "C210",
    resolution: "1080p",
    fps: 30,
    codec: "H.264",
    nightVision: true,
    twoWayAudio: true,
    ptz: true,
    wifiRssi: -42,
    storageDays: 14,
    thumbnailHue: 200,
    scene: "Ambiente interno com sofá e janela",
    lastSeen: new Date().toISOString(),
    streamLatencyMs: 420,
    registerMode: "ip",
    ipAddress: "192.168.0.34",
    ipPort: 2020,
    deviceLogin: "admin",
    hasDevicePassword: true,
  },
  {
    id: "cam-quintal",
    name: "Quintal",
    location: "Fundos",
    site: "casa",
    status: "alert",
    protocol: "ONVIF",
    brand: "Eufy",
    model: "SoloCam S340",
    resolution: "3K",
    fps: 15,
    codec: "H.265",
    nightVision: true,
    twoWayAudio: true,
    ptz: true,
    battery: 54,
    wifiRssi: -61,
    storageDays: 60,
    thumbnailHue: 95,
    scene: "Jardim e muro dos fundos",
    lastSeen: new Date().toISOString(),
    streamLatencyMs: 510,
    registerMode: "onvif",
    ipAddress: "192.168.0.55",
    ipPort: 80,
  },
  {
    id: "cam-garagem",
    name: "Garagem",
    location: "Veículos",
    site: "casa",
    status: "online",
    protocol: "RTSP",
    brand: "Google Nest",
    model: "Cam with floodlight",
    resolution: "1080p",
    fps: 30,
    codec: "H.264",
    nightVision: true,
    twoWayAudio: true,
    ptz: false,
    wifiRssi: -55,
    storageDays: 14,
    thumbnailHue: 40,
    scene: "Vaga coberta e portão lateral",
    lastSeen: new Date().toISOString(),
    streamLatencyMs: 360,
    registerMode: "rtsp",
  },
  {
    id: "cam-escritorio",
    name: "Recepção",
    location: "Hall",
    site: "escritorio",
    status: "recording",
    protocol: "WebRTC",
    brand: "Axis",
    model: "M5075-G",
    resolution: "1080p",
    fps: 30,
    codec: "H.264",
    nightVision: false,
    twoWayAudio: true,
    ptz: true,
    wifiRssi: -38,
    storageDays: 90,
    thumbnailHue: 220,
    scene: "Recepção corporativa",
    lastSeen: new Date().toISOString(),
    streamLatencyMs: 190,
    registerMode: "onvif",
  },
  {
    id: "cam-estoque",
    name: "Estoque A",
    location: "Corredor 2",
    site: "escritorio",
    status: "online",
    protocol: "ONVIF",
    brand: "Hikvision",
    model: "DS-2CD2387",
    resolution: "4K",
    fps: 20,
    codec: "H.265",
    nightVision: true,
    twoWayAudio: false,
    ptz: false,
    wifiRssi: -52,
    storageDays: 45,
    thumbnailHue: 280,
    scene: "Prateleiras e iluminação LED",
    lastSeen: new Date().toISOString(),
    streamLatencyMs: 340,
    registerMode: "ip",
    ipAddress: "10.0.1.40",
    ipPort: 80,
    deviceLogin: "admin",
    hasDevicePassword: true,
  },
  {
    id: "cam-galpao-1",
    name: "Doca 01",
    location: "Carga",
    site: "galpao",
    status: "recording",
    protocol: "RTSP",
    brand: "Dahua",
    model: "Imou Cruiser Dual",
    resolution: "2K",
    fps: 25,
    codec: "H.265",
    nightVision: true,
    twoWayAudio: true,
    ptz: true,
    wifiRssi: -58,
    storageDays: 30,
    thumbnailHue: 15,
    scene: "Doca de carga e caminhões",
    lastSeen: new Date().toISOString(),
    streamLatencyMs: 450,
    registerMode: "rtsp",
  },
  {
    id: "cam-galpao-2",
    name: "Pátio Norte",
    location: "Externo",
    site: "galpao",
    status: "offline",
    protocol: "ONVIF",
    brand: "Uniview / UniFi",
    model: "G5 Bullet",
    resolution: "2K",
    fps: 30,
    codec: "H.264",
    nightVision: true,
    twoWayAudio: false,
    ptz: false,
    wifiRssi: -78,
    storageDays: 30,
    thumbnailHue: 130,
    scene: "Pátio industrial (offline)",
    lastSeen: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
    streamLatencyMs: 0,
    registerMode: "onvif",
  },
  {
    id: "cam-portao-cloud",
    name: "Portão Cloud",
    location: "Entrada lateral",
    site: "casa",
    status: "online",
    protocol: "Cloud P2P",
    brand: "XM / XMeye / ICSee",
    model: "X5C",
    resolution: "1080p",
    fps: 15,
    codec: "H.264",
    nightVision: true,
    twoWayAudio: true,
    ptz: true,
    wifiRssi: -53,
    storageDays: 7,
    thumbnailHue: 25,
    scene: "Câmera P2P via cloud ID",
    lastSeen: new Date().toISOString(),
    streamLatencyMs: 780,
    registerMode: "qr",
    serialNumber: "a1c29e84bd0012ff7kq3",
    pid: "B12C008E4100001A",
    deviceLogin: "admin",
    hasDevicePassword: true,
    deviceVersion: "X5C",
    softwareVersion: "V5.04.R02.000A07F3.10",
    firmwarePublishedAt: "2024-11-12 09:40:00",
    timezone: "Oeste3.0",
    cloudPlatform: "ICSee",
  },
];

export const EVENTS: EventItem[] = [
  {
    id: "ev-1",
    cameraId: "cam-quintal",
    type: "person",
    label: "Pessoa detectada — zona Quintal",
    confidence: 0.94,
    at: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    clipDurationSec: 18,
  },
  {
    id: "ev-2",
    cameraId: "cam-casa-rua",
    type: "person",
    label: "Movimento na fachada Casa Rua",
    confidence: 0.93,
    at: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    clipDurationSec: 22,
  },
  {
    id: "ev-3",
    cameraId: "cam-entrada",
    type: "package",
    label: "Pacote deixado na porta",
    confidence: 0.91,
    at: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    clipDurationSec: 24,
  },
  {
    id: "ev-4",
    cameraId: "cam-galpao-1",
    type: "vehicle",
    label: "Veículo na doca 01",
    confidence: 0.97,
    at: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    clipDurationSec: 42,
  },
  {
    id: "ev-5",
    cameraId: "cam-sala",
    type: "pet",
    label: "Animal de estimação em movimento",
    confidence: 0.88,
    at: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
    clipDurationSec: 12,
  },
  {
    id: "ev-6",
    cameraId: "cam-garagem",
    type: "sound",
    label: "Som alto — possível alarme",
    confidence: 0.76,
    at: new Date(Date.now() - 1000 * 60 * 80).toISOString(),
    clipDurationSec: 8,
  },
  {
    id: "ev-7",
    cameraId: "cam-estoque",
    type: "motion",
    label: "Movimento após horário comercial",
    confidence: 0.82,
    at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    clipDurationSec: 30,
  },
];

export const RECORDINGS: RecordingClip[] = [
  {
    id: "rec-1",
    cameraId: "cam-casa-rua",
    startedAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    durationSec: 720,
    sizeMb: 210,
    trigger: "continuous",
  },
  {
    id: "rec-2",
    cameraId: "cam-entrada",
    startedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    durationSec: 900,
    sizeMb: 420,
    trigger: "continuous",
  },
  {
    id: "rec-3",
    cameraId: "cam-quintal",
    startedAt: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
    durationSec: 48,
    sizeMb: 18,
    trigger: "ai",
  },
  {
    id: "rec-4",
    cameraId: "cam-galpao-1",
    startedAt: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
    durationSec: 180,
    sizeMb: 64,
    trigger: "motion",
  },
  {
    id: "rec-5",
    cameraId: "cam-escritorio",
    startedAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    durationSec: 3600,
    sizeMb: 980,
    trigger: "continuous",
  },
];

export const PROTOCOLS = [
  {
    name: "Cloud P2P / XM",
    latency: "variável",
    use: "Serial + senha (XMeye, ICSee) sem IP público",
  },
  {
    name: "WebRTC",
    latency: "<500 ms",
    use: "Live no browser, zero plugin",
  },
  {
    name: "ONVIF",
    latency: "padrão aberto",
    use: "Descoberta, PTZ e eventos multi-marca",
  },
  {
    name: "RTSP",
    latency: "1–3 s",
    use: "Ingestão nativa de câmeras IP",
  },
  {
    name: "HLS / LL-HLS",
    latency: "2–8 s",
    use: "Escala para muitos espectadores",
  },
  {
    name: "IP / LAN",
    latency: "local",
    use: "IP + porta (34567 XM, 554 RTSP, 80 HTTP)",
  },
] as const;

export function getCamera(id: string) {
  return CAMERAS.find((c) => c.id === id);
}

export function createShareCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

export function maskSecret(value: string, visible = 4) {
  if (value.length <= visible * 2) return "••••••••";
  return `${value.slice(0, visible)}${"*".repeat(4)}${value.slice(-visible)}`;
}

export function parseQrPayload(raw: string) {
  const text = raw.trim();
  // Formatos comuns: serial puro, sn=..., ou URL com id
  const snMatch = text.match(/(?:sn|serial|id)[=:]?\s*([a-z0-9]{12,24})/i);
  if (snMatch) return snMatch[1];
  const bare = text.match(/^([a-z0-9]{12,24})$/i);
  if (bare) return bare[1];
  try {
    const url = new URL(text);
    return (
      url.searchParams.get("sn") ||
      url.searchParams.get("id") ||
      url.pathname.split("/").filter(Boolean).pop() ||
      text
    );
  } catch {
    return text;
  }
}

export function deviceQrValue(camera: Camera) {
  if (camera.serialNumber) {
    return `orbit://device?sn=${camera.serialNumber}&pid=${camera.pid ?? ""}&name=${encodeURIComponent(camera.name)}`;
  }
  if (camera.ipAddress) {
    return `orbit://device?ip=${camera.ipAddress}&port=${camera.ipPort ?? 80}&name=${encodeURIComponent(camera.name)}`;
  }
  return `orbit://device?id=${camera.id}`;
}

export type DiscoveredProtocol = "XM" | "ONVIF" | "RTSP" | "HTTP";

export interface DiscoveredCamera {
  id: string;
  name: string;
  ip: string;
  port: number;
  protocol: DiscoveredProtocol;
  brand: string;
  model: string;
  mac?: string;
  serialHint?: string;
}

export interface DiscoveryProgress {
  percent: number;
  label: string;
  found: DiscoveredCamera[];
}

const DEMO_POOL: Omit<DiscoveredCamera, "id">[] = [
  {
    name: "IPC-Front",
    ip: "192.168.0.21",
    port: 34567,
    protocol: "XM",
    brand: "XM / XMeye / ICSee",
    model: "X6E-WEQ",
    mac: "A4:C1:38:9F:22:01",
    serialHint: "f9b1765cf546a7b15nr0",
  },
  {
    name: "ONVIF-Hall",
    ip: "192.168.0.34",
    port: 80,
    protocol: "ONVIF",
    brand: "Hikvision",
    model: "DS-2CD2387",
    mac: "C4:2F:90:11:AB:44",
  },
  {
    name: "Tapo-Sala",
    ip: "192.168.0.48",
    port: 554,
    protocol: "RTSP",
    brand: "TP-Link Tapo",
    model: "C210",
    mac: "60:32:B1:7C:09:88",
  },
  {
    name: "Reolink-Garagem",
    ip: "192.168.0.55",
    port: 554,
    protocol: "RTSP",
    brand: "Reolink",
    model: "E1 Outdoor",
    mac: "EC:71:DB:02:55:10",
  },
  {
    name: "Dahua-Fundos",
    ip: "192.168.0.72",
    port: 80,
    protocol: "ONVIF",
    brand: "Dahua",
    model: "IPC-HFW",
    mac: "3C:EF:8C:AA:01:2D",
  },
];

function withSubnet(ip: string, subnet: string) {
  const parts = subnet.replace(/\.$/, "").split(".");
  const base = parts.slice(0, 3).join(".");
  const last = ip.split(".").pop() ?? "1";
  return `${base}.${last}`;
}

/** Simula varredura LAN (ONVIF / XM 34567 / RTSP 554). Em produção viraria worker local. */
export async function scanLocalNetwork(
  subnet: string,
  onProgress: (p: DiscoveryProgress) => void,
  signal?: AbortSignal,
): Promise<DiscoveredCamera[]> {
  const found: DiscoveredCamera[] = [];
  const steps = [
    "Resolvendo gateway…",
    "Probe UDP ONVIF WS-Discovery…",
    "Porta 34567 (XM / ICSee)…",
    "Porta 554 (RTSP)…",
    "Porta 80/8000 (HTTP)…",
    "Identificando modelos…",
    "Finalizando…",
  ];

  const picks = DEMO_POOL.map((d, i) => ({
    ...d,
    id: `disc-${Date.now()}-${i}`,
    ip: withSubnet(d.ip, subnet || "192.168.0"),
  }));

  // Revela dispositivos em momentos diferentes da varredura
  const revealAt = [18, 38, 55, 72, 88];

  for (let i = 0; i <= 100; i += 2) {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    const stepIdx = Math.min(
      steps.length - 1,
      Math.floor((i / 100) * steps.length),
    );
    revealAt.forEach((at, idx) => {
      if (i >= at && !found.some((f) => f.id === picks[idx]?.id) && picks[idx]) {
        found.push(picks[idx]);
      }
    });
    onProgress({
      percent: i,
      label: steps[stepIdx],
      found: [...found],
    });
    await new Promise((r) => setTimeout(r, 55));
  }

  onProgress({ percent: 100, label: "Varredura concluída", found: [...found] });
  return found;
}

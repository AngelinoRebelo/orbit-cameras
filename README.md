# ORBIT

Plataforma profissional de **acesso e gerenciamento de câmeras Wi‑Fi**.

Live WebRTC-style, inventário multi-marca (ONVIF / RTSP / HLS / RTMP), grade 1–16, PTZ, eventos de IA, gravações, modos Casa/Ausente e **compartilhamento por link + QR code**.

## Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS 4
- Framer Motion + Lucide
- Zustand (estado do painel)
- QR Code (`qrcode.react`)

## Desenvolvimento

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Deploy no Railway

1. Crie um projeto no [Railway](https://railway.app) e conecte este repositório.
2. Railway detecta Node; build: `npm run build`, start: `npm run start`.
3. A porta usa a variável `PORT` automaticamente.
4. (Opcional) Use o `Dockerfile` incluso para build standalone.

Variáveis futuras para gateway real:

```
ORBIT_GO2RTC_URL=https://seu-go2rtc
ORBIT_CLOUD_GATEWAY=https://seu-bridge-netsdk
ORBIT_WEBRTC_GATEWAY=
ORBIT_ONVIF_DISCOVERY=true
ORBIT_STORAGE_BUCKET=
```

### Vídeo ao vivo (XMeye / ICSee / RTSP)

O browser **não** reproduz Cloud P2P nem RTSP direto. Fluxo suportado:

1. Informe o **IP LAN** + senha do dispositivo em **Detalhes → Stream**
2. Rode [go2rtc](https://github.com/AlexxIT/go2rtc) na rede das câmeras com fonte `dvrip://user:pass@IP:34567`
3. Defina `ORBIT_GO2RTC_URL` no Railway **ou** cole a URL HLS (`…/api/stream.m3u8?src=…`) no dispositivo

## Bridge NetSDK (cloud por Serial — igual VMS)

Para ver XMeye/ICSee **fora da LAN** no browser:

1. Em `bridge/`: copie `NetSdk.dll` + `StreamReader.dll` para `vendor/`
2. Rode `bridge/run.bat` (Windows) com ffmpeg no PATH
3. Publique o bridge (Tailscale/ngrok) e defina no Railway `ORBIT_CLOUD_GATEWAY`
4. Detalhes: [bridge/README.md](bridge/README.md)

O player Orbit toca **HLS**, **MJPEG** e **WebRTC/WHEP**.

## Rotas

| Rota | Descrição |
|------|-----------|
| `/` | Landing |
| `/app` | Visão geral |
| `/app/live` | Mosaic ao vivo + PTZ |
| `/app/cameras` | Inventário e add ONVIF/RTSP |
| `/app/events` | Eventos de IA |
| `/app/recordings` | Timeline / clipes |
| `/app/share` | Sessão + QR |
| `/join/[code]` | Entrada de convidado |

## Nota

A UI é uma demo rica e operacionalmente realista. Streams reais exigem um gateway RTSP→WebRTC no backend (ex.: MediaMTX, Ant Media, ou worker próprio).

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
ORBIT_WEBRTC_GATEWAY=
ORBIT_ONVIF_DISCOVERY=true
ORBIT_STORAGE_BUCKET=
```

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

# Orbit NetSDK Cloud Bridge (padrão VMS)

Converte **Serial NO + usuário + senha** (Cloud P2P XMeye/ICSee) em **HLS** para o Orbit no browser — o mesmo papel do NetSDK no VMS Windows.

```
Orbit (Railway)  --POST /connect-->  Bridge (seu PC)  --Login_Cloud-->  câmera
                 <-- playbackUrl HLS --                 <-- RealPlay --
```

## 1. Libs NetSDK

Copie para `bridge/vendor/`:

| SO | Arquivos |
|----|----------|
| Windows | `NetSdk.dll`, `StreamReader.dll` |
| Linux | `libxmnetsdk.so` |

Fonte: kit NetSDK Xiongmai (`download.xm030.cn`) ou pasta `netsdk` de projetos de exemplo. **Não versionamos as DLLs** (proprietárias).

## 2. Rodar o bridge (Windows — recomendado)

1. Instale [ffmpeg](https://ffmpeg.org/) e adicione ao PATH.
2. Duplo clique / terminal:

```bat
run.bat
```

3. Publique a porta (Tailscale Serve, ngrok, Cloudflare Tunnel…):

```bat
set ORBIT_BRIDGE_PUBLIC_URL=https://seu-tunel.exemplo
run.bat
```

Teste: `http://127.0.0.1:8787/health`

## 3. Railway (Orbit)

Variável de ambiente:

```
ORBIT_CLOUD_GATEWAY=https://seu-tunel.exemplo
```

(sem barra no final). O Live → **Conectar na nuvem** passa a receber `playbackUrl` HLS.

## 4. API

`POST /connect`

```json
{
  "serialNumber": "f9b1765cf546a7b15nr0",
  "username": "casa_rua",
  "password": "***",
  "channel": 0,
  "stream": 1
}
```

Resposta:

```json
{
  "ok": true,
  "playbackUrl": "https://seu-tunel.exemplo/hls/.../index.m3u8",
  "kind": "hls",
  "label": "Cloud NetSDK HLS"
}
```

`stream`: `0` = main, `1` = sub (mais leve; padrão).

Se o vídeo não abrir, tente `ORBIT_BRIDGE_REENCODE=1` (reencode H.264).

## 5. Docker (Linux + .so)

```bash
export ORBIT_BRIDGE_PUBLIC_URL=https://seu-tunel.exemplo
docker compose up --build
```

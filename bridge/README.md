# Orbit NetSDK Cloud Bridge (padrão VMS)

Converte **Serial NO + usuário + senha** (Cloud P2P XMeye/ICSee) em **HLS** para o Orbit.

```
Orbit (Railway)  --POST /connect-->  Bridge (Ubuntu)  --Login_Cloud-->  câmera
                 <-- playbackUrl HLS --                  <-- RealPlay --
```

## Ubuntu (recomendado neste projeto)

O NetSDK oficial de cloud é DLL Windows. No Ubuntu usamos **Wine** + `NetSdk.dll` + ffmpeg.

### 1. Libs

Copie para `bridge/vendor/`:

- `NetSdk.dll`
- `StreamReader.dll`

### 2. Bootstrap (uma vez)

```bash
# se ainda não tiver wine:
sudo apt install wine wine64

cd bridge
./scripts/bootstrap-ubuntu.sh   # baixa Python embed + ffmpeg estático
```

### 3. Rodar

```bash
./run-ubuntu.sh
# ou com túnel público para o Railway:
ORBIT_BRIDGE_PUBLIC_URL=https://seu-tunel.exemplo ./run-ubuntu.sh
```

Teste: http://127.0.0.1:8787/health

### 4. Railway

```
ORBIT_CLOUD_GATEWAY=https://seu-tunel.exemplo
```

No Orbit: **Ao vivo → Conectar na nuvem**.

## API

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

`stream`: `0` = main, `1` = sub (padrão).

Se o HLS falhar: `ORBIT_BRIDGE_REENCODE=1 ./run-ubuntu.sh`

## Windows nativo (opcional)

`run.bat` + ffmpeg no PATH (sem Wine).

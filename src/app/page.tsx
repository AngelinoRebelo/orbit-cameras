"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Brain,
  Radio,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Wifi,
} from "lucide-react";
import { PROTOCOLS } from "@/lib/data";

const FEATURES = [
  {
    icon: Radio,
    title: "Live WebRTC",
    text: "Visualização no browser com latência sub-segundo, sem plugins.",
  },
  {
    icon: ScanLine,
    title: "ONVIF + RTSP",
    text: "Descubra e integre Reolink, Tapo, Eufy, Hikvision, Axis e mais.",
  },
  {
    icon: Brain,
    title: "IA embutida",
    text: "Pessoa, veículo, pacote, pet e áudio — com confiança e clipes.",
  },
  {
    icon: ShieldCheck,
    title: "Acesso seguro",
    text: "Modos Casa/Ausente, RBAC e sessões convidadas com QR.",
  },
];

export default function LandingPage() {
  return (
    <div className="atmosphere noise min-h-screen overflow-x-hidden">
      <div className="relative z-10">
        <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6 md:px-8">
          <div className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-full border border-signal/40 bg-signal/10">
              <span className="size-3 rounded-full bg-signal shadow-[0_0_16px_var(--glow)]" />
            </span>
            <span className="font-display text-xl font-bold tracking-tight">
              ORBIT
            </span>
          </div>
          <nav className="hidden items-center gap-8 text-sm text-mist-dim md:flex">
            <a href="#protocolos" className="hover:text-mist">
              Protocolos
            </a>
            <a href="#recursos" className="hover:text-mist">
              Recursos
            </a>
            <Link href="/app" className="hover:text-mist">
              Painel
            </Link>
          </nav>
          <Link
            href="/app"
            className="rounded-full bg-mist px-4 py-2 text-sm font-semibold text-ink transition hover:bg-white"
          >
            Entrar
          </Link>
        </header>

        <section className="relative mx-auto grid min-h-[calc(100vh-88px)] max-w-6xl items-center gap-10 px-5 pb-16 pt-6 md:grid-cols-[1.05fr_0.95fr] md:px-8 md:pb-24">
          <div className="absolute inset-0 -z-10 lens-grid opacity-60" />

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="mb-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-signal">
              <Wifi className="size-3.5" />
              Wi‑Fi Camera OS
            </p>
            <h1 className="font-display text-5xl font-extrabold leading-[0.95] tracking-tight text-mist md:text-7xl">
              ORBIT
            </h1>
            <p className="mt-5 max-w-md text-lg text-mist-dim md:text-xl">
              Acesso e gerenciamento de câmeras Wi‑Fi com a stack atual:
              WebRTC, ONVIF, RTSP, IA e compartilhamento por QR.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/app"
                className="inline-flex items-center gap-2 rounded-full bg-signal px-6 py-3 text-sm font-semibold text-ink transition hover:bg-signal/90"
              >
                Abrir central
                <ArrowRight className="size-4" />
              </Link>
              <a
                href="#recursos"
                className="inline-flex items-center gap-2 rounded-full border border-line px-6 py-3 text-sm font-medium text-mist transition hover:border-mist/30"
              >
                Ver recursos
              </a>
            </div>
          </motion.div>

          <motion.div
            className="relative float-y"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="iris-in relative aspect-[4/5] overflow-hidden rounded-[2rem] border border-line bg-ink-2 shadow-[0_40px_120px_rgba(0,0,0,0.45)] md:aspect-[5/6]">
              <div className="absolute inset-0 feed-texture" />
              <div className="absolute inset-0 scanline" />
              <div className="absolute inset-6 rounded-[1.4rem] border border-white/10" />
              <div className="absolute left-8 top-8 flex items-center gap-2">
                <span className="live-dot size-2 rounded-full bg-danger" />
                <span className="text-xs font-semibold uppercase tracking-[0.18em]">
                  Live mosaic
                </span>
              </div>
              <div className="absolute inset-x-8 bottom-8 grid grid-cols-2 gap-3">
                {["Entrada", "Sala", "Quintal", "Doca"].map((label, i) => (
                  <div
                    key={label}
                    className="aspect-video overflow-hidden rounded-xl border border-white/10"
                    style={{
                      background: `linear-gradient(135deg, hsl(${160 + i * 35}, 28%, ${18 + i * 3}%), #0b151c)`,
                    }}
                  >
                    <div className="flex h-full items-end p-2 text-[10px] uppercase tracking-wider text-mist/80">
                      {label}
                    </div>
                  </div>
                ))}
              </div>
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_35%,rgba(7,16,22,0.55)_100%)]" />
            </div>
            <div className="absolute -bottom-4 -left-2 rounded-2xl border border-line bg-ink-3/90 px-4 py-3 backdrop-blur-md md:-left-6">
              <p className="text-[10px] uppercase tracking-[0.16em] text-mist-dim">
                Latência média
              </p>
              <p className="font-display text-2xl font-bold text-signal">
                280 ms
              </p>
            </div>
          </motion.div>
        </section>

        <section
          id="recursos"
          className="mx-auto max-w-6xl px-5 py-20 md:px-8"
        >
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.55 }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber">
              Uma missão por seção
            </p>
            <h2 className="mt-3 max-w-xl font-display text-3xl font-bold md:text-4xl">
              Tudo que uma operação de câmeras Wi‑Fi precisa hoje
            </h2>
            <p className="mt-3 max-w-2xl text-mist-dim">
              Do ingest RTSP/ONVIF à entrega WebRTC, com grade ao vivo, eventos
              de IA, gravação e convidados via QR — pronto para Railway.
            </p>
          </motion.div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06, duration: 0.45 }}
                  className="border-b border-line pb-6"
                >
                  <Icon className="size-5 text-signal" />
                  <h3 className="mt-4 font-display text-xl font-semibold">
                    {f.title}
                  </h3>
                  <p className="mt-2 text-sm text-mist-dim">{f.text}</p>
                </motion.div>
              );
            })}
          </div>
        </section>

        <section
          id="protocolos"
          className="border-y border-line bg-ink-2/40 py-20"
        >
          <div className="mx-auto max-w-6xl px-5 md:px-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-signal">
                  <Sparkles className="size-3.5" />
                  Stack 2026
                </p>
                <h2 className="mt-3 font-display text-3xl font-bold md:text-4xl">
                  Protocolos que importam
                </h2>
              </div>
              <p className="max-w-sm text-sm text-mist-dim">
                Ingestão multi-protocolo e entrega adaptativa conforme a rede
                do espectador.
              </p>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {PROTOCOLS.map((p) => (
                <div
                  key={p.name}
                  className="rounded-2xl border border-line bg-ink/50 p-5"
                >
                  <p className="font-display text-lg font-semibold">{p.name}</p>
                  <p className="mt-1 text-xs uppercase tracking-wider text-signal">
                    {p.latency}
                  </p>
                  <p className="mt-3 text-sm text-mist-dim">{p.use}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-20 md:px-8">
          <div className="relative overflow-hidden rounded-[2rem] border border-line bg-gradient-to-br from-ink-3 via-ink-2 to-ink px-8 py-12 md:px-12">
            <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-signal/15 blur-3xl" />
            <h2 className="relative font-display text-3xl font-bold md:text-4xl">
              Sua central de vigilância, no ar em minutos
            </h2>
            <p className="relative mt-3 max-w-lg text-mist-dim">
              Deploy no Railway com Next.js. Demo rica pronta — arquitetura
              preparada para gateway RTSP→WebRTC real.
            </p>
            <Link
              href="/app"
              className="relative mt-8 inline-flex items-center gap-2 rounded-full bg-mist px-6 py-3 text-sm font-semibold text-ink"
            >
              Ir para o painel
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>

        <footer className="border-t border-line px-5 py-8 text-center text-xs text-mist-dim md:px-8">
          ORBIT · plataforma de câmeras Wi‑Fi · {new Date().getFullYear()}
        </footer>
      </div>
    </div>
  );
}

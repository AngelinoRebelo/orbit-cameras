"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Camera,
  Clapperboard,
  LayoutDashboard,
  QrCode,
  Radio,
  Settings,
  Shield,
} from "lucide-react";
import { cn, statusLabel } from "@/lib/utils";
import { useOrbitStore } from "@/lib/store";

const NAV = [
  { href: "/app", label: "Visão geral", icon: LayoutDashboard },
  { href: "/app/live", label: "Ao vivo", icon: Radio },
  { href: "/app/cameras", label: "Câmeras", icon: Camera },
  { href: "/app/events", label: "Eventos", icon: Bell },
  { href: "/app/recordings", label: "Gravações", icon: Clapperboard },
  { href: "/app/share", label: "Compartilhar", icon: QrCode },
  { href: "/app/settings", label: "Ajustes", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const armed = useOrbitStore((s) => s.armed);
  const setArmed = useOrbitStore((s) => s.setArmed);
  const cameras = useOrbitStore((s) => s.cameras);
  const online = cameras.filter((c) => c.status !== "offline").length;
  const alerts = cameras.filter((c) => c.status === "alert").length;

  return (
    <div className="atmosphere noise min-h-screen">
      <div className="relative z-10 mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-line bg-ink/50 px-4 py-6 backdrop-blur-xl md:flex">
          <Link href="/" className="mb-8 flex items-center gap-2.5 px-2">
            <span className="grid size-9 place-items-center rounded-full border border-signal/40 bg-signal/10">
              <span className="size-3 rounded-full bg-signal shadow-[0_0_16px_var(--glow)]" />
            </span>
            <div>
              <span className="block font-display text-xl font-bold tracking-tight leading-none">
                ORBIT
              </span>
              <span className="text-[10px] uppercase tracking-[0.16em] text-mist-dim">
                Camera OS
              </span>
            </div>
          </Link>

          <nav className="flex flex-1 flex-col gap-0.5">
            {NAV.map((item) => {
              const Icon = item.icon;
              const active =
                pathname === item.href ||
                (item.href !== "/app" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
                    active
                      ? "bg-signal/15 text-signal shadow-[inset_0_0_0_1px_rgba(30,200,165,0.18)]"
                      : "text-mist-dim hover:bg-white/5 hover:text-mist",
                  )}
                >
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mb-3 rounded-xl border border-line bg-ink-2/70 p-3">
            <p className="text-[10px] uppercase tracking-[0.14em] text-mist-dim">
              Frota
            </p>
            <p className="mt-1 font-display text-lg font-semibold">
              {online}
              <span className="text-mist-dim">/{cameras.length}</span>
              <span className="ml-2 text-xs font-sans font-normal text-mist-dim">
                online
              </span>
            </p>
            {alerts > 0 && (
              <p className="mt-1 text-xs text-danger">
                {alerts} alerta{alerts > 1 ? "s" : ""} ativo
                {alerts > 1 ? "s" : ""}
              </p>
            )}
          </div>

          <div className="rounded-xl border border-line bg-ink-2/70 p-3">
            <div className="mb-2 flex items-center gap-2 text-xs text-mist-dim">
              <Shield className="size-3.5" />
              Modo do sistema
            </div>
            <div className="grid grid-cols-3 gap-1">
              {(
                [
                  ["home", "Casa"],
                  ["away", "Ausente"],
                  ["disarmed", "Off"],
                ] as const
              ).map(([mode, label]) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setArmed(mode)}
                  className={cn(
                    "rounded-lg px-1 py-1.5 text-[11px] font-medium transition",
                    armed === mode
                      ? mode === "away"
                        ? "bg-amber/20 text-amber"
                        : mode === "disarmed"
                          ? "bg-white/10 text-mist"
                          : "bg-signal/20 text-signal"
                      : "text-mist-dim hover:bg-white/5",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-line bg-ink/60 px-4 py-3 backdrop-blur-xl md:px-6">
            <div className="md:hidden">
              <Link href="/app" className="font-display text-lg font-bold">
                ORBIT
              </Link>
            </div>
            <div className="hidden md:block">
              <p className="text-sm text-mist">Operações de vigilância</p>
              <p className="text-xs text-mist-dim">
                WebRTC · ONVIF · Cloud P2P · XM/ICSee
              </p>
            </div>
            <div className="flex items-center gap-2">
              {alerts > 0 && (
                <Link
                  href="/app/events"
                  className="hidden rounded-full border border-danger/30 bg-danger/10 px-3 py-1 text-xs font-medium text-danger sm:inline"
                >
                  {alerts} alerta{alerts > 1 ? "s" : ""}
                </Link>
              )}
              <span className="inline-flex items-center gap-1.5 rounded-full bg-signal/15 px-3 py-1 text-xs font-medium text-signal">
                <span className="live-dot size-1.5 rounded-full bg-signal" />
                Sistema {statusLabel("online").toLowerCase()}
              </span>
            </div>
          </header>

          <main className="flex-1 px-4 py-5 md:px-6 md:py-7">{children}</main>

          <nav className="sticky bottom-0 z-20 flex border-t border-line bg-ink/85 px-1 py-2 backdrop-blur-xl md:hidden">
            {NAV.slice(0, 5).map((item) => {
              const Icon = item.icon;
              const active =
                pathname === item.href ||
                (item.href !== "/app" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex flex-1 flex-col items-center gap-1 py-1 text-[10px]",
                    active ? "text-signal" : "text-mist-dim",
                  )}
                >
                  <Icon className="size-4" />
                  {item.label.split(" ")[0]}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}

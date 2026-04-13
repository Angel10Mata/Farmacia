"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import AnimatedIcon from "@/components/ui/AnimatedIcon";

const adminOptions = [
  {
    id: "dispositivos",
    href: "/cermadsa/admin/dispositivos",
    title: "Dispositivos",
    desc: "Autorizar o rechazar solicitudes de acceso por dispositivo.",
    iconKey: "gzqipvbr",
    color: "border-amber-500/20 bg-amber-500/5 dark:border-amber-500/40",
  },
  {
    id: "usuarios",
    href: "/cermadsa/admin/usuarios",
    title: "Usuarios",
    desc: "Gestionar cuentas de usuario, roles y permisos.",
    iconKey: "btgcyfug",
    color: "border-purple-500/20 bg-purple-500/5 dark:border-purple-500/40",
  },
  {
    id: "configuraciones",
    href: "/cermadsa/admin/settings",
    title: "Configuraciones",
    desc: "Ajustes generales del sistema y seguridad.",
    iconKey: "plusmrxr",
    color: "border-blue-500/20 bg-blue-500/5 dark:border-blue-500/40",
  },
];

export function AdminCards({ pendingDevices }: { pendingDevices: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {adminOptions.map((opt) => (
        <div
          key={opt.href}
          id={`card-${opt.id}`}
          className={cn(
            "group relative overflow-hidden rounded-4xl md:rounded-[2.5rem] border flex shadow-sm cursor-pointer",
            opt.color,
          )}
        >
          <Link
            href={opt.href}
            className="w-full h-full flex flex-row items-center justify-start gap-4 md:gap-6 p-4 md:p-6 outline-none relative z-10"
          >
            <div className="relative z-10 shrink-0">
              <div className="p-2 md:p-3 bg-gray-50 rounded-xl md:rounded-2xl border border-border/50 shadow-sm group-hover:scale-105 transition-transform">
                <AnimatedIcon
                  iconKey={opt.iconKey}
                  target={`#card-${opt.id}`}
                  className="w-8 h-8 md:w-12 md:h-12"
                />
              </div>
            </div>

            <div className="flex flex-col space-y-0 md:space-y-1 relative z-10 flex-1">
              <h3 className="text-base md:text-xl font-bold tracking-tight text-foreground">
                {opt.title}
              </h3>
              <p className="text-[10px] md:text-xs text-muted-foreground line-clamp-1 font-medium italic">
                {opt.desc}
              </p>
            </div>

            {opt.id === "dispositivos" && pendingDevices > 0 && (
              <span className="shrink-0 flex items-center justify-center min-w-[26px] h-[26px] px-1.5 rounded-full bg-amber-500 text-xs font-bold text-white animate-pulse z-10">
                {pendingDevices}
              </span>
            )}
          </Link>
          <div className="absolute inset-0 bg-linear-to-br from-transparent via-transparent to-current opacity-[0.03] dark:opacity-[0.05] pointer-events-none" />
        </div>
      ))}
    </div>
  );
}

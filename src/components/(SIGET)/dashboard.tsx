"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import AnimatedIcon from "@/components/ui/AnimatedIcon";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/components/(base)/providers/UserProvider";

export default function Dashboard() {
  const router = useRouter();
  const user = useUser();
  const metadata = user?.user_metadata || {};
  const realRole = metadata.rol || user?.role || "user";
  const [effectiveRole, setEffectiveRole] = useState(realRole);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (realRole) setEffectiveRole(realRole);
    setLoading(false);
  }, [realRole]);

  const menuItems: any[] = [];

  const visibleMenuItems = menuItems.filter((item) =>
    item.allowedRoles.includes(effectiveRole),
  );

  const handleNavigation = (id: string) => {
    if (activeId) return;
    setActiveId(id);
  };

  if (loading) {
    return (
      <div className="flex-1 w-full px-6 lg:px-12 space-y-10 max-w-550 mx-auto pb-10">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
          <header className="flex items-center gap-4 md:gap-6 group">
            <Skeleton className="size-12 md:size-16 rounded-2xl" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-8 md:h-12 w-48 md:w-64" />
              <Skeleton className="h-4 md:h-6 w-32 md:w-48" />
            </div>
          </header>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 auto-rows-[120px] md:auto-rows-[200px]">
          <Skeleton className="rounded-4xl md:rounded-[2.5rem] md:col-span-4" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 w-full px-6 lg:px-12 space-y-10 max-w-550 mx-auto pb-10 pt-20">
        <div className="relative w-full flex flex-row items-center justify-between gap-8 overflow-hidden">
          <div className="flex flex-col gap-2 relative z-10">
            <h2 className="text-2xl md:text-4xl font-black tracking-tighter text-foreground leading-tight">
              ¡Bienvenido,{" "}
              <span style={{ background: "linear-gradient(to right, #38bdf8, #3b82f6, #6366f1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                {metadata.nombre?.split(' ')[0] || 'Usuario'}
              </span>
              !
            </h2>
            <p className="text-sm md:text-base text-muted-foreground font-medium max-w-lg leading-tight">
              Es un gusto verte hoy. Pronto estarán aquí tus herramientas.
            </p>
          </div>

          <div className="shrink-0 hidden md:flex items-center justify-center w-48 h-32 relative">
            <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" className="w-36 h-36">
              {[0, 1, 2, 3].map((i) => (
                <motion.circle
                  key={i}
                  cx="80"
                  cy="80"
                  r="10"
                  fill="none"
                  stroke="#4997d0"
                  strokeWidth="1.5"
                  initial={{ r: 10, opacity: 0.8 }}
                  animate={{ r: 70, opacity: 0 }}
                  transition={{
                    repeat: Infinity,
                    duration: 3.5,
                    delay: i * 0.85,
                    ease: "easeOut",
                  }}
                />
              ))}
              <motion.circle
                cx="80"
                cy="80"
                r="8"
                fill="#4997d0"
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              />
              <motion.circle
                cx="80"
                cy="80"
                r="4"
                fill="#ffffff"
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              />
            </svg>
          </div>
        </div>


        {visibleMenuItems.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-4 auto-rows-[120px] md:auto-rows-[200px]"
          >
            {visibleMenuItems.map((item) => (
              <motion.div
                key={item.id}
                id={`card-${item.id}`}
                layoutId={item.id}
                onClick={() => handleNavigation(item.id)}
                whileHover={{ scale: 1.02, y: -5 }}
                animate={
                  activeId === item.id
                    ? {
                        scale: [1, 1.05, 1],
                        transition: { duration: 1.5, ease: "easeInOut" },
                      }
                    : { scale: 1, y: 0 }
                }
                className={cn(
                  "group relative overflow-hidden rounded-4xl md:rounded-[2.5rem] border flex shadow-sm cursor-pointer",
                  item.color,
                  item.className,
                )}
              >
                <Link href={item.href} className="w-full h-full flex flex-row items-center justify-start gap-4 md:gap-6 p-4 md:p-6 outline-none relative z-10">
                  <div className="relative z-10 shrink-0">
                    <div className="p-2 md:p-3 bg-gray-50 rounded-xl md:rounded-2xl border border-border/50 shadow-sm">
                      <AnimatedIcon
                        iconKey={item.iconKey}
                        target={`#card-${item.id}`}
                        className="w-8 h-8 md:w-20 md:h-20"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col space-y-0 md:space-y-1 relative z-10">
                    <h3 className="text-base md:text-xl font-bold tracking-tight text-foreground transition-colors">
                      {item.label}
                    </h3>
                    <p className="text-[10px] md:text-xs text-muted-foreground line-clamp-1 font-medium italic">
                      {item.desc}
                    </p>
                  </div>
                </Link>
                <div className="absolute inset-0 bg-linear-to-br from-transparent via-transparent to-current opacity-[0.03] dark:opacity-[0.05] pointer-events-none" />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             className="flex items-center justify-center h-64 border border-dashed border-border/60 rounded-3xl bg-muted/5 w-full"
          >
            <p className="text-muted-foreground text-sm font-medium">Dashboard preparado. Próximamente encontrará aquí sus módulos.</p>
          </motion.div>
        )}

        {realRole === "super" && (
          <div className="mt-12 flex items-center justify-center gap-2 bg-yellow-500/10 border border-yellow-500/50 backdrop-blur-md px-6 py-3 rounded-full shadow-sm w-fit mx-auto relative z-20">
            <ShieldAlert className="size-4 text-yellow-600 shrink-0" />
            <span className="text-[10px] font-bold text-yellow-600 uppercase">
              Modo Super:
            </span>
            <select
              value={effectiveRole}
              onChange={(e) => setEffectiveRole(e.target.value)}
              className="bg-transparent text-xs font-bold text-yellow-700 outline-none cursor-pointer"
            >
              <option value="super">SUPER (Real)</option>
              <option value="admin">Simular Admin</option>
              <option value="user">Simular User</option>
            </select>
          </div>
        )}
      </div>
    </>
  );
}

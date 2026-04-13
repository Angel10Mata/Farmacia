"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";
import AnimatedIcon from "@/components/ui/AnimatedIcon";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ChevronRight, ShieldAlert } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { getStockStats } from "./productos/lib/actions";
import { getPendingOrdersCount, getVentas } from "./ventas/lib/actions";
import { useUser } from "@/components/(base)/providers/UserProvider";

export default function DashboardLaArada() {
  const router = useRouter();
  const user = useUser();
  const metadata = user?.user_metadata || {};
  const realRole = metadata.rol || user?.role || "user";
  const [effectiveRole, setEffectiveRole] = useState(realRole);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [ventas, setVentas] = useState<any[]>([]);
  const [stats, setStats] = useState({
    pendientes: 0,
    sinStock: 0,
    stockBajo: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (realRole) setEffectiveRole(realRole);
  }, [realRole]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [pendientes, stock, ordersData] = await Promise.all([
          getPendingOrdersCount(),
          getStockStats(),
          getVentas().catch(() => []),
        ]);
        setStats({
          pendientes: pendientes || 0,
          sinStock: stock?.sinStock || 0,
          stockBajo: stock?.stockBajo || 0,
        });
        setVentas(ordersData || []);
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const currentMonthData = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    const validOrders = ventas.filter(
      (o: any) => String(o.estado).toLowerCase().trim() !== "anulado",
    );

    const dayMap: Record<number, number> = {};
    for (let i = 1; i <= daysInMonth; i++) dayMap[i] = 0;

    let totalMes = 0;
    let totalOrders = 0;

    validOrders.forEach((item: any) => {
      let dateString = item.fecha_entrega || item.created_at;
      if (dateString) {
        if (typeof dateString === "string" && dateString.length === 10) {
          dateString = `${dateString}T12:00:00`;
        }
        const date = new Date(dateString);
        if (
          date.getMonth() === currentMonth &&
          date.getFullYear() === currentYear
        ) {
          const day = date.getDate();
          const total = Number(item.total || 0);
          dayMap[day] += total;
          totalMes += total;
          totalOrders++;
        }
      }
    });

    const chartData = Object.entries(dayMap).map(([day, total]) => ({
      name: day,
      total: total,
    }));

    const activeDays = chartData.filter((d) => d.total > 0);
    const avgDaily = activeDays.length > 0 ? totalMes / activeDays.length : 0;
    const bestDayTotal = chartData.reduce(
      (max, current) => (current.total > max ? current.total : max),
      0,
    );

    return { totalMes, totalOrders, avgDaily, bestDayTotal, chartData };
  }, [ventas]);

  const canViewContabilidad = ["super", "admin", "contabilidad"].includes(
    effectiveRole,
  );

  const menuItems = [
    {
      id: "ventas",
      href: "/cermadsa/laarada/ventas",
      label: "Ventas y Despachos",
      iconKey: "kphyjsqb",
      desc: "Gestión de Ventas y despachos.",
      color: "border-orange-500/20 bg-orange-500/5 dark:border-orange-500/40",
      className: canViewContabilidad
        ? "md:col-span-2 md:row-span-1"
        : "md:col-span-2 md:row-span-2",
      allowedRoles: ["super", "admin", "contabilidad", "ventas", "user"],
    },
    {
      id: "clientes",
      href: "/cermadsa/laarada/clientes",
      label: "Clientes",
      iconKey: "xkrgmuxd",
      desc: "Cartera de clientes.",
      color: "border-blue-500/20 bg-blue-500/5 dark:border-blue-500/40",
      className: "md:col-span-1 md:row-span-1",
      allowedRoles: ["super", "admin", "contabilidad", "ventas"],
    },
    {
      id: "creditos",
      href: "/cermadsa/laarada/creditos",
      label: "Créditos",
      iconKey: "qrhmobcu",
      desc: "Gestión de cobros.",
      color: "border-red-500/20 bg-red-500/5 dark:border-red-500/40",
      className: "md:col-span-1 md:row-span-1",
      allowedRoles: ["super", "admin", "contabilidad", "ventas"],
    },
    {
      id: "contabilidad",
      href: "/cermadsa/laarada/contabilidad",
      label: "Contabilidad",
      iconKey: "hrxrggwa",
      desc: "Gestión financiera y reportes.",
      color: "border-indigo-500/20 bg-indigo-500/5 dark:border-indigo-500/40",
      className: "md:col-span-2 md:row-span-1",
      allowedRoles: ["super", "admin", "contabilidad"],
    },
    {
      id: "productos",
      href: "/cermadsa/laarada/productos",
      label: "Productos",
      iconKey: "gbzbfgyf",
      desc: "Inventario.",
      color: "border-amber-500/20 bg-amber-500/5 dark:border-amber-500/40",
      className: "md:col-span-2 md:row-span-1",
      allowedRoles: ["super", "admin", "contabilidad", "ventas"],
    },
    /* {
      id: "proveedores",
      href: "/cermadsa/laarada/proveedores",
      label: "Proveedores",
      iconKey: "zdwrqfmb",
      desc: "Abastecimiento.",
      color:
        "border-emerald-500/20 bg-emerald-500/5 dark:border-emerald-500/40",
      className: "md:col-span-1 md:row-span-1",
      allowedRoles: ["super", "admin", "contabilidad"],
    }, */
  ];

  const visibleMenuItems = menuItems.filter((item) =>
    item.allowedRoles.includes(effectiveRole),
  );

  const canViewStats = ["super", "admin", "contabilidad"].includes(
    effectiveRole,
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
          {menuItems.filter(item => item.allowedRoles.includes(effectiveRole)).map((item, idx) => (
            <Skeleton
              key={idx}
              className={cn(
                "rounded-4xl md:rounded-[2.5rem]",
                item.className
              )}
            />
          ))}
          {canViewStats && (
            <Skeleton className="rounded-4xl md:rounded-[2.5rem] md:col-span-2" />
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 w-full px-6 lg:px-12 space-y-10 max-w-550 mx-auto pb-10">
        {/* HERO SECTION UNIFICADA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative w-full rounded-3xl border border-orange-500/20 bg-card p-6 md:p-8 shadow-sm overflow-hidden flex flex-col xl:flex-row items-start xl:items-center justify-between gap-8"
        >
          {/* LADO IZQUIERDO: LOGO Y TÍTULO */}
          <div className="flex flex-col gap-4 shrink-0 relative z-10 w-full xl:w-auto">
            <header className="flex items-center gap-4 md:gap-6 group">
              <div className="relative size-12 md:size-16 shrink-0 transition-transform duration-300 group-hover:-translate-y-2">
                <Image
                  src="/logos/LaArada.png"
                  alt="Logo La Arada"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <div className="flex flex-col gap-1">
                <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-orange-600 dark:text-orange-500">
                  La Arada
                </h1>
                <p className="text-orange-600 dark:text-orange-500 text-sm md:text-lg font-medium italic leading-none">
                  Construyendo Junto a ti el Futuro
                </p>
              </div>
            </header>

            {realRole === "super" && (
              <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/50 backdrop-blur-md px-4 py-2 rounded-xl shadow-sm w-fit">
                <ShieldAlert className="size-4 text-yellow-600 shrink-0" />
                <span className="text-[10px] font-bold text-yellow-600 uppercase hidden sm:inline whitespace-nowrap">
                  Modo Super:
                </span>
                <select
                  value={effectiveRole}
                  onChange={(e) => setEffectiveRole(e.target.value)}
                  className="bg-transparent text-xs font-bold text-yellow-700 outline-none cursor-pointer"
                >
                  <option value="super">SUPER (Real)</option>
                  <option value="admin">Admin</option>
                  <option value="contabilidad">Contabilidad</option>
                  <option value="ventas">Ventas</option>
                  <option value="rrhh">RRHH</option>
                  <option value="user">User</option>
                </select>
              </div>
            )}
          </div>

          {/* LADO DERECHO: SALUDO Y ANIMACIÓN */}
          <div className="flex flex-col md:flex-row md:items-center justify-between flex-1 relative z-10 w-full xl:pl-8 xl:border-l xl:border-orange-500/10">
            <div className="flex flex-col gap-1 mt-1 md:mt-0">
              <h2 className="text-xl md:text-2xl font-black tracking-tighter text-foreground leading-tight">
                ¡Hola de nuevo, <span className="text-orange-600 dark:text-orange-500">{metadata.nombre?.split(' ')[0] || 'Usuario'}</span>!
              </h2>
              <p className="text-xs md:text-sm text-muted-foreground font-medium max-w-lg pr-12 md:pr-0 leading-tight">
                Es un gusto verte hoy. Gestiona tus operaciones desde tu panel de control.
              </p>
            </div>

            {/* ELEMENTO VISUAL */}
            <div className="absolute top-0 right-0 md:static flex items-center justify-center z-10 scale-[0.6] md:scale-75 origin-top-right md:pr-2">
              <div className="relative flex items-center gap-2">
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                  className="w-3 h-12 rounded-full bg-orange-600 dark:bg-orange-500 shadow-[0_0_15px_rgba(234,88,12,0.4)]"
                />
                <motion.div
                  animate={{ y: [0, 5, 0] }}
                  transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                  className="w-3 h-16 rounded-full bg-orange-600 dark:bg-orange-500"
                />
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                  className="w-3 h-20 rounded-full bg-orange-600 dark:bg-orange-500 shadow-[0_0_15px_rgba(234,88,12,0.4)]"
                />
              </div>
            </div>
          </div>

          {/* DECORACIÓN FONDO TARJETA */}
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-linear-to-l from-orange-500/5 to-transparent pointer-events-none" />
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl animate-pulse pointer-events-none" />
        </motion.div>

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
                  {item.id === "ventas" && stats.pendientes > 0 && (
                    <div className="absolute top-3 right-3 md:top-5 md:right-5 flex items-center bg-amber-500 text-white px-3 py-1 text-[10px] md:text-xs font-bold rounded-full shadow-md z-20 animate-pulse ring-2 ring-white dark:ring-black">
                      Pendientes de entrega: {stats.pendientes}
                    </div>
                  )}

                  {item.id === "productos" &&
                    (stats.sinStock > 0 || stats.stockBajo > 0) && (
                      <div className="absolute top-3 right-3 md:top-5 md:right-5 flex flex-col gap-1.5 z-20 items-end">
                        {stats.sinStock > 0 && (
                          <div className="flex items-center bg-red-500 text-white px-3 py-1 text-[10px] md:text-xs font-bold rounded-full shadow-md animate-pulse ring-2 ring-white dark:ring-black">
                            Sin stock: {stats.sinStock}
                          </div>
                        )}
                        {stats.stockBajo > 0 && (
                          <div className="flex items-center bg-orange-500 text-white px-3 py-1 text-[10px] md:text-xs font-bold rounded-full shadow-md ring-2 ring-white dark:ring-black">
                            Stock bajo: {stats.stockBajo}
                          </div>
                        )}
                      </div>
                    )}

                  <div className="relative z-10 shrink-0">
                    <div
                      className={cn(
                        "p-2 md:p-3 bg-gray-50 rounded-xl md:rounded-2xl border border-border/50 shadow-sm",
                        item.id === "ventas" && !canViewContabilidad && "md:p-5",
                      )}
                    >
                      <AnimatedIcon
                        iconKey={item.iconKey}
                        target={`#card-${item.id}`}
                        className={cn(
                          "w-8 h-8 md:w-20 md:h-20",
                          item.id === "ventas" &&
                            !canViewContabilidad &&
                            "md:w-24 md:h-24",
                        )}
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

              {canViewStats && (
                <motion.div
                  id="stats-widget"
                  whileHover={{ scale: 1.02, y: -5 }}
                  className="group relative overflow-hidden rounded-4xl md:rounded-[2.5rem] border border-purple-500/20 bg-purple-500/5 dark:border-purple-500/40 flex shadow-sm cursor-pointer md:col-span-2"
                >
                  <Link href="/cermadsa/laarada/estadisticas" className="w-full h-full flex flex-row items-center justify-start gap-4 md:gap-6 p-4 md:p-6 outline-none relative z-10">
                    <div className="relative z-10 shrink-0">
                      <div className="p-2 md:p-3 bg-gray-50 rounded-xl md:rounded-2xl border border-border/50 shadow-sm">
                        <AnimatedIcon
                          iconKey="qgwuoxgw"
                          target="#stats-widget"
                          className="w-8 h-8 md:w-20 md:h-20"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col space-y-0 md:space-y-1 relative z-10">
                      <h3 className="text-base md:text-xl font-bold tracking-tight text-foreground transition-colors">
                        Estadísticas
                      </h3>
                      <p className="text-[10px] md:text-xs text-muted-foreground line-clamp-1 font-medium italic">
                        Ingresos y ventas del mes.
                      </p>
                    </div>
                  </Link>
                  <div className="absolute inset-0 bg-linear-to-br from-transparent via-transparent to-current opacity-[0.03] dark:opacity-[0.05] pointer-events-none" />
                </motion.div>
              )}
        </motion.div>
      </div>
    </>
  );
}

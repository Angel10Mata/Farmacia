"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useUserContext } from "@/components/(base)/providers/UserProvider";
import { MagicCard } from "@/components/ui/magic-card";

import VerPerfil from "@/components/(base)/(users)/profile/VerPerfil";
import PassKeysModal from "@/components/(base)/layout/modals/PassKeysModal";
import {
  User as UserIcon,
  Fingerprint,
  ScanFace,
  KeyRound,
  FolderKanban,
  Users,
  Package,
  Truck,
  ShoppingCart,
  Smartphone,
  ArrowUpRight,
  Settings,
} from "lucide-react";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  proyectos: FolderKanban,
  inventario: Package,
  proveedores: Truck,
  ventas: ShoppingCart,
  perfil: UserIcon,
  dispositivos: Smartphone,
  clientes: Users,
  admin: FolderKanban,
};

interface ModuleConfig {
  id: string;
  title: string;
  subtitle: string;
  desc: string;
  href: string;
  allowedRoles?: string[];
  requiresAdmin?: boolean;
  gradientFrom: string;
  gradientTo: string;
  accent: string;
  accentHover: string;
  activeBorder: string;
  bento: string;
  size: "hero" | "tall" | "wide" | "compact";
  tag: string;
  cardBg: string;        // Tailwind background classes
  cardBorder: string;    // border color class
}


const MODULES: ModuleConfig[] = [
  {
    id: "ventas",
    title: "Gestión de",
    subtitle: "Ventas",
    desc: "Punto de venta, control de caja diaria, reportes de ingresos y facturación.",
    href: "/kore/ventas",
    allowedRoles: ["super", "admin", "ventas", "user"],
    gradientFrom: "#8DA78E",
    gradientTo: "#A3BEB0",
    accent: "text-[#8DA78E] dark:text-[#A3BEB0]",
    accentHover: "group-hover:text-[#525D53] dark:group-hover:text-white",
    activeBorder: "ring-[#8DA78E]/40",
    bento: "col-span-1 row-span-2 md:col-span-2 md:row-span-2",
    size: "hero" as const,
    tag: "Facturación · Caja",
    cardBg: "bg-[#f4f7f5] dark:bg-[#151f19] hover:bg-[#e9f0eb] dark:hover:bg-[#1b2a21]",
    cardBorder: "border-[#8DA78E]/20 dark:border-[#A3BEB0]/20",
  },
  {
    id: "clientes",
    title: "Gestión de",
    subtitle: "Clientes",
    desc: "Directorio de clientes, historial de compras, saldos y fichas de contacto.",
    href: "/kore/clientes",
    allowedRoles: ["super", "admin", "clientes", "ventas"],
    gradientFrom: "#8DA78E",
    gradientTo: "#A3BEB0",
    accent: "text-[#8DA78E] dark:text-[#A3BEB0]",
    accentHover: "group-hover:text-[#525D53] dark:group-hover:text-white",
    activeBorder: "ring-[#8DA78E]/40",
    bento: "col-span-1 row-span-1 md:col-span-1 md:row-span-1",
    size: "compact" as const,
    tag: "Directorio · Historial",
    cardBg: "bg-[#f4f7f5] dark:bg-[#151f19] hover:bg-[#e9f0eb] dark:hover:bg-[#1b2a21]",
    cardBorder: "border-[#8DA78E]/20 dark:border-[#A3BEB0]/20",
  },
  {
    id: "proveedores",
    title: "Gestión de",
    subtitle: "Proveedores",
    desc: "Catálogo de proveedores autorizados, órdenes de compra y facturas.",
    href: "/kore/proveedores",
    allowedRoles: ["super", "admin", "proveedores"],
    gradientFrom: "#8DA78E",
    gradientTo: "#A3BEB0",
    accent: "text-[#8DA78E] dark:text-[#A3BEB0]",
    accentHover: "group-hover:text-[#525D53] dark:group-hover:text-white",
    activeBorder: "ring-[#8DA78E]/40",
    bento: "col-span-1 row-span-1 md:col-span-1 md:row-span-1",
    size: "compact" as const,
    tag: "Contacto · Compras",
    cardBg: "bg-[#f4f7f5] dark:bg-[#151f19] hover:bg-[#e9f0eb] dark:hover:bg-[#1b2a21]",
    cardBorder: "border-[#8DA78E]/20 dark:border-[#A3BEB0]/20",
  },
  {
    id: "inventario",
    title: "Gestión de",
    subtitle: "Inventario",
    desc: "Control de existencias de medicamentos, lotes, vencimientos y categorías.",
    href: "/kore/inventario",
    allowedRoles: ["super", "admin", "inventario"],
    gradientFrom: "#F59E0B",
    gradientTo: "#FBBF24",
    accent: "text-amber-500 dark:text-amber-400",
    accentHover: "group-hover:text-amber-600 dark:group-hover:text-amber-300",
    activeBorder: "ring-amber-500/40",
    bento: "col-span-1 row-span-2 md:col-span-2 md:row-span-2",
    size: "hero" as const,
    tag: "Existencias · Lotes",
    cardBg: "bg-[#fffbeb] dark:bg-[#2b1f15] hover:bg-[#fef3c7] dark:hover:bg-[#3d2c1e]",
    cardBorder: "border-amber-200 dark:border-amber-800/40",
  },
  {
    id: "admin",
    title: "Gestión",
    subtitle: "Administrativa",
    desc: "Panel de control: usuarios, dispositivos, configuraciones y seguridad del sistema.",
    href: "/kore/admin",
    requiresAdmin: true,
    gradientFrom: "#F59E0B",
    gradientTo: "#FBBF24",
    accent: "text-amber-500 dark:text-amber-400",
    accentHover: "group-hover:text-amber-600 dark:group-hover:text-amber-300",
    activeBorder: "ring-amber-500/40",
    bento: "col-span-1 row-span-1 md:col-span-1 md:row-span-1",
    size: "compact" as const,
    tag: "Sistema · Control",
    cardBg: "bg-[#fffbeb] dark:bg-[#2b1f15] hover:bg-[#fef3c7] dark:hover:bg-[#3d2c1e]",
    cardBorder: "border-amber-200 dark:border-amber-800/40",
  },
  {
    id: "perfil",
    title: "Gestión de",
    subtitle: "Mi Perfil",
    desc: "Actualización de credenciales y datos personales del usuario.",
    href: "/kore/perfil",
    gradientFrom: "#F59E0B",
    gradientTo: "#FBBF24",
    accent: "text-amber-500 dark:text-amber-400",
    accentHover: "group-hover:text-amber-600 dark:group-hover:text-amber-300",
    activeBorder: "ring-amber-500/40",
    bento: "col-span-1 row-span-1 md:col-span-1 md:row-span-1 md:col-start-3 md:row-start-2",
    size: "compact" as const,
    tag: "Credenciales",
    cardBg: "bg-[#fffbeb] dark:bg-[#2b1f15] hover:bg-[#fef3c7] dark:hover:bg-[#3d2c1e]",
    cardBorder: "border-amber-200 dark:border-amber-800/40",
  },
];


const DashboardHeader = () => (
  <div className="flex items-center gap-4 md:gap-6 mb-8 w-full max-w-5xl mx-auto px-1">
    <div className="flex-1 min-w-0 flex flex-col">
      <h1 className="text-2xl md:text-4xl font-black uppercase tracking-tight text-zinc-800 dark:text-white leading-none">
        Administración
      </h1>
      <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1.5 leading-tight">
        Gestione todos los módulos de Farmacia Salud desde un solo lugar.
      </p>
    </div>
  </div>
);


export function Dashboard() {
  const { user, effectiveRole } = useUserContext();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [expandedPerfil, setExpandedPerfil] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isPasskeysOpen, setIsPasskeysOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const isSuperOrAdmin = ["super", "admin"].includes(effectiveRole);

  // Si el rol aún no cargó ("authenticated"), mostrar todos los módulos temporalmente
  const roleLoaded = effectiveRole !== "authenticated";

  const visibleModules = MODULES.filter((mod) => {
    // Si el rol no ha cargado todavía, mostrar todo (evitar pantalla vacía)
    if (!roleLoaded) return true;
    if (mod.requiresAdmin && !isSuperOrAdmin) return false;
    if (mod.allowedRoles && !mod.allowedRoles.includes(effectiveRole))
      return false;
    return true;
  });


  const handleCardClick = (id: string, href: string) => {
    setExpandedPerfil(false);
    router.push(href);
  };

  // Agrupar módulos por área
  const AREA_COMERCIAL = ["ventas", "clientes", "proveedores"];
  const AREA_OPERATIVA = ["inventario", "admin", "perfil"];

  const comercialModules = visibleModules.filter((m) => AREA_COMERCIAL.includes(m.id));
  const operativaModules = visibleModules.filter((m) => AREA_OPERATIVA.includes(m.id));

  const AreaLabel = ({ children, color = "violet" }: { children: React.ReactNode; color?: string }) => (
    <div className="flex items-center gap-3 w-full max-w-5xl mx-auto px-1 mb-3">
      <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${
        color === "violet" ? "text-look-1-salvia-suave" : "text-look-2-salvia-menta"
      }`}>{children}</span>
      <div className={`flex-1 h-px ${
        color === "violet" ? "bg-look-1-salvia-suave/30 dark:bg-look-1-salvia-suave/20" : "bg-look-2-salvia-menta/30 dark:bg-look-2-salvia-menta/20"
      }`} />
    </div>
  );

  const renderModuleCard = (mod: ModuleConfig) => {
    const isActive = isMobile && activeId === mod.id;
    const isModuleActive = isActive || (mod.id === 'perfil' && expandedPerfil);
    const IconComponent = ICON_MAP[mod.id] || FolderKanban;
    return (

          <motion.div
            key={mod.id}
            className={cn("cursor-pointer w-full relative col-span-1 row-span-1", mod.bento, (mod.size === "hero" || mod.size === "tall") && "min-h-[250px] sm:min-h-0")}
            id={`${mod.id}-card`}
            initial="idle"
            whileHover={isMobile ? undefined : "hover"}
            animate={isModuleActive ? "active" : "idle"}
            transition={isMobile ? { duration: 0 } : { type: "tween", duration: 0.2, ease: "easeInOut" }}
            variants={{
              idle: { zIndex: 1 },
              hover: { zIndex: 10 },
              active: { zIndex: 20 },
            }}
          >
            <MagicCard
              gradientFrom={mod.gradientFrom}
              gradientTo={mod.gradientTo}
              borderWidth={2}
              className="w-full h-full rounded-3xl border-2 border-slate-200/50 dark:border-slate-800/30 shadow-sm"
              onClick={() => {
                if (mod.id === "perfil" && !expandedPerfil) {
                  setExpandedPerfil(true);
                  if (isMobile) {
                    setActiveId("perfil");
                  }
                } else if (mod.id !== "perfil") {
                  handleCardClick(mod.id, mod.href);
                }
              }}
            >
              {mod.id === "perfil" && expandedPerfil ? (
                <div className="w-full h-full flex flex-col justify-between relative bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <div className="absolute inset-0 bg-white dark:bg-zinc-900 pointer-events-none z-0" />
                  
                  <div className="relative z-10 flex-1 flex flex-row justify-center items-center gap-3 px-4 md:px-5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsProfileOpen(true);
                      }}
                      className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 transition-all cursor-pointer text-left h-fit"
                    >
                      <UserIcon className="size-4 shrink-0 text-zinc-800 dark:text-white" />
                      <div>
                        <p className="text-xs font-bold text-zinc-800 dark:text-white leading-none">
                          Mi Perfil
                        </p>
                        <p className="text-[9px] text-slate-500 dark:text-slate-400 mt-1 leading-none">
                          Ver y editar perfil
                        </p>
                      </div>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsPasskeysOpen(true);
                      }}
                      className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 transition-all cursor-pointer text-left h-fit"
                    >
                      <Fingerprint className="size-4 text-zinc-800 dark:text-white" />
                      <div>
                        <p className="text-xs font-bold text-zinc-800 dark:text-white leading-none">
                          Ingreso Seguro
                        </p>
                        <p className="text-[9px] text-slate-500 dark:text-slate-400 mt-1 leading-none">
                          Administrar llaves
                        </p>
                      </div>
                    </button>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedPerfil(false);
                      if (isMobile) {
                        setActiveId(null);
                      }
                    }}
                    className="relative z-10 w-full h-9 flex justify-center items-center cursor-pointer hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors border-t border-slate-200 dark:border-slate-800"
                  >
                    <span className="flex items-center gap-2 text-zinc-800 dark:text-white font-black uppercase text-[10px] tracking-[0.25em]">
                      ← Volver
                    </span>
                  </button>
                </div>
              ) : (
                <div className={cn(
                  "w-full h-full flex flex-col relative",
                  mod.size === "compact" || mod.size === "wide" ? "justify-start md:justify-between gap-2 md:gap-0" : "justify-between",
                  mod.size === "hero" || mod.size === "tall" ? "p-6 pb-6 md:p-8 md:pb-8" : "p-4 pb-3 md:p-5 md:pb-5"
                )}>
                  {/* Content */}
                  <div className={cn("relative z-10 flex flex-row items-center justify-start gap-4 w-full", mod.size === "compact" || mod.size === "wide" ? "md:flex-1" : "flex-1")}>
                    {/* Icon Container */}
                    <div className="shrink-0 flex items-center justify-center relative">
                      <IconComponent className={cn(
                        "transition-transform duration-500 group-hover:scale-110 drop-shadow-sm",
                        mod.size === "hero" ? "size-16 md:size-20" : mod.size === "tall" ? "size-14 md:size-16" : mod.size === "wide" ? "size-12 md:size-14" : "size-10 md:size-12"
                      )} />
                    </div>

                    {/* Text details */}
                    <div className="flex-1 min-w-0 flex flex-col justify-start">
                      {/* Title */}
                      <h3 className="font-black tracking-tighter uppercase leading-none text-zinc-800 dark:text-white transition-colors duration-500" style={{ fontSize: mod.size === "hero" ? "1.875rem" : mod.size === "tall" ? "1.5rem" : mod.size === "wide" ? "1.25rem" : "1.125rem" }}>
                        {mod.title}
                        <br />
                        <span className="text-zinc-800 dark:text-white transition-colors duration-500">
                          {mod.subtitle}
                        </span>
                      </h3>
                      
                      {/* Description */}
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium italic mt-2 leading-tight transition-colors duration-500 line-clamp-2">
                        {mod.desc}
                      </p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className={cn("relative z-10 flex items-center justify-between border-t border-slate-200/50 dark:border-slate-800/30 transition-colors duration-500", mod.size === "compact" || mod.size === "wide" ? "pt-2 md:pt-2.5 md:mt-2" : "pt-2.5 mt-2")}>
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-[0.2em] transition-colors duration-500",
                      mod.accent,
                      mod.accentHover
                    )}>
                      Entrar al módulo
                    </span>
                    <ArrowUpRight className={cn("size-4 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5", mod.accent, mod.accentHover)} />
                  </div>
                </div>
              )}
            </MagicCard>
          </motion.div>
        );
  };

  const renderBentoGrid = () => (
    <div className="flex flex-col gap-6 w-full">
      {/* Área de Ventas */}
      {comercialModules.length > 0 && (
        <div className="flex flex-col">
          <AreaLabel color="violet">Área de Ventas</AreaLabel>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-auto sm:auto-rows-[160px]">
            {comercialModules.map(renderModuleCard)}
          </div>
        </div>
      )}

      {/* Área Operativa */}
      {operativaModules.length > 0 && (
        <div className="flex flex-col">
          <AreaLabel color="emerald">Área Operativa</AreaLabel>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-auto sm:auto-rows-[160px]">
            {operativaModules.map(renderModuleCard)}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="relative w-full flex-1 flex flex-col">
      {/* MODALES */}
      <VerPerfil
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        userId={null}
      />
      <PassKeysModal
        isOpen={isPasskeysOpen}
        onClose={() => setIsPasskeysOpen(false)}
        user={user}
      />

      {/* MOBILE */}
      <div className="flex flex-col md:hidden w-full bg-transparent">
        <div className="w-full px-4 pt-20 pb-20">
          <DashboardHeader />
          {renderBentoGrid()}
        </div>
      </div>

      {/* DESKTOP */}
      <div className="hidden md:flex md:flex-col md:flex-1 relative w-full">
        <div className="relative z-10 w-full flex-1 flex flex-col">
          <div className="w-full flex-1 bg-transparent px-8 lg:px-12 pt-20 pb-20 flex flex-col justify-center">
            <div className="w-full max-w-5xl mx-auto">
              <DashboardHeader />
              {renderBentoGrid()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

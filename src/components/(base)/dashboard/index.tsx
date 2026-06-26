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

function InventarioIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <polygon points="6,18 24,7 42,18" fill="#DDD6FE" />
      <polygon points="9,18 24,9 39,18" fill="#C084FC" />
      <rect x="9" y="18" width="30" height="22" rx="1" fill="#F3F4F6" />
      <rect x="16" y="24" width="16" height="16" fill="#4B5563" />
      <rect x="11" y="30" width="8" height="10" fill="#C2410C" rx="1" />
      <rect x="17" y="33" width="7" height="7" fill="#EA580C" rx="1" />
      <line x1="13" y1="35" x2="17" y2="35" stroke="#9A3412" strokeWidth="1" />
      <line x1="19" y1="36" x2="22" y2="36" stroke="#9A3412" strokeWidth="1" />
    </svg>
  );
}

function VentasIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect x="18" y="12" width="8" height="8" fill="#F472B6" rx="1" transform="rotate(-6 18 12)" />
      <rect x="25" y="10" width="9" height="10" fill="#34D399" rx="1" transform="rotate(8 25 10)" />
      <rect x="21" y="15" width="10" height="7" fill="#FBBF24" rx="1" />
      <path d="M8 12H13.5L17.5 31H34.5L38.5 16H15" fill="none" stroke="#374151" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="20" cy="37" r="4.5" fill="#1F2937" />
      <circle cx="20" cy="37" r="1.5" fill="#E5E7EB" />
      <circle cx="32" cy="37" r="4.5" fill="#1F2937" />
      <circle cx="32" cy="37" r="1.5" fill="#E5E7EB" />
    </svg>
  );
}

function ProveedoresIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M30 20H37L42 26V35H30V20Z" fill="#60A5FA" />
      <polygon points="35 22 39 26 35 26" fill="#EFF6FF" />
      <rect x="8" y="14" width="22" height="21" rx="1.5" fill="#F59E0B" />
      <line x1="12" y1="14" x2="12" y2="35" stroke="#D97706" strokeWidth="1" />
      <line x1="16" y1="14" x2="16" y2="35" stroke="#D97706" strokeWidth="1" />
      <circle cx="16" cy="36" r="5" fill="#1F2937" />
      <circle cx="16" cy="36" r="2" fill="#FFF" />
      <circle cx="34" cy="36" r="5" fill="#1F2937" />
      <circle cx="34" cy="36" r="2" fill="#FFF" />
    </svg>
  );
}

function PerfilIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect x="9" y="12" width="30" height="24" rx="2.5" fill="#ECFDF5" stroke="#10B981" strokeWidth="2" />
      <circle cx="24" cy="20" r="4.5" fill="#10B981" />
      <path d="M17 29.5C17 26.5 20.134 25.5 24 25.5C27.866 25.5 31 26.5 31 29.5V31.5H17V29.5Z" fill="#10B981" />
      <circle cx="33" cy="15" r="4.5" fill="#FBBF24" />
      <path d="M31.5 15L32.5 16L34.5 14" fill="none" stroke="#FFF" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function ClientesIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Persona 1 */}
      <circle cx="16" cy="15" r="5" fill="#BAE6FD" stroke="#0EA5E9" strokeWidth="1.5" />
      <path d="M8 30c0-4 3.582-7 8-7s8 3 8 7v2H8v-2z" fill="#0EA5E9" />
      {/* Persona 2 */}
      <circle cx="32" cy="13" r="4.5" fill="#E0F2FE" stroke="#38BDF8" strokeWidth="1.5" />
      <path d="M24.5 28c0-3.5 3.13-6.5 7.5-6.5s7.5 3 7.5 6.5v2h-15v-2z" fill="#38BDF8" />
      {/* Estrella VIP */}
      <path d="M37 10l1 2.5 2.5 0-2 1.8.8 2.5L37 15.5l-2.3 1.3.8-2.5-2-1.8 2.5 0z" fill="#FBBF24" />
    </svg>
  );
}

function DispositivosIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect x="8" y="11" width="24" height="26" rx="2.5" fill="#C7D2FE" stroke="#4F46E5" strokeWidth="1.5" />
      <rect x="10" y="13" width="20" height="22" fill="#EEF2F6" />
      <circle cx="20" cy="36" r="0.8" fill="#4F46E5" />
      <rect x="24" y="18" width="16" height="21" rx="2" fill="#818CF8" stroke="#EEF2F6" strokeWidth="1" />
      <rect x="26" y="20" width="12" height="17" fill="#FFF" />
      <circle cx="32" cy="38" r="0.6" fill="#E0E7FF" />
    </svg>
  );
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  proyectos: FolderKanban,
  inventario: InventarioIllustration,
  proveedores: ProveedoresIllustration,
  ventas: VentasIllustration,
  perfil: PerfilIllustration,
  dispositivos: DispositivosIllustration,
  clientes: ClientesIllustration,
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
    allowedRoles: ["super", "admin", "ventas"],
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
    gradientFrom: "#0EA5E9",
    gradientTo: "#38BDF8",
    accent: "text-sky-500 dark:text-sky-400",
    accentHover: "group-hover:text-sky-600 dark:group-hover:text-sky-300",
    activeBorder: "ring-sky-500/40",
    bento: "col-span-1 row-span-1 md:col-span-1 md:row-span-1",
    size: "compact" as const,
    tag: "Directorio · Historial",
    cardBg: "bg-[#f0f9ff] dark:bg-[#12253a] hover:bg-[#e0f2fe] dark:hover:bg-[#1a3552]",
    cardBorder: "border-sky-200 dark:border-sky-800/40",
  },
  {
    id: "proveedores",
    title: "Gestión de",
    subtitle: "Proveedores",
    desc: "Catálogo de proveedores autorizados, órdenes de compra y facturas.",
    href: "/kore/proveedores",
    allowedRoles: ["super", "admin", "proveedores"],
    gradientFrom: "#F59E0B",
    gradientTo: "#FBBF24",
    accent: "text-amber-500 dark:text-amber-400",
    accentHover: "group-hover:text-amber-600 dark:group-hover:text-amber-300",
    activeBorder: "ring-amber-500/40",
    bento: "col-span-1 row-span-1 md:col-span-1 md:row-span-1",
    size: "compact" as const,
    tag: "Contacto · Compras",
    cardBg: "bg-[#fffbeb] dark:bg-[#2b1f15] hover:bg-[#fef3c7] dark:hover:bg-[#3d2c1e]",
    cardBorder: "border-amber-200 dark:border-amber-800/40",
  },
  {
    id: "inventario",
    title: "Gestión de",
    subtitle: "Inventario",
    desc: "Control de existencias de medicamentos, lotes, vencimientos y categorías.",
    href: "/kore/inventario",
    allowedRoles: ["super", "admin", "inventario"],
    gradientFrom: "#10B981",
    gradientTo: "#34D399",
    accent: "text-emerald-500 dark:text-emerald-400",
    accentHover: "group-hover:text-emerald-600 dark:group-hover:text-emerald-300",
    activeBorder: "ring-emerald-500/40",
    bento: "col-span-1 row-span-2 md:col-span-2 md:row-span-2",
    size: "hero" as const,
    tag: "Existencias · Lotes",
    cardBg: "bg-[#ecfdf5] dark:bg-[#132821] hover:bg-[#d1fae5] dark:hover:bg-[#1a3a2f]",
    cardBorder: "border-emerald-200 dark:border-emerald-800/40",
  },
  {
    id: "admin",
    title: "Gestión",
    subtitle: "Administrativa",
    desc: "Panel de control: usuarios, dispositivos, configuraciones y seguridad del sistema.",
    href: "/kore/admin",
    requiresAdmin: true,
    gradientFrom: "#06B6D4",
    gradientTo: "#22D3EE",
    accent: "text-cyan-500 dark:text-cyan-400",
    accentHover: "group-hover:text-cyan-600 dark:group-hover:text-cyan-300",
    activeBorder: "ring-cyan-500/40",
    bento: "col-span-1 row-span-1 md:col-span-1 md:row-span-1",
    size: "compact" as const,
    tag: "Sistema · Control",
    cardBg: "bg-[#ecfeff] dark:bg-[#12282d] hover:bg-[#cffafe] dark:hover:bg-[#1a383f]",
    cardBorder: "border-cyan-200 dark:border-cyan-800/40",
  },
  {
    id: "perfil",
    title: "Gestión de",
    subtitle: "Mi Perfil",
    desc: "Actualización de credenciales y datos personales del usuario.",
    href: "/kore/perfil",
    gradientFrom: "#F43F5E",
    gradientTo: "#FB7185",
    accent: "text-rose-500 dark:text-rose-400",
    accentHover: "group-hover:text-rose-600 dark:group-hover:text-rose-300",
    activeBorder: "ring-rose-500/40",
    bento: "col-span-1 row-span-1 md:col-span-1 md:row-span-1 md:col-start-3 md:row-start-2",
    size: "compact" as const,
    tag: "Credenciales",
    cardBg: "bg-[#fff1f2] dark:bg-[#2c161d] hover:bg-[#ffe4e6] dark:hover:bg-[#3d1e28]",
    cardBorder: "border-rose-200 dark:border-rose-800/40",
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

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import AnimatedIcon from "@/components/ui/AnimatedIcon";
import { useUserContext } from "@/components/(base)/providers/UserProvider";

import VerPerfil from "@/components/(base)/(users)/profile/VerPerfil";
import PassKeysModal from "@/components/(base)/layout/modals/PassKeysModal";
import {
  User as UserIcon,
  Fingerprint,
  ScanFace,
  KeyRound,
} from "lucide-react";

const MODULES = [
  {
    id: "proyectos",
    title: "Gestión de",
    subtitle: "Proyectos",
    desc: "Administración, control financiero y seguimiento del estado de los proyectos.",
    icon: "qikuvfgb",
    href: "/kore/proyectos",
    allowedRoles: ["super", "admin", "proyectos"],
    isWide: true,
  },
  {
    id: "perfil",
    title: "Gestión de",
    subtitle: "Mi Perfil",
    desc: "Actualización de credenciales y datos personales del usuario.",
    icon: "btgcyfug",
    href: "/kore/perfil",
    isWide: false,
  },
  {
    id: "dispositivos",
    title: "Gestión de",
    subtitle: "Dispositivos",
    desc: "Administración de dispositivos autorizados y configuración de llaves de acceso.",
    icon: "gzqipvbr",
    href: "/kore/admin",
    requiresAdmin: true,
    isWide: false,
  },
];

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

  const visibleModules = MODULES.filter((mod) => {
    if (mod.requiresAdmin && !isSuperOrAdmin) return false;
    if (mod.allowedRoles && !mod.allowedRoles.includes(effectiveRole))
      return false;
    return true;
  });

  const handleCardClick = (id: string, href: string) => {
    setExpandedPerfil(false);
    if (isMobile) {
      if (activeId === id) {
        router.push(href);
      } else {
        setActiveId(id);
      }
    } else {
      router.push(href);
    }
  };

  const renderCardsGrid = () => (
    <div className="flex flex-col gap-4 w-full max-w-2xl mx-auto">
      {visibleModules.map((mod, index) => {
        const isActive = isMobile && activeId === mod.id;
        const isModuleActive = isActive || (mod.id === 'perfil' && expandedPerfil);

        return (
          <motion.div
            key={mod.id}
            className="cursor-pointer w-full relative h-[150px] sm:h-[160px]"
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
            {mod.id === "perfil" ? (
              <div className="group flex flex-col border border-red-500 dark:border-red-500/50 overflow-hidden h-full w-full rounded-2xl bg-white dark:bg-zinc-900/40 backdrop-blur-md md:transition-colors md:duration-500 hover:border-red-600 dark:hover:border-red-500 hover:shadow-lg hover:shadow-red-600/10 dark:hover:shadow-red-500/10">
                <AnimatePresence mode="wait">
                  {expandedPerfil ? (
                    <motion.div
                      key="perfil-expanded"
                      initial={isMobile ? { opacity: 1 } : { opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={isMobile ? { opacity: 1 } : { opacity: 0 }}
                      transition={{ duration: isMobile ? 0 : 0.4, ease: "easeInOut" }}
                      className="w-full h-full flex flex-col justify-center items-center p-0 relative z-10 bg-transparent rounded-[inherit] overflow-hidden"
                    >
                      <motion.div
                        initial={isMobile ? { scaleY: 0, opacity: 0 } : { scaleY: 1, opacity: 1 }}
                        animate={{ scaleY: 1, opacity: 1 }}
                        exit={isMobile ? { scaleY: 0, opacity: 0 } : { scaleY: 1, opacity: 1 }}
                        transition={{ duration: 0.5, ease: [0.33, 1, 0.68, 1] }}
                        className="absolute top-0 left-0 w-full h-[calc(100%-36px)] origin-bottom bg-gradient-to-t from-celeste-kore to-celeste-kore/80 pointer-events-none z-0 rounded-t-[inherit]"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedPerfil(false);
                          if (isMobile) {
                            setActiveId(null);
                          }
                        }}
                        className="absolute bottom-0 left-0 w-full h-9 flex justify-center items-center z-10 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 transition-colors border-t border-border/10 dark:border-white/5"
                      >
                        <span className="flex items-center gap-2 text-slate-900 dark:text-white font-black uppercase text-xs tracking-[0.25em]">
                          ← Volver
                        </span>
                      </button>
                      <motion.div
                        initial={{ opacity: isMobile ? 1 : 0, y: isMobile ? 0 : 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: isMobile ? 0 : 0.4,
                          delay: isMobile ? 0 : 0.15,
                          ease: "easeOut",
                        }}
                        className="relative z-10 w-full h-full flex flex-row justify-center items-center gap-3 px-6"
                      >
                        <button
                          onClick={() => setIsProfileOpen(true)}
                          className="flex-1 flex flex-col items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-white/30 bg-white/15 hover:bg-white/25 transition-all cursor-pointer text-center h-fit"
                        >
                          <UserIcon className="size-4 shrink-0 text-white" />
                          <div className="flex flex-col items-center">
                            <p className="text-xs font-bold text-white leading-none">
                              Mi Perfil
                            </p>
                            <p className="text-[9px] text-white/70 mt-1 leading-none">
                              Ver y editar perfil
                            </p>
                          </div>
                        </button>
                        <button
                          onClick={() => setIsPasskeysOpen(true)}
                          className="flex-1 flex flex-col items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-white/30 bg-white/15 hover:bg-white/25 transition-all cursor-pointer text-center h-fit"
                        >
                          <Fingerprint className="size-4 shrink-0 text-white" />
                          <div className="flex flex-col items-center">
                            <p className="text-xs font-bold text-white leading-none">
                              Ingreso Seguro
                            </p>
                            <p className="text-[9px] text-white/70 mt-1 leading-none">
                              Administrar llaves
                            </p>
                          </div>
                        </button>
                      </motion.div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="perfil-normal"
                      initial={isMobile ? { opacity: 1 } : { opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={isMobile ? { opacity: 1 } : { opacity: 0 }}
                      transition={{ duration: isMobile ? 0 : 0.4, ease: "easeInOut" }}
                      onClick={() => {
                        setExpandedPerfil(true);
                        if (isMobile) {
                          setActiveId("perfil");
                        }
                      }}
                      className="w-full h-full flex flex-col justify-center items-center p-0 relative z-10 bg-transparent rounded-[inherit] overflow-hidden cursor-pointer"
                    >
                      <div
                        className="absolute top-0 left-0 w-full h-[calc(100%-36px)] origin-bottom bg-gradient-to-t from-celeste-kore to-celeste-kore/80 pointer-events-none z-0 rounded-t-[inherit] transition-all duration-500 ease-[cubic-bezier(0.33,1,0.68,1)] scale-y-0 opacity-0 group-hover:scale-y-100 group-hover:opacity-100"
                      />
                      <div className="absolute bottom-0 left-0 w-full h-9 flex justify-center items-center z-10 md:transition-all md:duration-500 opacity-0 md:group-hover:opacity-100 md:translate-y-2 md:group-hover:translate-y-0">
                        <span className="flex items-center gap-2 text-slate-900 dark:text-white font-black uppercase text-xs tracking-[0.25em]">
                          Ver opciones
                        </span>
                      </div>
                      <div
                        className="w-full h-full flex flex-row justify-start items-center px-6 gap-4 relative z-10"
                      >
                        <div className="relative z-10 flex justify-center shrink-0">
                          <div className="size-14 sm:size-16 flex items-center justify-center relative">
                            <div className="absolute inset-0 bg-white/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <motion.div
                              variants={{
                                idle: { y: 0 },
                                hover: { y: -18 },
                                active: { y: -18 },
                              }}
                              transition={{ duration: 0.3 }}
                              className="w-full h-full flex items-center justify-center relative"
                            >
                              <div 
                                className="absolute inset-[-6px] bg-white rounded-2xl border border-slate-200/80 shadow-md transition-all duration-500 opacity-100 scale-100 -z-10"
                              />
                              <AnimatedIcon
                                iconKey={mod.icon}
                                target={`#${mod.id}-card`}
                                className="size-8 sm:size-10"
                                speed={1.5}
                                trigger="hover"
                              />
                            </motion.div>
                          </div>
                        </div>
                        <motion.div
                          variants={{
                            idle: { y: 0 },
                            hover: { y: -18 },
                            active: { y: -18 },
                          }}
                          transition={{ duration: 0.3 }}
                          className="relative z-10 flex-1 flex flex-col items-start text-left space-y-1"
                        >
                          <h3 className="text-base sm:text-lg font-black tracking-tighter text-slate-900 dark:text-white group-hover:text-white uppercase leading-none w-full break-words md:transition-colors md:duration-500">
                            {mod.title}
                            <br />
                            <span className="text-celeste-kore group-hover:text-white/90 md:transition-colors md:duration-500">
                              {mod.subtitle}
                            </span>
                          </h3>
                          <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 group-hover:text-white/80 font-bold italic leading-tight pr-2 md:transition-colors md:duration-500">
                            {mod.desc}
                          </p>
                        </motion.div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div
                onClick={() => handleCardClick(mod.id, mod.href)}
                className="group flex flex-col border border-red-500 dark:border-red-500/50 overflow-hidden h-full w-full rounded-2xl transition-colors duration-500 cursor-pointer bg-white dark:bg-zinc-900/40 backdrop-blur-md hover:border-red-600 dark:hover:border-red-500 hover:shadow-lg hover:shadow-red-600/10 dark:hover:shadow-red-500/10"
                style={{
                  borderColor: isActive ? "#ef4444" : undefined,
                }}
              >
                <div className="w-full h-full flex flex-col justify-center items-center p-0 outline-none relative z-10 rounded-[inherit] overflow-hidden">
                  <motion.div
                    variants={{
                      idle: { scaleY: 0, opacity: 0 },
                      hover: { scaleY: 1, opacity: 1 },
                      active: { scaleY: 1, opacity: 1 },
                    }}
                    transition={{ duration: 0.5, ease: [0.33, 1, 0.68, 1] }}
                    className="absolute top-0 left-0 w-full h-[calc(100%-36px)] origin-bottom bg-gradient-to-t from-celeste-kore to-celeste-kore/80 pointer-events-none z-0 rounded-t-[inherit]"
                  />
                  <div className="absolute inset-0 rounded-[inherit] border border-slate-200 dark:border-slate-700/50 pointer-events-none z-20" />
                  <div className="absolute bottom-0 left-0 w-full h-9 flex justify-center items-center z-10">
                    <motion.span
                      variants={{
                        idle: { opacity: 0, y: isMobile ? 0 : 8 },
                        hover: { opacity: 1, y: isMobile ? 0 : 0 },
                        active: { opacity: 1, y: isMobile ? 0 : 0 },
                      }}
                      transition={{ duration: 0.3 }}
                      className="flex items-center gap-2 font-black uppercase text-xs tracking-[0.25em] transition-colors duration-500 text-slate-900 dark:text-white"
                    >
                      {isActive
                        ? "Toca de nuevo para entrar"
                        : "Haz click para entrar"}
                    </motion.span>
                  </div>
                  <motion.div
                    className="w-full flex relative z-10 h-full flex-row items-center justify-start px-6 gap-4"
                    variants={{
                      idle: { opacity: 1 },
                      hover: { opacity: 1 },
                      active: { opacity: isMobile ? 1 : [1, 0.4, 1] },
                    }}
                    transition={isMobile ? { duration: 0 } : {
                      duration: 1.4,
                      repeat: isActive ? Infinity : 0,
                      ease: "easeInOut",
                    }}
                  >
                    <div className="relative z-10 flex justify-center shrink-0">
                      <div className="size-14 sm:size-16 flex items-center justify-center relative">
                        <div className="absolute inset-0 bg-white/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <motion.div
                          variants={{
                            idle: { y: 0 },
                            hover: { y: -18 },
                            active: { y: -18 },
                          }}
                          transition={{ duration: 0.3 }}
                          className="w-full h-full flex items-center justify-center relative"
                        >
                          <div 
                            className="absolute inset-[-6px] bg-white rounded-2xl border border-slate-200/80 shadow-md transition-all duration-500 -z-10 opacity-100 scale-100"
                          />
                          <AnimatedIcon
                            iconKey={mod.icon}
                            target={`#${mod.id}-card`}
                            className="size-8 sm:size-10"
                            speed={1.5}
                            trigger="hover"
                          />
                        </motion.div>
                      </div>
                    </div>
                    <motion.div
                      variants={{
                        idle: { y: 0 },
                        hover: { y: -18 },
                        active: { y: -18 },
                      }}
                      transition={{ duration: 0.3 }}
                      className="relative z-10 flex-1 flex flex-col items-start space-y-1 text-left"
                    >
                      <h3 className="text-base sm:text-lg font-black tracking-tighter uppercase leading-none w-full break-words md:transition-colors md:duration-500">
                        <span
                          className="text-slate-900 dark:text-white group-hover:text-white md:transition-colors md:duration-500"
                          style={{ color: isActive ? "#ffffff" : undefined }}
                        >
                          {mod.title}
                        </span>
                        <br />
                        <span
                          className="text-celeste-kore group-hover:text-white/90 md:transition-colors md:duration-500"
                          style={{
                            color: isActive
                              ? "rgba(255,255,255,0.9)"
                              : undefined,
                          }}
                        >
                          {mod.subtitle}
                        </span>
                      </h3>
                      <p
                        className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 group-hover:text-white/80 font-bold italic leading-tight pr-2 md:transition-colors md:duration-500"
                        style={{
                          color: isActive ? "rgba(255,255,255,0.8)" : undefined,
                        }}
                      >
                        {mod.desc}
                      </p>
                    </motion.div>
                  </motion.div>
                </div>
              </div>
            )}
          </motion.div>
        );
      })}
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

      <div className="flex flex-col md:hidden w-full bg-transparent">
        <div className="w-full px-4 pt-20 pb-20">{renderCardsGrid()}</div>
      </div>

      <div className="hidden md:flex md:flex-col md:flex-1 relative w-full">
        <div className="relative z-10 w-full flex-1 flex flex-col">
          <div className="w-full flex-1 bg-transparent px-8 lg:px-12 pt-20 pb-20 flex flex-col justify-center">
            <div className="w-full max-w-2xl mx-auto">
              {renderCardsGrid()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

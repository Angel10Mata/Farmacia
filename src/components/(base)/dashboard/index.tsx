"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { useRouter } from "next/navigation";
import AnimatedIcon from "@/components/ui/AnimatedIcon";
import { useUserContext } from "@/components/(base)/providers/UserProvider";
import LogoKore from "@/components/(Kore)/logo/LogoKore";
import LogoKoreMobile from "@/components/(Kore)/logo/LogoKore-mobile";
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

  const { scrollY } = useScroll();
  const logoY = useTransform(scrollY, [0, 600], [0, -300]);
  const logoOpacity = useTransform(scrollY, [0, 400], [1, 0]);



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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 w-full">
      {visibleModules.map((mod, index) => {
        const isActive = isMobile && activeId === mod.id;
        const isWide = !!mod.isWide;
        const isModuleActive = isActive || (mod.id === 'perfil' && expandedPerfil);

        return (
          <motion.div
            key={mod.id}
            className={[
              "cursor-pointer w-full relative",
              isWide
                ? "col-span-1 md:col-span-2 min-h-[120px] md:min-h-[300px] lg:h-[380px]"
                : "col-span-1 min-h-[120px] md:min-h-[400px] lg:h-[380px]"
            ]
              .join(" ")
              .trim()}
            id={`${mod.id}-card`}
            initial="idle"
            whileHover={isMobile ? undefined : "hover"}
            animate={isModuleActive ? "active" : "idle"}
            transition={{ duration: 0.3, ease: "easeOut" }}
            variants={{
              idle: { zIndex: 1, height: isMobile ? 120 : undefined },
              hover: { zIndex: 10, height: isMobile ? 120 : undefined }, // Se quitó la expansión en hover para evitar rebotes
              active: { zIndex: 20, height: isMobile ? 220 : undefined },
            }}
          >
            {mod.id === "perfil" ? (
              <div className="group flex flex-col border border-red-500 dark:border-white/40 overflow-hidden h-full w-full rounded-2xl bg-white dark:bg-[#111] transition-colors duration-500 hover:border-red-600 dark:hover:border-white hover:shadow-lg hover:shadow-red-600/10 dark:hover:shadow-white/10">
                <AnimatePresence mode="wait">
                  {expandedPerfil ? (
                    <motion.div
                      key="perfil-expanded"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4, ease: "easeInOut" }}
                      className="w-full h-full md:min-h-[300px] flex flex-col justify-center items-center p-3 md:p-6 relative z-10 bg-transparent rounded-[inherit] overflow-hidden"
                    >
                      <div className="absolute top-0 left-0 w-full h-[calc(100%-32px)] md:h-[calc(100%-70px)] bg-gradient-to-t from-celeste-kore to-celeste-kore/80 pointer-events-none z-0 rounded-t-[inherit]" />
                      <button
                        onClick={() => setExpandedPerfil(false)}
                        className="absolute bottom-0 left-0 w-full h-8 md:h-[70px] flex justify-center items-center z-10 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                      >
                        <span className="flex items-center gap-2 text-slate-900 dark:text-white font-black uppercase text-xs tracking-[0.25em]">
                          ← Volver
                        </span>
                      </button>
                      <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.4,
                          delay: 0.15,
                          ease: "easeOut",
                        }}
                        className="relative z-10 w-full flex flex-col gap-1.5 md:gap-3 pb-8 md:pb-[40px]"
                      >
                        <button
                          onClick={() => setIsProfileOpen(true)}
                          className="w-full flex items-center gap-2 md:gap-3 px-2.5 py-1 md:px-4 md:py-3 rounded-xl border border-white/30 bg-white/15 hover:bg-white/25 transition-all cursor-pointer text-left"
                        >
                          <UserIcon className="size-4 md:size-5 shrink-0 text-white" />
                          <div>
                            <p className="text-xs md:text-sm font-bold text-white leading-none">
                              Mi Perfil
                            </p>
                            <p className="text-[9px] md:text-[10px] text-white/70 mt-0.5 leading-none">
                              Ver y editar perfil
                            </p>
                          </div>
                        </button>
                        <button
                          onClick={() => setIsPasskeysOpen(true)}
                          className="w-full flex items-center gap-2 md:gap-3 px-2.5 py-1 md:px-4 md:py-3 rounded-xl border border-white/30 bg-white/15 hover:bg-white/25 transition-all cursor-pointer text-left"
                        >
                          <div className="flex items-center gap-0.5 md:gap-1 shrink-0">
                            <Fingerprint className="size-3 md:size-4 text-white/80" />
                            <ScanFace className="size-3 md:size-4 text-white/80" />
                            <KeyRound className="size-3 md:size-4 text-white/80" />
                          </div>
                          <div>
                            <p className="text-xs md:text-sm font-bold text-white leading-none">
                              Ingreso Seguro
                            </p>
                            <p className="text-[9px] md:text-[10px] text-white/70 mt-0.5 leading-none">
                              Administrar dispositivos
                            </p>
                          </div>
                        </button>
                      </motion.div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="perfil-normal"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4, ease: "easeInOut" }}
                      onClick={() => setExpandedPerfil(true)}
                      className="w-full h-full md:min-h-[300px] flex flex-col justify-center items-center p-3 md:p-6 relative z-10 bg-transparent rounded-[inherit] overflow-hidden cursor-pointer"
                    >
                      <div className="absolute top-0 left-0 w-full h-[calc(100%-32px)] md:h-[calc(100%-70px)] origin-bottom scale-y-0 bg-gradient-to-t from-celeste-kore to-celeste-kore/80 transition-transform duration-500 ease-[cubic-bezier(0.33,1,0.68,1)] group-hover:scale-y-100 pointer-events-none z-0 rounded-t-[inherit]" />
                      <div className="absolute bottom-0 left-0 w-full h-8 md:h-[70px] flex justify-center items-center z-10 transition-all duration-500 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0">
                        <span className="flex items-center gap-2 text-slate-900 dark:text-white font-black uppercase text-xs tracking-[0.25em]">
                          Ver opciones
                        </span>
                      </div>
                      <motion.div
                        className="w-full h-full flex flex-row md:flex-col justify-start md:justify-center items-center px-4 md:px-0 gap-4 md:gap-0 relative z-10"
                        variants={{
                          idle: { paddingBottom: isMobile ? 0 : 40 },
                          hover: { paddingBottom: isMobile ? 32 : 40 },
                          active: { paddingBottom: isMobile ? 32 : 40 },
                        }}
                      >
                        <div className="relative z-10 flex justify-center shrink-0 mb-0 md:mb-4">
                          <div className="size-16 md:size-[90px] flex items-center justify-center transition-transform duration-700 ease-out md:group-hover:-translate-y-4 relative">
                            <div className="absolute inset-0 bg-white/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <div 
                              className="absolute inset-[-6px] md:inset-[-10px] bg-white rounded-2xl border border-slate-200/80 shadow-md transition-all duration-500 opacity-100 scale-100 -z-10"
                            />
                            <AnimatedIcon
                              iconKey={mod.icon}
                              target={`#${mod.id}-card`}
                              className="size-10 md:size-[64px]"
                              speed={1.5}
                              trigger="hover"
                            />
                          </div>
                        </div>
                        <div className="relative z-10 w-full flex flex-col items-start md:items-center text-left md:text-center space-y-1 md:space-y-4 transition-transform duration-700 md:group-hover:-translate-y-2">
                          <h3 className="text-lg md:text-[1.6rem] lg:text-[1.85rem] font-black tracking-tighter text-slate-900 dark:text-white group-hover:text-white uppercase leading-none w-full break-words transition-colors duration-500">
                            {mod.title}
                            <br />
                            <span className="text-celeste-kore group-hover:text-white/90 transition-colors duration-500">
                              {mod.subtitle}
                            </span>
                          </h3>
                          <p className="text-[11px] md:text-[14px] lg:text-[15px] text-slate-500 dark:text-slate-400 group-hover:text-white/80 font-bold italic leading-tight pr-2 transition-colors duration-500">
                            {mod.desc}
                          </p>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div
                onClick={() => handleCardClick(mod.id, mod.href)}
                className="group flex flex-col border border-red-500 dark:border-white/40 overflow-hidden h-full w-full rounded-2xl transition-colors duration-500 cursor-pointer bg-white dark:bg-[#111] hover:border-red-600 dark:hover:border-white hover:shadow-lg hover:shadow-red-600/10 dark:hover:shadow-white/10"
                style={{
                  borderColor: isActive ? "#ef4444" : undefined,
                }}
              >
                <div className="w-full h-full md:min-h-[300px] flex flex-col justify-center items-center p-3 md:p-6 outline-none relative z-10 rounded-[inherit] overflow-hidden">
                  <motion.div
                    variants={{
                      idle: { scaleY: 0 },
                      hover: { scaleY: 1 },
                      active: { scaleY: 1 },
                    }}
                    transition={{ duration: 0.5, ease: [0.33, 1, 0.68, 1] }}
                    className="absolute top-0 left-0 w-full h-[calc(100%-32px)] md:h-[calc(100%-70px)] origin-bottom bg-gradient-to-t from-celeste-kore to-celeste-kore/80 pointer-events-none z-0 rounded-t-[inherit]"
                  />
                  <div className="absolute inset-0 rounded-[inherit] border border-slate-200 dark:border-slate-700 pointer-events-none z-20" />
                  <div className="absolute bottom-0 left-0 w-full h-8 md:h-[70px] flex justify-center items-center z-10">
                    <motion.span
                      variants={{
                        idle: { opacity: 0, y: 16 },
                        hover: { opacity: 1, y: 0 },
                        active: { opacity: 1, y: 0 },
                      }}
                      className="flex items-center gap-2 font-black uppercase text-xs tracking-[0.25em] transition-colors duration-500 text-slate-900 dark:text-white"
                    >
                      {isActive
                        ? "Toca de nuevo para entrar"
                        : "Haz click para entrar"}
                    </motion.span>
                  </div>
                  <motion.div
                    className={[
                      "w-full h-full flex relative z-10",
                      "flex-row items-center justify-start px-4 gap-4",
                      isWide 
                        ? "md:flex-row md:px-10 lg:px-14 md:gap-8" 
                        : "md:flex-col md:justify-center md:px-0 md:gap-0"
                    ].join(" ")}
                    variants={{
                      idle: { opacity: 1, paddingBottom: isMobile ? 0 : 40 },
                      hover: { opacity: 1, paddingBottom: isMobile ? 32 : 40 },
                      active: { opacity: [1, 0.4, 1], paddingBottom: isMobile ? 32 : 40 },
                    }}
                    transition={{
                      duration: 1.4,
                      repeat: isActive ? Infinity : 0,
                      ease: "easeInOut",
                    }}
                  >
                    <div className={["relative z-10 flex justify-center shrink-0", isWide ? "md:w-auto mb-0" : "md:mb-4"].join(" ")}>
                        <motion.div
                          variants={{
                            idle: { y: 0 },
                            hover: { y: isMobile ? 0 : -16 },
                            active: { y: isMobile ? 0 : -16 },
                          }}
                          className="size-16 md:size-[90px] flex items-center justify-center transition-transform duration-700 relative"
                        >
                          <div className="absolute inset-0 bg-white/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                           <div 
                             className={[
                               "absolute inset-[-6px] md:inset-[-10px] bg-white rounded-2xl border border-slate-200/80 shadow-md transition-all duration-500 -z-10",
                               "opacity-100 scale-100"
                             ].join(" ")}
                           />
                          <AnimatedIcon
                            iconKey={mod.icon}
                            target={`#${mod.id}-card`}
                            className="size-10 md:size-[64px]"
                            speed={1.5}
                            trigger="hover"
                          />
                        </motion.div>
                    </div>
                    <div className={["relative z-10 w-full flex flex-col items-start space-y-1 md:space-y-4 text-left", isWide ? "" : "md:text-center md:items-center"].join(" ")}>
                      <motion.h3
                        variants={{
                          idle: { y: 0 },
                          hover: { y: isMobile ? 0 : -8 },
                          active: { y: isMobile ? 0 : -8 },
                        }}
                        className="text-lg md:text-[1.6rem] lg:text-[1.85rem] font-black tracking-tighter uppercase leading-none w-full break-words transition-colors duration-500"
                      >
                        <span
                          className="text-slate-900 dark:text-white group-hover:text-white transition-colors duration-500"
                          style={{ color: isActive ? "#ffffff" : undefined }}
                        >
                          {mod.title}
                        </span>
                        <br />
                        <span
                          className="text-celeste-kore group-hover:text-white/90 transition-colors duration-500"
                          style={{
                            color: isActive
                              ? "rgba(255,255,255,0.9)"
                              : undefined,
                          }}
                        >
                          {mod.subtitle}
                        </span>
                      </motion.h3>
                      <motion.p
                        variants={{
                          idle: { y: 0 },
                          hover: { y: isMobile ? 0 : -8 },
                          active: { y: isMobile ? 0 : -8 },
                        }}
                        className="text-[11px] md:text-[14px] lg:text-[15px] text-slate-500 dark:text-slate-400 group-hover:text-white/80 font-bold italic leading-tight pr-2 transition-colors duration-500"
                        style={{
                          color: isActive ? "rgba(255,255,255,0.8)" : undefined,
                        }}
                      >
                        {mod.desc}
                      </motion.p>
                    </div>
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
    <div className="relative w-full min-h-screen">
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
        <div className="w-full pt-20 pb-4 relative z-[2]">
          <LogoKoreMobile backgroundEffect="blur" />
        </div>
        <div className="w-full px-4 pt-4 pb-20">{renderCardsGrid()}</div>
      </div>

      <div className="hidden md:block relative w-full min-h-screen">
        <motion.div
          className="fixed top-0 left-0 w-full h-[22vh] flex justify-center items-center z-[5] pt-10"
          style={{ y: logoY, opacity: logoOpacity }}
        >
          <div className="relative flex justify-center items-center px-8">
            <LogoKore />
          </div>
        </motion.div>

        <div className="relative z-10 w-full mt-[22vh]">
          <div className="w-full min-h-screen bg-transparent px-8 lg:px-12 pt-10 pb-20">
            <div className="w-full max-w-[1400px] mx-auto">
              {renderCardsGrid()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

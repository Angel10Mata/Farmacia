"use client";

import { useState, useEffect } from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useSpring,
} from "framer-motion";
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
    icon: "gsqxdxog", // Back to the very first icon ID
    href: "/kore/proyectos",
    allowedRoles: ["super", "admin", "proyectos"],
  },
  {
    id: "perfil",
    title: "Gestión de",
    subtitle: "Mi Perfil",
    desc: "Actualización de credenciales y datos personales del usuario.",
    icon: "btgcyfug",
    href: "/kore/perfil",
  },
  {
    id: "dispositivos",
    title: "Gestión de",
    subtitle: "Dispositivos",
    desc: "Administración de dispositivos autorizados y configuración de llaves de acceso.",
    icon: "gzqipvbr",
    href: "/kore/admin/dispositivos",
    requiresAdmin: true,
  },
  {
    id: "usuarios",
    title: "Gestión de",
    subtitle: "Usuarios",
    desc: "Control absoluto de perfiles, permisos y acceso al sistema.",
    icon: "vxfekxur",
    href: "/kore/admin/usuarios",
    requiresAdmin: true,
  },
  {
    id: "configuracion",
    title: "Ajustes",
    subtitle: "Avanzados",
    desc: "Configuración y auditoría de variables del entorno Kore.",
    icon: "plusmrxr",
    href: "/kore/admin/configuraciones",
    requiresAdmin: true,
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
  // Zoom sutil y suavizado
  const bgScaleRaw = useTransform(scrollY, [0, 800], [1, 1.05]);
  const bgScale = useSpring(bgScaleRaw, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

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
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 w-full">
      {visibleModules.map((mod, index) => {
        const isActive = isMobile && activeId === mod.id;
        const isFirstMobile = isMobile && index === 0;

        return (
          <motion.div
            key={mod.id}
            className={[
              "cursor-pointer w-full h-auto min-h-[400px] lg:h-[380px] relative",
            ]
              .join(" ")
              .trim()}
            id={`${mod.id}-card`}
            initial="idle"
            whileHover="hover"
            animate={isActive ? "active" : "idle"}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            {mod.id === "perfil" ? (
              <div className="group flex flex-col border border-red-500 dark:border-white/40 overflow-hidden h-full w-full rounded-2xl bg-white dark:bg-[#111] transition-all duration-500 hover:border-red-600 dark:hover:border-white hover:shadow-lg hover:shadow-red-600/10 dark:hover:shadow-white/10">
                <AnimatePresence mode="wait">
                  {expandedPerfil ? (
                    <motion.div
                      key="perfil-expanded"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4, ease: "easeInOut" }}
                      className="w-full h-full min-h-[300px] flex flex-col justify-center items-center p-6 relative z-10 bg-transparent rounded-[inherit] overflow-hidden"
                    >
                      <div className="absolute top-0 left-0 w-full h-[calc(100%-70px)] bg-gradient-to-t from-celeste-kore to-celeste-kore/80 pointer-events-none z-0 rounded-t-[inherit]" />
                      <button
                        onClick={() => setExpandedPerfil(false)}
                        className="absolute bottom-0 left-0 w-full h-[70px] flex justify-center items-center z-10 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                      >
                        <span className="flex items-center gap-2 text-white font-black uppercase text-xs tracking-[0.25em]">
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
                        className="relative z-10 w-full flex flex-col gap-3 pb-[40px]"
                      >
                        <button
                          onClick={() => setIsProfileOpen(true)}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-white/30 bg-white/15 hover:bg-white/25 transition-all cursor-pointer text-left"
                        >
                          <UserIcon className="size-5 shrink-0 text-white" />
                          <div>
                            <p className="text-sm font-bold text-white">
                              Mi Perfil
                            </p>
                            <p className="text-[10px] text-white/70">
                              Ver y editar perfil
                            </p>
                          </div>
                        </button>
                        <button
                          onClick={() => setIsPasskeysOpen(true)}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-white/30 bg-white/15 hover:bg-white/25 transition-all cursor-pointer text-left"
                        >
                          <div className="flex items-center gap-1 shrink-0">
                            <Fingerprint className="size-4 text-white/80" />
                            <ScanFace className="size-4 text-white/80" />
                            <KeyRound className="size-4 text-white/80" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white">
                              Ingreso Seguro
                            </p>
                            <p className="text-[10px] text-white/70">
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
                      className="w-full h-full min-h-[300px] flex flex-col justify-center items-center p-6 relative z-10 bg-transparent rounded-[inherit] overflow-hidden cursor-pointer"
                    >
                      <div className="absolute top-0 left-0 w-full h-[calc(100%-70px)] origin-bottom scale-y-0 bg-gradient-to-t from-celeste-kore to-celeste-kore/80 transition-transform duration-500 ease-[cubic-bezier(0.33,1,0.68,1)] group-hover:scale-y-100 pointer-events-none z-0 rounded-t-[inherit]" />
                      <div className="absolute bottom-0 left-0 w-full h-[70px] flex justify-center items-center z-10 transition-all duration-500 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0">
                        <span className="flex items-center gap-2 text-celeste-kore dark:text-white font-black uppercase text-xs tracking-[0.25em]">
                          Ver opciones
                        </span>
                      </div>
                      <div className="w-full h-full flex flex-col justify-center items-center relative z-10 pb-[40px]">
                        <div className="relative z-10 w-full flex justify-center mb-4">
                          <div className="size-[90px] flex items-center justify-center transition-transform duration-700 ease-out group-hover:-translate-y-4 relative">
                            <div className="absolute inset-0 bg-white/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <AnimatedIcon
                              iconKey={mod.icon}
                              target={`#${mod.id}-card`}
                              size={90}
                              speed={1.5}
                              trigger="hover"
                            />
                          </div>
                        </div>
                        <div className="relative z-10 w-full flex flex-col items-center text-center space-y-4 transition-transform duration-700 group-hover:-translate-y-2">
                          <h3 className="text-[1.6rem] lg:text-[1.85rem] font-black tracking-tighter text-slate-900 dark:text-white group-hover:text-white uppercase leading-none w-full break-words transition-colors duration-500">
                            {mod.title}
                            <br />
                            <span className="text-celeste-kore group-hover:text-white/90 transition-colors duration-500">
                              {mod.subtitle}
                            </span>
                          </h3>
                          <p className="text-[14px] lg:text-[15px] text-slate-500 dark:text-slate-400 group-hover:text-white/80 font-bold italic leading-tight pr-2 transition-colors duration-500">
                            {mod.desc}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div
                onClick={() => handleCardClick(mod.id, mod.href)}
                className="group flex flex-col border border-red-500 dark:border-white/40 overflow-hidden h-full w-full rounded-2xl transition-all duration-500 cursor-pointer bg-white dark:bg-[#111] hover:border-red-600 dark:hover:border-white hover:shadow-lg hover:shadow-red-600/10 dark:hover:shadow-white/10"
                style={{
                  borderColor: isActive ? "#ef4444" : undefined,
                }}
              >
                <div className="w-full h-full min-h-[300px] flex flex-col justify-center items-center p-6 outline-none relative z-10 rounded-[inherit] overflow-hidden">
                  <motion.div
                    variants={{
                      idle: { scaleY: 0 },
                      hover: { scaleY: 1 },
                      active: { scaleY: 1 },
                    }}
                    transition={{ duration: 0.5, ease: [0.33, 1, 0.68, 1] }}
                    className="absolute top-0 left-0 w-full h-[calc(100%-70px)] origin-bottom bg-gradient-to-t from-celeste-kore to-celeste-kore/80 pointer-events-none z-0 rounded-t-[inherit]"
                  />
                  <div className="absolute inset-0 rounded-[inherit] border border-slate-200 dark:border-slate-700 pointer-events-none z-20" />
                  <div className="absolute bottom-0 left-0 w-full h-[70px] flex justify-center items-center z-10">
                    <motion.span
                      variants={{
                        idle: { opacity: 0, y: 16 },
                        hover: { opacity: 1, y: 0 },
                        active: { opacity: 1, y: 0 },
                      }}
                      className={[
                        "flex items-center gap-2 font-black uppercase text-xs tracking-[0.25em] transition-colors duration-500",
                        isActive
                          ? "text-celeste-kore"
                          : "text-celeste-kore dark:text-white",
                      ].join(" ")}
                    >
                      {isActive
                        ? "Toca de nuevo para entrar"
                        : "Haz click para entrar"}
                    </motion.span>
                  </div>
                  <motion.div
                    className="w-full h-full flex flex-col justify-center items-center relative z-10 pb-[40px]"
                    variants={{
                      idle: { opacity: 1 },
                      hover: { opacity: 1 },
                      active: { opacity: [1, 0.4, 1] },
                    }}
                    transition={{
                      duration: 1.4,
                      repeat: isActive ? Infinity : 0,
                      ease: "easeInOut",
                    }}
                  >
                    <div className="relative z-10 w-full flex justify-center mb-4">
                        <motion.div
                          variants={{
                            idle: { y: 0 },
                            hover: { y: -16 },
                            active: { y: -16 },
                          }}
                          className="size-[90px] flex items-center justify-center transition-transform duration-700 relative"
                        >
                          <div className="absolute inset-0 bg-white/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                          <AnimatedIcon
                            iconKey={mod.icon}
                            target={`#${mod.id}-card`}
                            size={90}
                            speed={1.5}
                            trigger="hover"
                          />
                        </motion.div>
                    </div>
                    <div className="relative z-10 w-full flex flex-col items-center text-center space-y-4">
                      <motion.h3
                        variants={{
                          idle: { y: 0 },
                          hover: { y: -8 },
                          active: { y: -8 },
                        }}
                        className="text-[1.6rem] lg:text-[1.85rem] font-black tracking-tighter uppercase leading-none w-full break-words transition-colors duration-500"
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
                          hover: { y: -8 },
                          active: { y: -8 },
                        }}
                        className="text-[14px] lg:text-[15px] text-slate-500 dark:text-slate-400 group-hover:text-white/80 font-bold italic leading-tight pr-2 transition-colors duration-500"
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

      <div className="flex flex-col md:hidden w-full bg-white dark:bg-black">
        <div className="w-full pt-20 pb-4 relative z-[2]">
          <LogoKoreMobile backgroundEffect="blur" />
        </div>

        <div className="w-full overflow-hidden">
          <motion.img
            src="/kore/hero-background2.jpg"
            alt="Plan Kore"
            style={{
              y: useTransform(scrollY, [0, 800], [0, 150]),
              scale: bgScale,
            }}
            className="w-full h-auto object-contain hidden dark:block origin-center"
          />
        </div>

        <div className="w-full px-4 pt-8 pb-20">{renderCardsGrid()}</div>
      </div>

      <div className="hidden md:block relative w-full min-h-screen">
        <div className="fixed top-0 left-0 w-full h-[22vh] z-0 bg-white dark:bg-black overflow-hidden">
          <motion.div
            className="absolute inset-0 bg-cover bg-center origin-center hidden dark:block"
            style={{
              backgroundImage: "url('/kore/hero-background2.jpg')",
              scale: bgScale,
            }}
          />
        </div>

        <motion.div
          className="fixed top-0 left-0 w-full h-[22vh] flex justify-center items-center z-[5] pt-10"
          style={{ y: logoY, opacity: logoOpacity }}
        >
          <div className="relative flex justify-center items-center px-8">
            <LogoKore />
          </div>
        </motion.div>

        <div className="relative z-10 w-full mt-[22vh]">
          <div className="w-full min-h-screen bg-white dark:bg-black px-8 lg:px-12 pt-10 pb-20">
            <div className="w-full max-w-[1400px] mx-auto">
              {renderCardsGrid()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

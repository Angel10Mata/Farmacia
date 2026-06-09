"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@/components/(base)/providers/UserProvider";
import { BreadcrumbNav } from "@/components/ui/breadcrumb-nav";
import { Menu as MenuIcon, X, RefreshCw } from "lucide-react";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import Menu from "./Menu";
import { getPendingDevicesCount } from "@/components/(Kore)/admin/lib/actions";
import { createPortal } from "react-dom";
import AnimacionLogoKore from "@/components/(Kore)/logo/AnimacionLogoKore";

export default function Header() {
  const user = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [pendingDevices, setPendingDevices] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const isRoot = pathname === "/kore";

  const metadata = user?.user_metadata || {};
  const role = metadata.rol || user?.role || "user";
  const canManage = ["super", "admin"].includes(role);

  useEffect(() => {
    const init = async () => {
      setMounted(true);
      if (!canManage) return;
      const c = await getPendingDevicesCount();
      setPendingDevices(c ?? 0);
    };
    init();
  }, [canManage]);

  const handleLogoClick = (e: React.MouseEvent) => {
    // Prevent default navigation to show the animation instead
    e.preventDefault();
    setIsFullScreen(true);
  };

  return (
    <>
      <header className="w-full fixed top-0 left-0 transition-all bg-white dark:bg-background border-b border-border/40 z-[100] shadow-sm">
        <div className="mx-auto flex h-14 md:h-16 items-center justify-between px-4 md:px-8 gap-4">
          <div className="flex items-center h-full">
            <div className="flex items-center shrink-0">
              <Link
                href={user ? "/kore" : "/"}
                onClick={handleLogoClick}
                className="flex flex-row items-center shrink-0 group gap-1 md:gap-1.5 cursor-pointer"
              >
                <motion.img 
                  src="/kore/kore.png"
                  alt="KORE"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="h-6 md:h-8 w-auto object-contain transition-transform duration-300 group-hover:scale-105 origin-left"
                />
                <motion.div 
                  initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
                  animate={{ opacity: 1, clipPath: "inset(0 0 0 0)" }}
                  transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 1, 0.5, 1] }}
                  translate="no"
                  className="notranslate text-xs md:text-sm font-black uppercase tracking-widest leading-[1.15] md:leading-[1.15] text-celeste-kore border-l border-border/60 pl-2 md:pl-3 transition-transform duration-300 group-hover:scale-[1.02] origin-left group-hover:text-white dark:group-hover:text-[#FFFDD0]"
                >
                  BMS
                </motion.div>
              </Link>
            </div>
            {user && (
              <div className="hidden md:flex ml-4 md:ml-6 border-l border-border/30 h-10 items-center pl-4 md:pl-6">
                <BreadcrumbNav />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <AnimatedThemeToggler />
            <button
              id="refresh-btn"
              onClick={() => window.location.reload()}
              className="flex items-center justify-center text-black hover:text-celeste-kore dark:text-white dark:hover:text-celeste-kore cursor-pointer transition-all hover:rotate-180 duration-500 active:scale-95"
            >
              <RefreshCw className="size-5 md:size-6" />
            </button>
            <div className="relative ml-2">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-center text-foreground hover:text-foreground/80 cursor-pointer transition-all active:scale-95"
              >
                <AnimatePresence mode="wait" initial={false}>
                  {isOpen ? (
                    <motion.div
                      key="close"
                      initial={{ opacity: 0, rotate: -90, scale: 0.8 }}
                      animate={{ opacity: 1, rotate: 0, scale: 1 }}
                      exit={{ opacity: 0, rotate: 90, scale: 0.8 }}
                      transition={{ duration: 0.2 }}
                    >
                      <X className="size-6 md:size-8" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="menu"
                      initial={{ opacity: 0, rotate: 90, scale: 0.8 }}
                      animate={{ opacity: 1, rotate: 0, scale: 1 }}
                      exit={{ opacity: 0, rotate: -90, scale: 0.8 }}
                      transition={{ duration: 0.2 }}
                    >
                      <MenuIcon className="size-6 md:size-8" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
              {!isOpen && canManage && pendingDevices > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-celeste-kore text-[10px] font-bold text-white animate-pulse pointer-events-none">
                  {pendingDevices}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {user && !isRoot && (
        <div className="fixed top-14 left-0 md:hidden w-full px-6 py-3 border-b border-border/40 bg-white dark:bg-background z-[99]">
          <BreadcrumbNav />
        </div>
      )}

      <Menu isOpen={isOpen} setIsOpen={setIsOpen} user={user} />

      {mounted && createPortal(
        <AnimacionLogoKore isOpen={isFullScreen} onClose={() => setIsFullScreen(false)} />,
        document.body
      )}
    </>
  );
}

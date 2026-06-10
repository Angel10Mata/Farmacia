"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

interface AnimacionLogoKoreProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AnimacionLogoKore({ isOpen, onClose }: AnimacionLogoKoreProps) {
  const [lang, setLang] = useState<"en" | "es">("en");
  const [displayedText, setDisplayedText] = useState("");

  const targetText = lang === "en"
    ? "Business Management Suite"
    : "Sistema de Gestión empresarial";

  useEffect(() => {
    if (!isOpen) {
      setDisplayedText("");
      return;
    }
    let index = 0;
    setDisplayedText("");
    const interval = setInterval(() => {
      const char = targetText.charAt(index);
      setDisplayedText((prev) => prev + char);
      index++;
      if (index >= targetText.length) clearInterval(interval);
    }, 45);
    return () => clearInterval(interval);
  }, [targetText, isOpen]);

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          key="fullscreen-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[1000000] flex items-center justify-center bg-white/70 dark:bg-background/80 backdrop-blur-[20px] cursor-pointer p-4 lg:p-12 overflow-hidden"
          style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh" }}
        >
          {/* Close button */}
          <motion.button
            initial={{ opacity: 0, rotate: -90 }}
            animate={{ opacity: 1, rotate: 0 }}
            className="absolute top-8 right-8 p-3 rounded-full bg-black/10 dark:bg-white/10 text-black dark:text-white hover:bg-black/20 dark:hover:bg-white/20 transition-colors z-20"
            onClick={(e) => { e.stopPropagation(); onClose(); }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </motion.button>

          {/* Content — vertical layout matching the dashboard logo */}
          <motion.div
            initial={{ scale: 1.15, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
            className="w-full h-full flex items-center justify-center pointer-events-none"
          >
            <div
              onClick={(e) => {
                e.stopPropagation();
                setLang((prev) => (prev === "en" ? "es" : "en"));
              }}
              className="pointer-events-auto flex flex-col items-center justify-center gap-0 cursor-pointer select-none"
            >
              {/* KORE logo — big */}
              <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.88 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 55, damping: 16, duration: 1.6 }}
                className="flex-shrink-0"
              >
                <Image
                  src="/kore/kore.png"
                  alt="KoreAPP"
                  width={320}
                  height={320}
                  className="w-[200px] sm:w-[260px] lg:w-[320px] h-auto object-contain rounded-3xl"
                  priority
                />
              </motion.div>

              {/* Text block — below logo */}
              <div className="flex flex-col items-center mt-5 gap-1 w-full px-4">
                {/* BMS — sweeps in */}
                <motion.span
                  initial={{ opacity: 0, x: -40, clipPath: "inset(0 100% 0 0)" }}
                  animate={{ opacity: 1, x: 0, clipPath: "inset(0 0% 0 0)" }}
                  transition={{ duration: 0.7, delay: 0.3, ease: [0.33, 1, 0.68, 1] as [number, number, number, number] }}
                  translate="no"
                  className="notranslate text-base sm:text-lg lg:text-xl font-black uppercase tracking-[0.45em] text-celeste-kore"
                >
                  BMS
                </motion.span>

                {/* Divider line — grows from left */}
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.9, delay: 0.5, ease: "easeInOut" }}
                  className="w-full max-w-[280px] h-px bg-white/30 my-2"
                  style={{ originX: 0 }}
                />

                {/* Business Management Suite — typewriter effect */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.7 }}
                  className="text-[11px] sm:text-xs lg:text-sm font-bold uppercase tracking-[0.3em] text-white/50 h-5 flex items-center gap-0.5"
                >
                  {displayedText}
                  <span className="inline-block w-[1.5px] h-3 bg-celeste-kore animate-pulse" />
                </motion.div>
              </div>

              {/* Lang toggle hint */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                className="mt-6 text-[9px] uppercase tracking-[0.3em] text-white/20 dark:text-white/20"
              >
                Toca para cambiar idioma
              </motion.p>
            </div>
          </motion.div>

          {/* Close hint */}
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 text-black/60 dark:text-white/40 text-[10px] font-black tracking-[0.5em] uppercase pointer-events-none animate-bounce">
            Click en cualquier lugar para cerrar
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

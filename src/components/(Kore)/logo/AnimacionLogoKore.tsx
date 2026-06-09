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
      if (index >= targetText.length) {
        clearInterval(interval);
      }
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
          style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh' }}
        >
          <motion.button
            initial={{ opacity: 0, rotate: -90 }}
            animate={{ opacity: 1, rotate: 0 }}
            className="absolute top-8 right-8 p-3 rounded-full bg-black/10 dark:bg-white/10 text-black dark:text-white hover:bg-black/20 dark:hover:bg-white/20 transition-colors z-20"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </motion.button>

          <motion.div
            initial={{ scale: 1.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.7, opacity: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="w-full h-full flex items-center justify-center pointer-events-none"
          >
            <div 
              onClick={(e) => {
                e.stopPropagation();
                setLang((prev) => (prev === "en" ? "es" : "en"));
              }}
              className="pointer-events-auto flex flex-row items-center justify-center gap-4 sm:gap-6 lg:gap-8 w-fit px-4 sm:px-8 cursor-pointer select-none"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 50, damping: 16, duration: 2.4 }}
                className="flex-shrink-0"
              >
                <Image
                  src="/kore/kore.png"
                  alt="KoreAPP"
                  width={250}
                  height={250}
                  className="w-[120px] lg:w-[250px] h-auto object-contain rounded-3xl"
                  priority
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ staggerChildren: 0.12, delayChildren: 0.05 }}
                className="flex flex-col items-start justify-center py-2 relative shrink-0"
              >

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  translate="no"
                  className="notranslate text-xs md:text-sm font-black uppercase tracking-widest leading-[1.15] text-celeste-kore mt-2 pl-1"
                >
                  BMS
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mt-2 pl-1 h-4 flex items-center gap-0.5"
                >
                  {displayedText}
                  <span className="inline-block w-[1.5px] h-3 bg-celeste-kore animate-pulse" />
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
          
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 text-black/60 dark:text-white/40 text-[10px] font-black tracking-[0.5em] uppercase pointer-events-none animate-bounce">
            Click en cualquier lugar para cerrar
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

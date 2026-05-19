"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

interface AnimacionLogoKoreProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AnimacionLogoKore({ isOpen, onClose }: AnimacionLogoKoreProps) {
  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          key="fullscreen-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[1000000] flex items-center justify-center bg-white/70 dark:bg-black/80 backdrop-blur-[20px] cursor-pointer p-4 lg:p-12 overflow-hidden"
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
            <div className="pointer-events-auto flex flex-row items-center justify-center gap-4 sm:gap-6 lg:gap-8 w-fit px-4 sm:px-8">
              <motion.div
                initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 50, damping: 16, duration: 2.4 }}
                className="flex-shrink-0"
              >
                <Image
                  src="/kore/logo.png"
                  alt="Kore"
                  width={250}
                  height={250}
                  className="w-[120px] lg:w-[250px] h-auto object-contain"
                  priority
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ staggerChildren: 0.12, delayChildren: 0.05 }}
                className="flex flex-col items-center justify-center text-center py-2 relative shrink-0"
              >
                <motion.h1
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ type: "spring", stiffness: 40, damping: 18, duration: 1.3 }}
                  translate="no"
                  className="notranslate font-black whitespace-nowrap text-black dark:text-white leading-[0.95]"
                  style={{ fontFamily: "'Arial Black', sans-serif", fontSize: "clamp(2rem, 6vw, 5rem)" }}
                >
                  Kore
                </motion.h1>


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

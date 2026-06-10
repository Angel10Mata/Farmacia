"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { createPortal } from "react-dom";
import Image from "next/image";
import AnimacionLogoKore from "./AnimacionLogoKore";

interface LogoKoreProps {
  scale?: number;
  noAnimation?: boolean;
  backgroundEffect?: "blur" | "glow" | "none";
}

export default function LogoKore({
  noAnimation = false,
  backgroundEffect = "blur",
}: LogoKoreProps) {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!noAnimation) setIsFullScreen(true);
  };

  // — Sweep animation variants —
  const containerVariants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: 0.15, delayChildren: 0.1 },
    },
  };

  const logoVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.88 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: "spring" as const, stiffness: 55, damping: 16, duration: 1.6 },
    },
  };

  const sweepVariants = {
    hidden: { opacity: 0, x: -40, clipPath: "inset(0 100% 0 0)" },
    visible: {
      opacity: 1,
      x: 0,
      clipPath: "inset(0 0% 0 0)",
      transition: { duration: 0.7, ease: [0.33, 1, 0.68, 1] as [number, number, number, number] },
    },
  };

  const lineVariants = {
    hidden: { scaleX: 0, originX: 0 },
    visible: {
      scaleX: 1,
      transition: { duration: 0.9, ease: "easeInOut" as const },
    },
  };

  const suiteVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" as const },
    },
  };

  return (
    <>
      <motion.div
        onClick={handleClick}
        whileTap={{ scale: 0.97 }}
        className="relative select-none cursor-pointer flex flex-col items-center justify-center gap-0 w-full"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Logo image — big */}
        <motion.div variants={logoVariants} className="flex-shrink-0">
          <Image
            src="/kore/kore.png"
            alt="KoreAPP"
            width={220}
            height={220}
            className="w-[160px] sm:w-[200px] lg:w-[220px] h-auto object-contain rounded-3xl"
            priority
          />
        </motion.div>

        {/* Text block — below logo */}
        <div className="flex flex-col items-center mt-4 gap-1 w-full px-2">
          {/* BMS — sweeps in left to right */}
          <motion.span
            variants={sweepVariants}
            translate="no"
            className="notranslate text-sm sm:text-base font-black uppercase tracking-[0.35em] text-celeste-kore"
          >
            BMS
          </motion.span>

          {/* Divider line — grows from left */}
          <motion.div
            variants={lineVariants}
            className="w-full max-w-[200px] h-px bg-white/30 my-1"
            style={{ originX: 0 }}
          />

          {/* Business Management Suite */}
          <motion.span
            variants={suiteVariants}
            className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.3em] text-white/50"
          >
            Business Management Suite
          </motion.span>
        </div>
      </motion.div>

      {mounted &&
        createPortal(
          <AnimacionLogoKore
            isOpen={isFullScreen}
            onClose={() => setIsFullScreen(false)}
          />,
          document.body
        )}
    </>
  );
}

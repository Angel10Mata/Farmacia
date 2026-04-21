"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { createPortal } from "react-dom";
import Image from "next/image";
import AnimacionLogoTrifinio from "./AnimacionLogoTrifinio";

interface LogoTrifinioProps {
  scale?: number;
  noAnimation?: boolean;
  refreshInterval?: number;
  backgroundEffect?: "blur" | "glow" | "none";
}

export default function LogoTrifinio({
  scale: scaleValue = 1,
  noAnimation = false,
  refreshInterval = 0,
  backgroundEffect = "blur",
}: LogoTrifinioProps) {
  const [animationKey, setAnimationKey] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleHover = () => {
    if (!noAnimation && !isFullScreen) {
      setAnimationKey(prev => prev + 1);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!noAnimation) {
      setIsFullScreen(true);
    }
  };

  const repeatConfig = refreshInterval > 0 && !isFullScreen ? {
    repeat: Infinity,
    repeatDelay: refreshInterval,
    repeatType: "loop" as const
  } : {};

  const textContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.12, delayChildren: 0.05 },
    },
  };

  const logoVariants = {
    hidden: { opacity: 0, scale: 0.8, rotate: -5 },
    visible: {
      opacity: 1, scale: 1, rotate: 0,
      transition: { type: "spring" as const, stiffness: 50, damping: 16, duration: 2.4 },
    },
  };

  const titleVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1, x: 0,
      transition: { type: "spring" as const, stiffness: 40, damping: 18, duration: 1.3, ...repeatConfig },
    },
  };

  const sloganVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1, y: 0,
      transition: { type: "spring" as const, stiffness: 50, damping: 16, duration: 1.1, ...repeatConfig },
    },
  };

  const lineVariants = {
    hidden: { scaleX: 0 },
    visible: {
      scaleX: 1,
      transition: { duration: 1.2, ease: "easeInOut" as const, ...repeatConfig },
    },
  };

  const countriesVariants = {
    hidden: { opacity: 0, y: 5 },
    visible: {
      opacity: 1, y: 0,
      transition: { duration: 0.3, ease: "easeOut" as const, ...repeatConfig },
    },
  };

  return (
    <>
      <motion.div
        onMouseEnter={handleHover}
        onClick={handleClick}
        whileTap={{ scale: 0.96 }}
        className="relative select-none cursor-pointer flex items-center justify-center p-2 w-full"
        style={{ scale: scaleValue }}
        initial="hidden"
        animate="visible"
      >
        {backgroundEffect === "blur" && (
          <div className="absolute inset-x-[-25px] lg:inset-x-[-40px] inset-y-[-15px] lg:inset-y-[-25px] bg-white/55 dark:bg-white/10 backdrop-blur-md border border-white/50 dark:border-white/10 rounded-2xl -z-10 shadow-xl" />
        )}
        
        {backgroundEffect === "glow" && (
          <div className="absolute inset-x-[-20%] inset-y-[-10%] bg-white/50 dark:bg-transparent blur-[60px] -z-10 rounded-[100px]" />
        )}

        <div className="flex flex-row items-center justify-center gap-6 lg:gap-10 w-full px-4 lg:px-8">
          <motion.div variants={logoVariants} className="flex-shrink-0">
            <Image
              src="/trifinio/logo.png"
              alt="Plan Trifinio"
              width={150}
              height={150}
              className="w-[120px] lg:w-[150px] h-auto object-contain"
              priority
            />
          </motion.div>

          <motion.div
            key={animationKey}
            variants={textContainerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center justify-center text-center py-2 relative"
          >
            <motion.h1
              variants={titleVariants}
              className="font-black whitespace-nowrap text-azul-trifinio dark:text-white leading-[0.95]"
              style={{ fontFamily: "'Arial Black', sans-serif", fontSize: "clamp(1.5rem, 3.5vw, 2.8rem)" }}
            >
              Plan Trifinio
            </motion.h1>

            <motion.p
              variants={sloganVariants}
              className="font-bold italic mt-1 text-azul-trifinio dark:text-white leading-tight"
              style={{ fontFamily: "Arial, sans-serif", fontSize: "clamp(1rem, 2.2vw, 1.8rem)" }}
            >
              &ldquo;Agua sin fronteras&rdquo;
            </motion.p>

            <motion.div
              variants={lineVariants}
              className="w-full h-[2px] mt-2 bg-azul-trifinio dark:bg-white origin-center"
            />

            <motion.p
              variants={countriesVariants}
              className="font-semibold mt-2 text-azul-trifinio dark:text-white"
              style={{ fontFamily: "Arial, sans-serif", fontSize: "clamp(0.5rem, 1.1vw, 0.9rem)", letterSpacing: "0.22em" }}
            >
              El Salvador&ensp;•&ensp;Guatemala&ensp;•&ensp;Honduras
            </motion.p>
          </motion.div>
        </div>
      </motion.div>

      {mounted && createPortal(
        <AnimacionLogoTrifinio isOpen={isFullScreen} onClose={() => setIsFullScreen(false)} />,
        document.body
      )}
    </>
  );
}

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { createPortal } from "react-dom";
import Image from "next/image";
import AnimacionLogoKore from "./AnimacionLogoKore";

interface LogoKoreProps {
  scale?: number;
  noAnimation?: boolean;
  refreshInterval?: number;
  backgroundEffect?: "blur" | "glow" | "none";
}

export default function LogoKore({
  scale: scaleValue = 1,
  noAnimation = false,
  refreshInterval = 0,
  backgroundEffect = "blur",
}: LogoKoreProps) {
  const [animationKey, setAnimationKey] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const init = async () => setMounted(true);
    init();
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
        <div className="flex flex-row items-center justify-center gap-6 lg:gap-10 w-full px-4 lg:px-8">
          <motion.div variants={logoVariants} className="flex-shrink-0">
            <Image
              src="/kore/logo.png"
              alt="Plan Kore"
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
              className="font-black whitespace-nowrap text-black dark:text-white leading-[0.95] translate-y-[3px]"
              style={{ fontFamily: "'Arial Black', sans-serif", fontSize: "clamp(1.5rem, 3.5vw, 2.8rem)" }}
            >
              Kore
            </motion.h1>
          </motion.div>
        </div>
      </motion.div>

      {mounted && createPortal(
        <AnimacionLogoKore isOpen={isFullScreen} onClose={() => setIsFullScreen(false)} />,
        document.body
      )}
    </>
  );
}

"use client";

import { useState, useEffect } from "react";

interface AnimatedIconProps {
  iconKey: string;
  className?: string;
  target?: string;
  delay?: string | number;
  speed?: string | number;
  primaryColor?: string;
  secondaryColor?: string;
}

export default function AnimatedIcon({
  iconKey,
  className = "w-24 h-24",
  target,
  delay = 0,
  speed = 2,
  primaryColor,
  secondaryColor,
}: AnimatedIconProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className={className} />;

  const colors = [];
  if (primaryColor) colors.push(`primary:${primaryColor}`);
  if (secondaryColor) colors.push(`secondary:${secondaryColor}`);

  return (
    <div className={className}>
      {/* @ts-ignore */}
      <lord-icon
        src={`https://cdn.lordicon.com/${iconKey}.json`}
        trigger="hover"
        target={target}
        delay={delay}
        speed={speed}
        colors={colors.length > 0 ? colors.join(",") : undefined}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}

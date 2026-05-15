"use client";

import { useState, useEffect } from "react";

interface AnimatedIconProps {
  iconKey: string;
  className?: string;
  size?: string | number;
  target?: string;
  delay?: string | number;
  speed?: string | number;
  primaryColor?: string;
  secondaryColor?: string;
  trigger?: "hover" | "loop" | "morph" | "click" | "hover-loop" | "loop-on-hover";
}

export default function AnimatedIcon({
  iconKey,
  className,
  size = "100%",
  target,
  delay = 0,
  speed = 2,
  primaryColor,
  secondaryColor,
  trigger = "hover",
}: AnimatedIconProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const mount = () => { setMounted(true); };
    mount();
  }, []);

  if (!mounted) return <div className={className} />;

  const colors = [];
  if (primaryColor) colors.push(`primary:${primaryColor}`);
  if (secondaryColor) colors.push(`secondary:${secondaryColor}`);

  return (
    <div className={className} style={{ width: size, height: size }}>
      {/* @ts-expect-error -- lord-icon is a custom web component */}
      <lord-icon
        src={`https://cdn.lordicon.com/${iconKey}.json`}
        trigger={trigger}
        target={target}
        delay={delay}
        speed={speed}
        colors={colors.length > 0 ? colors.join(",") : undefined}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}

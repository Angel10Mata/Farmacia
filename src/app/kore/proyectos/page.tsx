"use client";

import { motion } from "framer-motion";
import { useUserContext } from "@/components/(base)/providers/UserProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import DashboardProyectos from "@/components/(Kore)/proyectos/DashboardProyectos";

export default function ProyectosPage() {
  const { effectiveRole } = useUserContext();
  const router = useRouter();

  useEffect(() => {
    if (!["super", "admin", "proyectos"].includes(effectiveRole)) {
      router.replace("/kore");
    }
  }, [effectiveRole, router]);

  return (
    <div className="flex-1 overflow-auto bg-background p-4 pt-28 md:p-8 md:pt-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full space-y-6"
      >
        <DashboardProyectos role={effectiveRole} />
      </motion.div>
    </div>
  );
}

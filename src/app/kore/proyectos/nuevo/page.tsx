"use client";

import { motion } from "framer-motion";
import { useUserContext } from "@/components/(base)/providers/UserProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import ProyectoForm from "@/components/(Kore)/proyectos/ProyectoForm";

export default function NuevoProyectoPage() {
  const { effectiveRole } = useUserContext();
  const router = useRouter();

  useEffect(() => {
    if (!["super", "admin", "proyectos"].includes(effectiveRole)) {
      router.replace("/kore");
    }
  }, [effectiveRole, router]);

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 pt-28 md:p-8 md:pt-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full"
      >
        <ProyectoForm />
      </motion.div>
    </div>
  );
}

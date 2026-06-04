"use client";

import { motion } from "framer-motion";
import { useUserContext } from "@/components/(base)/providers/UserProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import ClientesDashboard from "@/components/(Kore)/proyectos/ClientesDashboard";

export default function ClientesPage() {
  const { effectiveRole } = useUserContext();
  const router = useRouter();

  useEffect(() => {
    if (!["super", "admin", "proyectos"].includes(effectiveRole)) {
      router.replace("/kore");
    }
  }, [effectiveRole, router]);

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 pt-28 md:p-8 md:pt-24 bg-transparent min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full space-y-6 animate-fade-in"
      >
        <ClientesDashboard />
      </motion.div>
    </div>
  );
}

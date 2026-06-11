"use client";

import { motion } from "framer-motion";
import { useUserContext } from "@/components/(base)/providers/UserProvider";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import ProyectoDetalle from "@/components/(Kore)/proyectos/ProyectoDetalle";
import { getProyectos } from "@/app/kore/proyectos/actions";

export default function ProyectoDetallePage() {
  const { effectiveRole } = useUserContext();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [proyecto, setProyecto] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!["super", "admin", "proyectos"].includes(effectiveRole)) {
      router.replace("/kore");
    }
  }, [effectiveRole, router]);

  useEffect(() => {
    if (!id) return;
    const fetchProyecto = async () => {
      setLoading(true);
      try {
        const data = await getProyectos();
        const found = data.find((p: any) => p.id === id);
        if (found) {
          setProyecto(found);
        } else {
          setNotFound(true);
        }
      } catch (err) {
        console.error("Error fetching proyecto:", err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchProyecto();
  }, [id]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 pt-32 md:p-8 md:pt-24">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <RefreshCw size={32} className="animate-spin text-celeste-kore" />
          <p className="text-sm font-bold uppercase tracking-widest">Cargando detalles…</p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 pt-32 md:p-8 md:pt-24">
        <div className="text-center space-y-3">
          <p className="text-lg font-black text-foreground">Proyecto no encontrado</p>
          <p className="text-sm text-muted-foreground">El proyecto que buscas no existe o fue eliminado.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 pt-32 md:p-8 md:pt-24 bg-transparent">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full"
      >
        <ProyectoDetalle proyecto={proyecto} />
      </motion.div>
    </div>
  );
}

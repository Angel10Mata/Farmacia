"use client";

import { useEffect, useState } from "react";
import Stats from "./stats";
import AnimatedIcon from "@/components/ui/AnimatedIcon";
import { getVentas } from "@/components/(LaArada)/ventas/lib/actions";

export default function Estadisticas() {
  const [ventas, setVentas] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchVentas = async () => {
      try {
        const data = await getVentas();
        setVentas(data || []);
      } catch (error) {
        console.error("Error al obtener ventas:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVentas();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 mx-auto w-full pb-20 p-6 md:p-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b pb-8 border-border/50">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-foreground uppercase tracking-tight">
              Análisis de Operaciones
            </h1>
            <p className="text-muted-foreground font-medium italic">
              Visualización detallada de ingresos y rendimiento
            </p>
          </div>
        </div>
      </div>

      <Stats orders={ventas} />
    </div>
  );
}

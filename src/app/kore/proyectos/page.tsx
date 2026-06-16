import { Suspense } from "react";
import DashboardProyectos from "@/components/(Kore)/proyectos/DashboardProyectos/DashboardProyectos";

export default function ProyectosPage() {
  return (
    <Suspense>
      <DashboardProyectos />
    </Suspense>
  );
}

import { Suspense } from "react";
import DashboardProyectos from "@/components/(Kore)/proyectos/DashboardProyectos";

export default function ProyectosPage() {
  return (
    <Suspense>
      <DashboardProyectos />
    </Suspense>
  );
}

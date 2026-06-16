import { Suspense } from "react";
import ProyectoForm from "@/components/(Kore)/proyectos/forms/ProyectoForm";

export default function NuevoProyectoPage() {
  return (
    <Suspense>
      <ProyectoForm />
    </Suspense>
  );
}

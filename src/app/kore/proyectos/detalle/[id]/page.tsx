import { Suspense } from "react";
import ProyectoDetalle from "@/components/(Kore)/proyectos/ProyectoDetalle";

export default function ProyectoDetallePage() {
  return (
    <Suspense>
      <ProyectoDetalle />
    </Suspense>
  );
}

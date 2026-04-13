import { Suspense } from "react";
import Estadisticas from "@/components/(LaArada)/estadisticas";

export default function VentasPage() {
  return (
    <Suspense>
      <Estadisticas />
    </Suspense>
  );
}

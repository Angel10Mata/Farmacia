import { Suspense } from "react";
import ListadoVentas from "@/components/(LaArada)/ventas";

export default function VentasPage() {
  return (
    <Suspense>
      <ListadoVentas />
    </Suspense>
  );
}

import { Suspense } from "react";
import ListadoProductos from "@/components/(LaArada)/productos";

export default function ProductosPage() {
  return (
    <Suspense>
      <ListadoProductos />
    </Suspense>
  );
}

import { Suspense } from "react";
import ListadoClientes from "@/components/(LaArada)/clientes";

export default function ClientesPage() {
  return (
    <Suspense>
      <ListadoClientes />
    </Suspense>
  );
}

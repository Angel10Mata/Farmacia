import { Suspense } from "react";
import ClientesDashboard from "@/components/(Kore)/clientes/ClientesDashboard";

export default function ClientesPage() {
  return (
    <Suspense>
      <ClientesDashboard />
    </Suspense>
  );
}

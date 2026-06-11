import { Suspense } from "react";
import ClientesDashboard from "@/components/(Kore)/proyectos/ClientesDashboard";

export default function ClientesPage() {
  return (
    <Suspense>
      <ClientesDashboard />
    </Suspense>
  );
}

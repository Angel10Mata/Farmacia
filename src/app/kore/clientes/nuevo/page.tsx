import { Suspense } from "react";
import ClienteForm from "@/components/(Kore)/clientes/forms/ClienteForm";

export default function NuevoClientePage() {
  return (
    <Suspense>
      <ClienteForm />
    </Suspense>
  );
}

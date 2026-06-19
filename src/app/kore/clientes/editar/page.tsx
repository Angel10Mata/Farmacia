import { Suspense } from "react";
import ClienteForm from "@/components/(Kore)/clientes/forms/ClienteForm";

export default function EditarClientePage() {
  return (
    <Suspense>
      <ClienteForm />
    </Suspense>
  );
}

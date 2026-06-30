"use client";

import { useRouter } from "next/navigation";
import { CrearProducto as CrearProductoForm } from "@/components/(base)/inventario/forms/CrearProducto";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export function CrearProducto() {
  const router = useRouter();

  const handleClose = () => {
    router.push("/kore/inventario");
  };

  const handleSuccess = () => {
    router.push("/kore/inventario");
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-2xl mx-auto">
      <div>
        <Link 
          href="/kore/inventario"
          className="inline-flex items-center gap-1 text-sm font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
        >
          <ChevronLeft className="size-4" />
          Volver a Inventario
        </Link>
      </div>
      
      <CrearProductoForm onClose={handleClose} onSuccess={handleSuccess} />
    </div>
  );
}

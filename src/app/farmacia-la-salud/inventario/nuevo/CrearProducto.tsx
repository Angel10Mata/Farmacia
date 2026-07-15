"use client";

import { useRouter } from "next/navigation";
import { CrearProducto as CrearProductoForm } from "@/components/(base)/inventario/forms/CrearProducto";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink } from "@/components/ui/breadcrumb";

export function CrearProducto() {
  const router = useRouter();

  const handleClose = () => {
    router.push("/farmacia-la-salud/inventario");
  };

  const handleSuccess = () => {
    router.push("/farmacia-la-salud/inventario");
  };

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 md:py-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Breadcrumb>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link 
                href="/farmacia-la-salud/inventario"
                className="inline-flex items-center gap-1 text-sm font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
              >
                <ChevronLeft className="size-4" />
                Volver a Inventario
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>
      </div>
      
      <CrearProductoForm onClose={handleClose} onSuccess={handleSuccess} />
    </div>
  );
}

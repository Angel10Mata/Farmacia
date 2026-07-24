"use client";

import { CrearProducto as CrearProductoForm } from "@/components/(base)/inventario/forms/CrearProducto";
import Link from "next/link";
import { ChevronRight, Home, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function NuevoProductoPage() {
  const router = useRouter();

  return (
    <div className="w-full flex flex-col min-h-screen bg-slate-50/50 dark:bg-zinc-950/50">
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-32 md:pt-24">
        {/* Form Container */}
        <div className="w-full flex justify-center">
          <div className="w-full max-w-3xl">
            <CrearProductoForm 
              onClose={() => router.push("/farmacia-la-salud/inventario")}
              onSuccess={() => router.push("/farmacia-la-salud/inventario")}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { EditarProducto as EditarProductoForm } from "@/components/(base)/inventario/forms/EditarProducto";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import Swal from "sweetalert2";

export default function EditarProductoClient({ id }: { id: string }) {
  const router = useRouter();
  const [producto, setProducto] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProducto = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("inv_productos")
          .select(`
            *,
            inv_proveedores (nombre)
          `)
          .eq("id", id)
          .single();

        if (error) throw error;
        
        if (data) {
          setProducto(data);
        }
      } catch (err: any) {
        console.error("Error al cargar producto:", err);
        Swal.fire({
          title: "Error",
          text: "No se pudo cargar la información del producto.",
          icon: "error",
          confirmButtonColor: "#ef4444"
        }).then(() => {
          router.push("/farmacia-la-salud/inventario");
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchProducto();
    }
  }, [id, router]);

  const handleClose = () => {
    router.push("/farmacia-la-salud/inventario");
  };

  const handleSuccess = () => {
    router.push("/farmacia-la-salud/inventario");
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 w-full max-w-2xl mx-auto items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8DA78E]"></div>
        <p className="text-sm text-slate-500">Cargando datos del producto...</p>
      </div>
    );
  }

  if (!producto) {
    return null; // Will redirect via Swal
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-2xl mx-auto">
      <div>
        <Link 
          href="/farmacia-la-salud/inventario"
          className="inline-flex items-center gap-1 text-sm font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
        >
          <ChevronLeft className="size-4" />
          Volver a Inventario
        </Link>
      </div>
      
      <EditarProductoForm 
        producto={producto}
        onClose={handleClose} 
        onSuccess={handleSuccess} 
      />
    </div>
  );
}

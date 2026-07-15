import { CrearProducto } from "./CrearProducto";

export const metadata = {
  title: "Nuevo Producto | Farmacia Salud",
  description: "Registrar un nuevo producto en el inventario",
};

export default function NuevoProductoPage() {
  return (
    <div className="w-full flex flex-col gap-6 p-4 md:p-6 pt-32 md:pt-24 min-h-screen">
      <CrearProducto />
    </div>
  );
}

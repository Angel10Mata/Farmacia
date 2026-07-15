import EditarProductoClient from "./EditarProductoClient";

export const metadata = {
  title: "Editar Producto | Farmacia Salud",
  description: "Modificar un producto del inventario",
};

export default async function EditarProductoPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return (
    <div className="w-full flex flex-col gap-6 p-4 md:p-6 pt-32 md:pt-24 min-h-screen">
      <EditarProductoClient id={resolvedParams.id} />
    </div>
  );
}

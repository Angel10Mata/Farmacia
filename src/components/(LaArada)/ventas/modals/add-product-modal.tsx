"use client";

import { useEffect, useState, useMemo } from "react";
import { X, Search, Package, AlertCircle } from "lucide-react";
import { ProductoCatalogo, CatalogosData } from "../lib/zod";
import { cn } from "@/lib/utils";

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (product: {
    producto_id: string;
    nombre_producto: string;
    cantidad: number;
    precio_unitario: number;
    subtotal: number;
  }) => void;
  catalogos: CatalogosData | undefined;
}

export default function AddProductModal({
  isOpen,
  onClose,
  onAdd,
  catalogos,
}: AddProductModalProps) {
  const [search, setSearch] = useState("");
  const [selectedProd, setSelectedProd] = useState<ProductoCatalogo | null>(
    null,
  );
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState(0);

  const hasEnoughStock = selectedProd
    ? selectedProd.stock_actual >= quantity
    : true;

  useEffect(() => {
    if (isOpen) {
      setSearch("");
      setSelectedProd(null);
      setQuantity(1);
      setPrice(0);
    }
  }, [isOpen]);

  const filteredProducts = useMemo(() => {
    if (!catalogos?.productos) return [];
    if (!search) return catalogos.productos.slice(0, 5);

    const s = search.toLowerCase();
    return catalogos.productos.filter(
      (p) =>
        p.nombre.toLowerCase().includes(s) ||
        (p.codigo && p.codigo.toLowerCase().includes(s)),
    );
  }, [catalogos, search]);

  const handleSelect = (prod: ProductoCatalogo) => {
    setSelectedProd(prod);
    setPrice(prod.precio_base);
    setSearch(prod.nombre);
  };

  const handleConfirm = () => {
    if (!selectedProd || !hasEnoughStock || quantity < 1) return;
    onAdd({
      producto_id: selectedProd.id,
      nombre_producto: selectedProd.nombre,
      cantidad: quantity,
      precio_unitario: price,
      subtotal: price * quantity,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-zinc-950 border border-border rounded-xl shadow-2xl p-6 space-y-4 text-foreground relative">
        <div className="flex justify-between items-center">
          <h3 className="font-bold flex items-center gap-2 text-primary">
            <Package className="size-5" /> Agregar Producto
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-muted rounded-full cursor-pointer transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="space-y-1 relative">
          <label className="text-xs font-bold uppercase text-muted-foreground">
            Producto (Nombre o Código)
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <input
              autoFocus
              type="text"
              placeholder="Escriba nombre o código..."
              className="w-full h-10 pl-9 pr-3 border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                if (selectedProd && e.target.value !== selectedProd.nombre)
                  setSelectedProd(null);
              }}
            />
          </div>
          {!selectedProd && search.length > 0 && (
            <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-zinc-900 border rounded-lg shadow-xl max-h-48 overflow-y-auto z-50">
              {filteredProducts.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelect(p)}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-muted border-b last:border-0 flex justify-between items-center transition-colors"
                >
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground">
                      {p.nombre}
                    </span>
                    {p.codigo && (
                      <span className="text-[10px] text-primary font-mono uppercase">
                        Cod: {p.codigo}
                      </span>
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-xs px-2 py-0.5 rounded",
                      p.stock_actual <= 0
                        ? "bg-red-500/10 text-red-500"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    Stock: {p.stock_actual}
                  </span>
                </button>
              ))}
              {filteredProducts.length === 0 && (
                <div className="p-3 text-xs text-center text-muted-foreground">
                  Sin coincidencias
                </div>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-muted-foreground">
              Cantidad
            </label>
            <input
              type="number"
              className={cn(
                "w-full h-10 px-3 border rounded-lg bg-background text-sm outline-none font-bold transition-all",
                !hasEnoughStock
                  ? "border-red-500 text-red-500 focus:ring-red-500/20"
                  : "focus:ring-primary/20",
              )}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
            />
            {selectedProd && (
              <div className="mt-1 flex flex-col gap-0.5">
                <span
                  className={cn(
                    "text-[10px] font-bold uppercase",
                    hasEnoughStock
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-red-500",
                  )}
                >
                  Stock disponible: {selectedProd.stock_actual}{" "}
                  {selectedProd.medida}
                </span>
                {!hasEnoughStock && (
                  <span className="text-[10px] text-red-500 font-bold flex items-center gap-1 uppercase">
                    <AlertCircle className="size-3" /> Sin stock suficiente
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-muted-foreground">
              Precio Unit. (Q)
            </label>
            <input
              type="number"
              step="0.01"
              className="w-full h-10 px-3 border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20 text-right"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="pt-4 flex items-center justify-between border-t mt-2">
          <div>
            <span className="block text-xs text-muted-foreground font-bold uppercase">
              Subtotal
            </span>
            <span className="text-xl font-black text-primary">
              Q{(price * quantity).toFixed(2)}
            </span>
          </div>
          <button
            onClick={handleConfirm}
            disabled={!selectedProd || !hasEnoughStock || quantity < 1}
            className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-bold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            AGREGAR
          </button>
        </div>
      </div>
    </div>
  );
}

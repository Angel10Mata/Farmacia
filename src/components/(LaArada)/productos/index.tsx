"use client";

import React, { useState, useMemo } from "react";
import {
  Plus,
  Search,
  Package,
  AlertTriangle,
  TrendingUp,
  Maximize2,
  Minimize2,
  Trophy,
} from "lucide-react";
import { useProducts } from "./lib/hooks";
import ProductModal from "./modals/product-modal";
import StatsAccordion from "./components/stats-accordion";
import TopProductsModal from "./modals/top-products-modal";
import { ProductFormValues } from "./lib/zod";
import { cn } from "@/lib/utils";

type ProductoCatalogo = ProductFormValues & { id: string };

export default function ListadoProductos() {
  const { data: productos = [], isLoading } = useProducts();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "activos" | "inactivos" | "todos"
  >("activos");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<
    ProductoCatalogo | undefined
  >(undefined);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [isTopModalOpen, setIsTopModalOpen] = useState(false);

  const filteredProductos = (productos || []).filter((prod: any) => {
    const isActivo = prod.activo !== false;
    const matchesSearch =
      prod.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prod.codigo?.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === "activos" && !isActivo) return false;
    if (statusFilter === "inactivos" && isActivo) return false;
    return true;
  });

  const allExpanded = useMemo(() => {
    if (filteredProductos.length === 0) return false;
    return filteredProductos.every((p: any) => expandedRows[p.id]);
  }, [filteredProductos, expandedRows]);

  const handleEdit = (product: ProductoCatalogo) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedProduct(undefined);
    setIsModalOpen(true);
  };

  const toggleAll = () => {
    if (allExpanded) {
      setExpandedRows({});
    } else {
      const newExpanded: Record<string, boolean> = {};
      filteredProductos.forEach((p: any) => {
        newExpanded[p.id] = true;
      });
      setExpandedRows(newExpanded);
    }
  };

  const toggleRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <Package className="size-5 md:size-6 text-primary" />
            Inventario de Productos
          </h1>
          <p className="text-muted-foreground text-xs md:text-sm">
            Gestiona los materiales y niveles de stock de la pedrinera.
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-bold hover:opacity-90 transition-all cursor-pointer active:scale-95 w-full sm:w-auto text-xs md:text-sm"
        >
          <Plus className="size-4" />
          NUEVO PRODUCTO
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto flex-1">
          <div className="flex items-center gap-2 bg-background border rounded-lg px-3 py-2 w-full sm:max-w-md focus-within:ring-2 focus-within:ring-primary/20 transition-all">
            <Search className="size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar producto..."
              className="bg-transparent outline-none text-xs md:text-sm w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-background border border-border rounded-lg px-3 py-2 text-xs md:text-sm font-bold text-muted-foreground outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer w-full sm:w-auto"
          >
            <option value="activos">Activos</option>
            <option value="inactivos">Inactivos</option>
            <option value="todos">Todos</option>
          </select>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => setIsTopModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-amber-500/10 text-amber-600 border border-amber-500/20 px-4 py-2 rounded-lg font-bold hover:bg-amber-500/20 transition-all cursor-pointer active:scale-95 w-full sm:w-auto text-xs md:text-sm"
          >
            <Trophy className="size-4" />
            TOP 5 VENTAS
          </button>
          <button
            onClick={toggleAll}
            disabled={filteredProductos.length === 0}
            className="flex items-center justify-center gap-2 bg-muted/50 text-foreground border border-border px-4 py-2 rounded-lg font-bold hover:bg-muted transition-all cursor-pointer active:scale-95 w-full sm:w-auto text-xs md:text-sm disabled:opacity-50"
          >
            {allExpanded ? (
              <Minimize2 className="size-4 text-blue-500" />
            ) : (
              <Maximize2 className="size-4 text-blue-500" />
            )}
            {allExpanded ? "CONTRAER" : "EXPANDIR"}
          </button>
        </div>
      </div>

      <div className="border rounded-xl overflow-hidden bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-[9px] md:text-sm text-left table-fixed sm:table-auto">
            <thead className="bg-muted/50 text-muted-foreground font-bold border-b uppercase tracking-widest">
              <tr>
                <th className="w-[10%] md:w-auto px-2 md:px-6 py-4">Cod.</th>
                <th className="w-[30%] md:w-auto px-2 md:px-6 py-4">Nombre</th>
                <th className="w-[10%] md:w-auto px-2 md:px-6 py-4 text-center">
                  Unidad
                </th>
                <th className="w-[10%] md:w-auto px-2 md:px-6 py-4 text-center">
                  Min.
                </th>
                <th className="w-[15%] md:w-auto px-2 md:px-6 py-4 text-center">
                  Stock
                </th>
                <th className="w-[15%] md:w-auto px-2 md:px-6 py-4 text-right">
                  Precio
                </th>
                <th className="w-[10%] md:w-auto px-2 md:px-6 py-4 text-center">
                  Stats
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-8 text-center text-muted-foreground italic"
                  >
                    Cargando productos...
                  </td>
                </tr>
              ) : filteredProductos.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-8 text-center text-muted-foreground"
                  >
                    No hay resultados.
                  </td>
                </tr>
              ) : (
                filteredProductos.map((prod: any) => {
                  const isLowStock = prod.stock_actual <= prod.stock_minimo;
                  const isExpanded = expandedRows[prod.id];
                  const isActivo = prod.activo !== false;

                  return (
                    <React.Fragment key={prod.id}>
                      <tr
                        onClick={() => handleEdit(prod as ProductoCatalogo)}
                        className={cn(
                          "transition-colors cursor-pointer group",
                          isExpanded ? "bg-muted/30" : "hover:bg-muted/50",
                          !isActivo &&
                            "opacity-50 bg-muted/10 hover:bg-muted/20",
                        )}
                      >
                        <td className="px-2 md:px-6 py-4 font-mono font-bold text-primary truncate">
                          {prod.codigo}
                        </td>
                        <td className="px-2 md:px-6 py-4 font-semibold uppercase truncate">
                          <div className="flex items-center gap-2">
                            {prod.nombre}
                            {!isActivo && (
                              <span className="bg-red-500/10 text-red-500 text-[9px] px-1.5 py-0.5 rounded-sm font-bold tracking-wider">
                                INACTIVO
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-2 md:px-6 py-4 text-center font-medium text-muted-foreground">
                          {prod.medida}
                        </td>
                        <td className="px-2 md:px-6 py-4 text-center font-medium text-muted-foreground">
                          {prod.stock_minimo}
                        </td>
                        <td className="px-2 md:px-6 py-4 text-center">
                          <div
                            className={cn(
                              "inline-flex items-center gap-1 px-2 py-1 rounded-full font-bold",
                              isLowStock
                                ? "bg-orange-500/10 text-orange-600 dark:text-orange-400"
                                : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                            )}
                          >
                            {isLowStock && <AlertTriangle className="size-3" />}
                            {prod.stock_actual}
                          </div>
                        </td>
                        <td className="px-2 md:px-6 py-4 font-black text-foreground text-right whitespace-nowrap">
                          Q{prod.precio_base.toFixed(2)}
                        </td>
                        <td className="px-2 md:px-6 py-4 text-center">
                          <button
                            onClick={(e) => toggleRow(prod.id, e)}
                            className={cn(
                              "p-2 rounded-lg transition-colors cursor-pointer group/btn",
                              isExpanded
                                ? "bg-blue-600 text-white shadow-md scale-105"
                                : "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20",
                            )}
                          >
                            <TrendingUp className="size-4 transition-transform" />
                          </button>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr>
                          <td
                            colSpan={7}
                            className="p-0 border-b-4 border-blue-500/20"
                          >
                            <div className="bg-muted/10 animate-in slide-in-from-top-2 duration-200 border-x border-border/50 shadow-inner">
                              <StatsAccordion product={prod} />
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        productToEdit={selectedProduct}
      />
      <TopProductsModal
        isOpen={isTopModalOpen}
        onClose={() => setIsTopModalOpen(false)}
      />
    </div>
  );
}

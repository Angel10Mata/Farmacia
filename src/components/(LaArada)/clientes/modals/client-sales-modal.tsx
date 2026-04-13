"use client";

import { useState, useMemo, useEffect } from "react";
import {
  X,
  Search,
  Calendar,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useClientSales } from "../lib/hooks";

const getGuatemalaDateParts = (dateInput?: string | Date) => {
  if (!dateInput || dateInput === "Sin Fecha")
    return getGuatemalaDateParts(new Date());

  let date = new Date(dateInput);
  if (typeof dateInput === "string" && dateInput.length === 10) {
    date = new Date(`${dateInput}T12:00:00`);
  }

  if (isNaN(date.getTime())) return getGuatemalaDateParts(new Date());

  const guatemalaTime = new Date(
    date.toLocaleString("en-US", { timeZone: "America/Guatemala" }),
  );
  const year = guatemalaTime.getFullYear();
  const month = guatemalaTime.getMonth() + 1;
  const day = guatemalaTime.getDate();

  const firstDayJS = new Date(year, month - 1, 1).getDay();
  const firstDayIso = firstDayJS === 0 ? 6 : firstDayJS - 1;
  const week = Math.ceil((day + firstDayIso) / 7);

  return { year, month, week };
};

const getOrderDateString = (order: any) => {
  if (order.fecha_entrega) return String(order.fecha_entrega).substring(0, 10);
  if (order.created_at) return String(order.created_at).substring(0, 10);
  return "Sin Fecha";
};

const getWeeksLabels = (year: number, month: number) => {
  const labels = [];
  const lastDay = new Date(year, month, 0).getDate();
  const firstDayJS = new Date(year, month - 1, 1).getDay();
  const firstDayIso = firstDayJS === 0 ? 6 : firstDayJS - 1;
  const daysStr = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  let startDay = 1;
  while (startDay <= lastDay) {
    const weekNum = Math.ceil((startDay + firstDayIso) / 7);
    let endDay = startDay;
    while ((endDay + firstDayIso) % 7 !== 0 && endDay < lastDay) {
      endDay++;
    }
    const startJS = new Date(year, month - 1, startDay).getDay();
    const endJS = new Date(year, month - 1, endDay).getDay();
    labels.push({
      week: weekNum,
      label: `${daysStr[startJS === 0 ? 6 : startJS - 1]} ${startDay} - ${daysStr[endJS === 0 ? 6 : endJS - 1]} ${endDay}`,
    });
    startDay = endDay + 1;
  }
  return labels;
};

interface ClientSalesModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: any;
}

export default function ClientSalesModal({
  isOpen,
  onClose,
  client,
}: ClientSalesModalProps) {
  const { data: sales = [], isLoading } = useClientSales(client?.id || null);

  const current = useMemo(() => getGuatemalaDateParts(), []);

  const [filtroAnio, setFiltroAnio] = useState<number>(current.year);
  const [filtroMes, setFiltroMes] = useState<number>(current.month);
  const [filtroSemana, setFiltroSemana] = useState<number | "Todas">("Todas");

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    if (isOpen) {
      setFiltroAnio(current.year);
      setFiltroMes(current.month);
      setFiltroSemana("Todas");
      setSearchTerm("");
      setCurrentPage(1);
      setItemsPerPage(10);
    }
  }, [isOpen, current.year, current.month]);

  const semanasDelMes = useMemo(
    () => getWeeksLabels(filtroAnio, filtroMes),
    [filtroAnio, filtroMes],
  );

  const filteredSales = useMemo(() => {
    return sales.filter((sale: any) => {
      const orderDate = getGuatemalaDateParts(getOrderDateString(sale));

      const matchAnio = orderDate.year === filtroAnio;
      const matchMes = orderDate.month === filtroMes;
      const matchSemana =
        filtroSemana === "Todas" || orderDate.week === filtroSemana;

      const searchLower = searchTerm.toLowerCase();
      const matchSearch =
        sale.id.toLowerCase().includes(searchLower) ||
        (sale.numero_recibo &&
          String(sale.numero_recibo).includes(searchLower)) ||
        (sale.estado && sale.estado.toLowerCase().includes(searchLower));

      return matchAnio && matchMes && matchSemana && matchSearch;
    });
  }, [sales, filtroAnio, filtroMes, filtroSemana, searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filtroAnio, filtroMes, filtroSemana, searchTerm, itemsPerPage]);

  const totalPages = Math.ceil(filteredSales.length / itemsPerPage) || 1;
  const currentItems = filteredSales.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  if (!isOpen || !client) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-background">
      <div className="w-full h-full flex flex-col">
        <div className="flex items-center justify-between p-4 md:p-6 border-b bg-muted/20 shrink-0">
          <div>
            <h2 className="text-xl md:text-3xl font-black flex items-center gap-3 uppercase text-primary">
              <ShoppingCart className="size-6 md:size-8" />
              Historial de Ventas
            </h2>
            <p className="text-sm md:text-base text-muted-foreground font-bold uppercase mt-1">
              Cliente: <span className="text-foreground">{client.nombre}</span>{" "}
              | NIT: {client.nit}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-3 bg-muted hover:bg-muted/80 rounded-full transition-colors cursor-pointer"
          >
            <X className="size-6" />
          </button>
        </div>

        <div className="p-4 md:p-6 bg-muted/10 border-b grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 shrink-0">
          <div className="flex items-center gap-2 bg-background border rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-primary/20 md:col-span-2">
            <Search className="size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por código o estado..."
              className="bg-transparent font-bold outline-none text-sm w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            value={filtroAnio}
            onChange={(e) => setFiltroAnio(Number(e.target.value))}
            className="bg-background border rounded-lg px-3 py-2 text-sm font-bold outline-none focus:ring-2 cursor-pointer"
          >
            {[2025, 2026, 2027].map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>

          <select
            value={filtroMes}
            onChange={(e) => {
              setFiltroMes(Number(e.target.value));
              setFiltroSemana("Todas");
            }}
            className="bg-background border rounded-lg px-3 py-2 text-sm font-bold capitalize outline-none focus:ring-2 cursor-pointer"
          >
            {[...Array(12)].map((_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(2000, i, 1).toLocaleString("es-GT", {
                  month: "long",
                })}
              </option>
            ))}
          </select>

          <select
            value={filtroSemana}
            onChange={(e) =>
              setFiltroSemana(
                e.target.value === "Todas" ? "Todas" : Number(e.target.value),
              )
            }
            className="bg-background border rounded-lg px-3 py-2 text-sm font-bold outline-none focus:ring-2 cursor-pointer"
          >
            <option value="Todas">Todas las Semanas</option>
            {semanasDelMes.map((s) => (
              <option key={s.week} value={s.week}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 overflow-auto p-4 md:p-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-full font-bold text-muted-foreground">
              Cargando historial...
            </div>
          ) : (
            <div className="border rounded-xl overflow-hidden bg-card shadow-sm">
              <table className="w-full text-xs md:text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground font-bold border-b uppercase">
                  <tr>
                    <th className="px-4 py-4">Fecha</th>
                    <th className="px-4 py-4">Documento</th>
                    <th className="px-4 py-4">Tipo</th>
                    <th className="px-4 py-4">Estado</th>
                    <th className="px-4 py-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {currentItems.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-8 text-center text-muted-foreground font-bold"
                      >
                        No se encontraron ventas para estos filtros.
                      </td>
                    </tr>
                  ) : (
                    currentItems.map((sale: any) => {
                      const displayDate =
                        sale.fecha_entrega || sale.created_at
                          ? new Date(
                              sale.fecha_entrega || sale.created_at,
                            ).toLocaleDateString("es-GT")
                          : "Sin Fecha";
                      const estadoNormal = String(sale.estado || "Pendiente")
                        .trim()
                        .toLowerCase();

                      return (
                        <tr
                          key={sale.id}
                          className="hover:bg-muted/20 transition-colors"
                        >
                          <td className="px-4 py-4 font-medium flex items-center gap-2 uppercase">
                            <Calendar className="size-4 text-muted-foreground shrink-0" />
                            {displayDate}
                          </td>
                          <td className="px-4 py-4 font-mono font-bold text-orange-500">
                            #
                            {sale.numero_recibo
                              ? String(sale.numero_recibo).padStart(5, "0")
                              : sale.id.slice(0, 6).toUpperCase()}
                          </td>
                          <td className="px-4 py-4 font-bold uppercase text-muted-foreground text-[10px] md:text-xs">
                            {sale.tipo_venta} <br /> {sale.tipo_comprobante}
                          </td>
                          <td className="px-4 py-4 font-bold uppercase">
                            <span
                              className={`px-2 py-1 rounded-md text-[10px] ${
                                estadoNormal === "pendiente"
                                  ? "bg-amber-500/10 text-amber-600"
                                  : estadoNormal === "entregado"
                                    ? "bg-green-500/10 text-green-600"
                                    : "bg-red-500/10 text-red-600"
                              }`}
                            >
                              {sale.estado}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right font-black text-foreground">
                            Q
                            {Number(sale.total).toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="p-4 border-t bg-background flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
          <div className="flex items-center gap-4">
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="bg-muted/30 border rounded-lg px-2 py-1.5 text-xs font-bold outline-none cursor-pointer"
            >
              <option value={10}>10 por página</option>
              <option value={20}>20 por página</option>
              <option value={50}>50 por página</option>
            </select>
            <span className="text-sm font-bold text-muted-foreground uppercase">
              Total: {filteredSales.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 border rounded-md hover:bg-muted disabled:opacity-50 cursor-pointer transition-colors"
            >
              <ChevronLeft className="size-5" />
            </button>
            <span className="text-sm font-bold px-4 uppercase text-muted-foreground">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="p-2 border rounded-md hover:bg-muted disabled:opacity-50 cursor-pointer transition-colors"
            >
              <ChevronRight className="size-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

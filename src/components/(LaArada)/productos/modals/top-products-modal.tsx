"use client";

import { useState, useMemo } from "react";
import { X, Trophy, CalendarDays } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { getAllProductsStats } from "../lib/actions";
import { useQuery } from "@tanstack/react-query";

const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const COLORS = ["#ef4444", "#3b82f6", "#22c55e", "#f59e0b", "#a855f7"];

export default function TopProductsModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const currentYearVal = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYearVal);

  const { data: rawData, isLoading } = useQuery({
    queryKey: ["all-products-stats"],
    queryFn: () => getAllProductsStats(),
    enabled: isOpen,
  });

  const availableYears = useMemo(() => {
    if (!rawData) return [currentYearVal];
    const years = new Set<number>([currentYearVal]);
    rawData.forEach((item: any) => {
      let d = item.ven_ventas.fecha_entrega;
      if (typeof d === "string" && d.length === 10) d += "T12:00:00";
      years.add(new Date(d).getFullYear());
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [rawData, currentYearVal]);

  const chartInfo = useMemo(() => {
    if (!rawData) return { data: [], lines: [] };

    const productTotals: Record<
      string,
      { id: string; name: string; total: number }
    > = {};

    // Calcular totales anuales por producto
    rawData.forEach((item: any) => {
      let d = item.ven_ventas.fecha_entrega;
      if (typeof d === "string" && d.length === 10) d += "T12:00:00";

      if (new Date(d).getFullYear() === selectedYear) {
        const pid = item.producto_id;
        const pName = item.inv_productos?.nombre || "Desconocido";
        if (!productTotals[pid]) {
          productTotals[pid] = { id: pid, name: pName, total: 0 };
        }
        productTotals[pid].total += Number(item.cantidad);
      }
    });

    const top5 = Object.values(productTotals)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    const top5Ids = top5.map((p) => p.id);
    const top5Names = top5.map((p) => p.name);

    // Preparar datos mensuales
    const monthlyData: Record<number, any> = {};
    for (let i = 0; i < 12; i++) {
      monthlyData[i] = { name: MONTHS[i].substring(0, 3), fullName: MONTHS[i] };
      top5Names.forEach((name) => {
        monthlyData[i][name] = 0;
      });
    }

    // Llenar agrupaciones de líneas
    rawData.forEach((item: any) => {
      if (top5Ids.includes(item.producto_id)) {
        let d = item.ven_ventas.fecha_entrega;
        if (typeof d === "string" && d.length === 10) d += "T12:00:00";
        const date = new Date(d);
        if (date.getFullYear() === selectedYear) {
          const month = date.getMonth();
          const pName = item.inv_productos.nombre;
          monthlyData[month][pName] += Number(item.cantidad);
        }
      }
    });

    return { data: Object.values(monthlyData), lines: top5Names };
  }, [rawData, selectedYear]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-6xl h-fit max-h-[90vh] p-6 md:p-8 shadow-2xl rounded-4xl bg-background border border-border flex flex-col gap-6 relative overflow-hidden text-foreground">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center shrink-0 gap-4">
          <div className="space-y-1">
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter flex items-center gap-3 text-amber-500">
              <Trophy className="size-8 md:size-10" /> TOP 5 VENTAS
            </h2>
            <div className="font-bold uppercase text-xs md:text-sm tracking-widest text-muted-foreground">
              Comparativa Anual de Productos
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center bg-muted/50 rounded-2xl border border-border/50 shrink-0 px-3 py-2">
              <CalendarDays className="size-4 text-muted-foreground mr-2" />
              <select
                className="bg-transparent font-black uppercase tracking-widest text-sm outline-none cursor-pointer"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
              >
                {availableYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={onClose}
              className="p-3 hover:bg-red-500 hover:text-white rounded-full transition-all cursor-pointer border border-border/50 active:scale-90 bg-background"
            >
              <X className="size-5 md:size-6" />
            </button>
          </div>
        </div>

        <div className="w-full bg-muted/10 rounded-4xl p-4 md:p-6 border border-border/30 h-[50vh] min-h-100">
          {isLoading ? (
            <div className="h-full flex items-center justify-center italic text-muted-foreground animate-pulse font-black text-xl uppercase tracking-widest">
              Analizando historial de ventas...
            </div>
          ) : chartInfo.lines.length === 0 ? (
            <div className="h-full flex items-center justify-center text-muted-foreground font-bold uppercase border-2 border-dashed border-border rounded-3xl">
              Sin ventas registradas en {selectedYear}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartInfo.data}
                margin={{ top: 20, right: 20, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="4 4"
                  vertical={false}
                  stroke="#88888815"
                />
                <XAxis
                  dataKey="name"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#888", fontWeight: "900" }}
                  dy={10}
                />
                <YAxis
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#888", fontWeight: "900" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#000",
                    border: "none",
                    borderRadius: "16px",
                    fontSize: "14px",
                    color: "#fff",
                    padding: "16px",
                    fontWeight: "900",
                  }}
                  labelFormatter={(value, payload) =>
                    `Mes: ${payload?.[0]?.payload?.fullName || value}`
                  }
                />
                <Legend
                  wrapperStyle={{
                    paddingTop: "20px",
                    fontWeight: "bold",
                    fontSize: "12px",
                  }}
                />
                {chartInfo.lines.map((lineName, index) => (
                  <Line
                    key={lineName}
                    type="monotone"
                    dataKey={lineName}
                    stroke={COLORS[index % COLORS.length]}
                    strokeWidth={4}
                    dot={{ r: 4, strokeWidth: 2 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                    animationDuration={1500}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

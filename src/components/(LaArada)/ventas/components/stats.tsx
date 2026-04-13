"use client";

import { useState, useMemo } from "react";
import {
  TrendingUp,
  ArrowUp,
  ArrowDown,
  BarChart3,
  CalendarDays,
  Trophy,
  AlertCircle,
  Activity,
  Layers,
  Banknote,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Label,
} from "recharts";
import { cn } from "@/lib/utils";

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

export default function Stats({ orders }: { orders: any[] }) {
  const currentMonthIdx = new Date().getMonth();
  const currentYearVal = new Date().getFullYear();

  const [viewMode, setViewMode] = useState<"mensual" | "anual">("mensual");
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonthIdx);
  const [selectedYear, setSelectedYear] = useState<number>(currentYearVal);

  const daysInMonth = useMemo(() => {
    return new Date(selectedYear, selectedMonth + 1, 0).getDate();
  }, [selectedMonth, selectedYear]);

  const validOrders = useMemo(() => {
    return (orders || []).filter(
      (o) => String(o.estado).toLowerCase().trim() !== "anulado",
    );
  }, [orders]);

  const availableYears = useMemo(() => {
    if (validOrders.length === 0) return [currentYearVal];
    const years = new Set<number>([currentYearVal]);
    validOrders.forEach((item: any) => {
      let d = item.fecha_entrega || item.created_at;
      if (d) {
        if (typeof d === "string" && d.length === 10) d += "T12:00:00";
        years.add(new Date(d).getFullYear());
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [validOrders, currentYearVal]);

  const chartInfo = useMemo(() => {
    if (validOrders.length === 0)
      return {
        data: [],
        max: 0,
        min: 0,
        avg: 0,
        total: 0,
        maxDayLabel: "N/A",
        minDayLabel: "N/A",
      };

    const dayMap: Record<number, number> = {};
    for (let i = 1; i <= daysInMonth; i++) {
      dayMap[i] = 0;
    }

    validOrders.forEach((item: any) => {
      let dateString = item.fecha_entrega || item.created_at;
      if (dateString) {
        if (typeof dateString === "string" && dateString.length === 10) {
          dateString = `${dateString}T12:00:00`;
        }

        const date = new Date(dateString);
        if (
          date.getMonth() === selectedMonth &&
          date.getFullYear() === selectedYear
        ) {
          const day = date.getDate();
          dayMap[day] += Number(item.total || 0);
        }
      }
    });

    const data = Object.entries(dayMap).map(([day, total]) => ({
      name: day,
      total: total,
    }));

    const values = data.map((d) => d.total).filter((v) => v > 0);
    const max = values.length > 0 ? Math.max(...values) : 0;
    const min = values.length > 0 ? Math.min(...values) : 0;
    const total = values.reduce((a, b) => a + b, 0);
    const avg = values.length > 0 ? total / values.length : 0;

    const maxEntry = data.find((d) => d.total === max && max > 0);
    const minEntry = data.find((d) => d.total === min && min > 0);

    const formatDay = (dayStr: string) => {
      const d = new Date(selectedYear, selectedMonth, Number(dayStr));
      const weekday = d
        .toLocaleDateString("es-GT", { weekday: "long" })
        .replace(".", "")
        .trim();
      return `${weekday.charAt(0).toUpperCase() + weekday.slice(1)} ${dayStr}`;
    };

    const maxDayLabel = maxEntry ? formatDay(maxEntry.name) : "N/A";
    const minDayLabel = minEntry ? formatDay(minEntry.name) : "N/A";

    return { data, max, min, avg, total, maxDayLabel, minDayLabel };
  }, [validOrders, daysInMonth, selectedMonth, selectedYear]);

  const yearlyInfo = useMemo(() => {
    if (validOrders.length === 0) return null;

    const yearData = validOrders.filter((item: any) => {
      let d = item.fecha_entrega || item.created_at;
      if (!d) return false;
      if (typeof d === "string" && d.length === 10) d += "T12:00:00";
      return new Date(d).getFullYear() === selectedYear;
    });

    const monthsData = Array.from({ length: 12 }, () => ({
      total: 0,
      days: {} as Record<number, number>,
    }));

    yearData.forEach((item: any) => {
      let d = item.fecha_entrega || item.created_at;
      if (typeof d === "string" && d.length === 10) d += "T12:00:00";
      const date = new Date(d);
      const m = date.getMonth();
      const day = date.getDate();
      const amount = Number(item.total || 0);

      monthsData[m].total += amount;
      monthsData[m].days[day] = (monthsData[m].days[day] || 0) + amount;
    });

    const processedMonths = monthsData.map((m, index) => {
      const daysInM = new Date(selectedYear, index + 1, 0).getDate();
      const fullDailyValues = [];
      for (let i = 1; i <= daysInM; i++) {
        fullDailyValues.push(m.days[i] || 0);
      }

      const dailyValues = fullDailyValues.filter((v) => v > 0);
      const max = dailyValues.length > 0 ? Math.max(...dailyValues) : 0;
      const min = dailyValues.length > 0 ? Math.min(...dailyValues) : 0;
      const avg = daysInM > 0 ? m.total / daysInM : 0;

      const isValid =
        selectedYear < currentYearVal ||
        (selectedYear === currentYearVal && index <= currentMonthIdx);

      return {
        index,
        name: MONTHS[index],
        shortName: MONTHS[index].substring(0, 3),
        total: m.total,
        max,
        min,
        avg,
        isValid,
      };
    });

    const validMonths = processedMonths.filter((m) => m.isValid);
    if (validMonths.length === 0) return null;

    const highestMonth = validMonths.reduce(
      (prev, curr) => (curr.total > prev.total ? curr : prev),
      validMonths[0],
    );
    const lowestMonth = validMonths.reduce(
      (prev, curr) => (curr.total < prev.total ? curr : prev),
      validMonths[0],
    );

    const totalYear = yearData.reduce(
      (acc, curr) => acc + Number(curr.total || 0),
      0,
    );
    const divisor = selectedYear === currentYearVal ? currentMonthIdx + 1 : 12;
    const avgYear = totalYear / divisor;

    const chartData = processedMonths.map((m) => ({
      name: m.shortName,
      fullName: m.name,
      total: m.total,
    }));

    const maxMonthlyTotal = highestMonth ? highestMonth.total : 0;
    const minMonthlyTotal = lowestMonth ? lowestMonth.total : 0;

    return {
      totalYear,
      avgYear,
      highestMonth,
      lowestMonth,
      chartData,
      maxMonthlyTotal,
      minMonthlyTotal,
    };
  }, [validOrders, selectedYear, currentYearVal, currentMonthIdx]);

  const isAnual = viewMode === "anual";
  const currentGraphData = isAnual
    ? yearlyInfo?.chartData || []
    : chartInfo.data;
  const currentMax = isAnual ? yearlyInfo?.maxMonthlyTotal || 0 : chartInfo.max;
  const currentMin = isAnual ? yearlyInfo?.minMonthlyTotal || 0 : chartInfo.min;
  const currentAvg = isAnual ? yearlyInfo?.avgYear || 0 : chartInfo.avg;

  const formatMoney = (val: number) => `Q${val.toFixed(2)}`;

  return (
    <div className="w-full p-4 md:p-6 flex flex-col gap-4 md:gap-6 relative overflow-hidden text-foreground animate-in fade-in duration-300">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center shrink-0 gap-4">
        <div className="space-y-1 w-full lg:w-auto">
          <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold uppercase text-xs md:text-sm tracking-widest">
            <TrendingUp className="size-4 shrink-0" />
            <span>Ingresos y Ventas</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="flex items-center bg-background p-1 rounded-xl border border-border/50 shadow-sm">
            <button
              onClick={() => setViewMode("mensual")}
              className={cn(
                "px-4 py-2 rounded-lg text-xs font-black uppercase transition-all flex items-center gap-2",
                !isAnual
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-muted-foreground hover:bg-muted/50",
              )}
            >
              <CalendarDays className="size-3" /> Mes
            </button>
            <button
              onClick={() => setViewMode("anual")}
              className={cn(
                "px-4 py-2 rounded-lg text-xs font-black uppercase transition-all flex items-center gap-2",
                isAnual
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-muted-foreground hover:bg-muted/50",
              )}
            >
              <Layers className="size-3" /> Año
            </button>
          </div>

          <div className="flex items-center bg-background rounded-xl border border-border/50 shrink-0 overflow-hidden shadow-sm">
            {!isAnual && (
              <select
                className="bg-transparent font-black uppercase tracking-widest text-xs md:text-sm outline-none cursor-pointer p-2.5 pr-2 border-r border-border/50 hover:bg-muted/50"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
              >
                {MONTHS.map((month, index) => (
                  <option key={month} value={index}>
                    {month}
                  </option>
                ))}
              </select>
            )}
            <select
              className="bg-transparent font-black uppercase tracking-widest text-xs md:text-sm outline-none cursor-pointer p-2.5 pl-3 hover:bg-muted/50"
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
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
        <StatCard
          label={
            isAnual
              ? `Ingresos Año ${selectedYear}`
              : `Ingresos ${MONTHS[selectedMonth]}`
          }
          value={formatMoney(
            isAnual ? yearlyInfo?.totalYear || 0 : chartInfo.total,
          )}
          icon={<Banknote className="size-4" />}
          color="text-foreground"
        />
        <StatCard
          label={
            isAnual
              ? `Mes Máx. (${yearlyInfo?.highestMonth?.name || "N/A"})`
              : `Día Máx. (${chartInfo.maxDayLabel})`
          }
          value={formatMoney(currentMax)}
          icon={<ArrowUp className="size-4 text-emerald-500" />}
          color="text-emerald-500"
        />
        <StatCard
          label={
            isAnual
              ? `Mes Mín. (${yearlyInfo?.lowestMonth?.name || "N/A"})`
              : `Día Mín. (${chartInfo.minDayLabel})`
          }
          value={formatMoney(currentMin)}
          icon={<ArrowDown className="size-4 text-red-500" />}
          color="text-red-500"
        />
        <StatCard
          label={isAnual ? "Promedio Mensual" : "Promedio Diario"}
          value={formatMoney(currentAvg)}
          icon={<BarChart3 className="size-4 text-purple-500" />}
          color="text-purple-500"
        />
      </div>

      {!isAnual && yearlyInfo && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 shrink-0">
          <div className="bg-background border border-border/60 p-4 rounded-2xl flex flex-col gap-1 shadow-sm">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground tracking-widest opacity-80">
              <Activity className="size-4 text-purple-600" /> Promedio Anual
              (Mensual)
            </div>
            <div className="text-2xl font-black tracking-tighter text-purple-600">
              {formatMoney(yearlyInfo.avgYear)}{" "}
              <span className="text-xs text-muted-foreground font-bold tracking-normal">
                /mes
              </span>
            </div>
          </div>

          <YearlyDetailCard
            label={`Mejor Mes (${selectedYear})`}
            data={yearlyInfo.highestMonth}
            colorClass="text-emerald-500"
            bgClass="bg-emerald-500/5 border-emerald-500/20"
            icon={<Trophy className="size-4 text-emerald-500" />}
          />

          <YearlyDetailCard
            label={`Peor Mes (${selectedYear})`}
            data={yearlyInfo.lowestMonth}
            colorClass="text-red-500"
            bgClass="bg-red-500/5 border-red-500/20"
            icon={<AlertCircle className="size-4 text-red-500" />}
          />
        </div>
      )}

      <div className="w-full bg-background rounded-2xl p-4 md:p-6 border border-border/50 relative h-[45vh] min-h-75 shrink-0 mt-2 shadow-sm">
        {currentGraphData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground font-bold uppercase border-2 border-dashed border-border rounded-xl">
            Sin entregas registradas en este periodo
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={currentGraphData}
              margin={{ top: 20, right: 20, left: 10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#9333ea" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#9333ea" stopOpacity={0} />
                </linearGradient>
              </defs>
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
                tickFormatter={(val) => `Q${val}`}
              />
              <Tooltip
                cursor={{ stroke: "#9333ea", strokeWidth: 2 }}
                contentStyle={{
                  backgroundColor: "#000",
                  border: "none",
                  borderRadius: "12px",
                  fontSize: "12px",
                  color: "#fff",
                  padding: "12px",
                  fontWeight: "bold",
                }}
                formatter={(value: number | undefined) => [
                  `Q${Number(value || 0).toFixed(2)}`,
                  "Ingresos",
                ]}
                labelFormatter={(value, payload) => {
                  if (isAnual) {
                    const fullName = payload?.[0]?.payload?.fullName || value;
                    return `Mes: ${fullName} ${selectedYear}`;
                  }
                  return `Día ${value} de ${MONTHS[selectedMonth]}`;
                }}
              />

              {currentMax > 0 && (
                <ReferenceLine
                  y={currentMax}
                  stroke="#22c55e"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                >
                  <Label
                    value="MÁX"
                    position="insideTopRight"
                    fill="#22c55e"
                    fontSize={10}
                    fontWeight="900"
                  />
                </ReferenceLine>
              )}
              {currentMin > 0 && (
                <ReferenceLine
                  y={currentMin}
                  stroke="#ef4444"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                >
                  <Label
                    value="MÍN"
                    position="insideBottomRight"
                    fill="#ef4444"
                    fontSize={10}
                    fontWeight="900"
                    dy={-10}
                  />
                </ReferenceLine>
              )}
              {currentAvg > 0 && (
                <ReferenceLine
                  y={currentAvg}
                  stroke="#9333ea"
                  strokeWidth={3}
                  strokeOpacity={0.5}
                >
                  <Label
                    value={`PROM: Q${currentAvg.toFixed(2)}`}
                    position="insideTopLeft"
                    fill="#9333ea"
                    fontSize={10}
                    fontWeight="900"
                  />
                </ReferenceLine>
              )}
              <Area
                type="monotone"
                dataKey="total"
                stroke="#9333ea"
                strokeWidth={4}
                fill="url(#colorVentas)"
                animationDuration={1000}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }: any) {
  return (
    <div className="bg-background border border-border/60 p-4 rounded-2xl flex flex-col justify-center gap-1 shadow-sm">
      <div className="flex items-center gap-1 text-[10px] md:text-xs font-black uppercase text-muted-foreground tracking-widest opacity-80">
        {icon} {label}
      </div>
      <div
        className={cn(
          "text-xl md:text-2xl lg:text-3xl font-black tracking-tighter truncate",
          color,
        )}
      >
        {value}
      </div>
    </div>
  );
}

function YearlyDetailCard({ label, data, colorClass, bgClass, icon }: any) {
  return (
    <div
      className={cn(
        "border p-4 rounded-2xl flex flex-col justify-between shadow-sm",
        bgClass,
      )}
    >
      <div className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-2 opacity-80">
        {icon} {label}
      </div>
      <div className="flex justify-between items-end">
        <div>
          <div
            className={cn(
              "text-xl md:text-2xl font-black uppercase leading-none tracking-tighter",
              colorClass,
            )}
          >
            {data?.name || "N/A"}
          </div>
          <div className="text-xs font-bold text-muted-foreground mt-1">
            TOTAL:{" "}
            <span className="text-foreground">
              Q{data?.total?.toFixed(2) || 0}
            </span>
          </div>
        </div>
        <div className="text-right text-[10px] font-black uppercase text-muted-foreground space-y-0.5">
          <div>
            Máx:{" "}
            <span className="text-foreground">
              Q{data?.max?.toFixed(2) || 0}
            </span>
          </div>
          <div>
            Mín:{" "}
            <span className="text-foreground">
              Q{data?.min?.toFixed(2) || 0}
            </span>
          </div>
          <div>
            Prom:{" "}
            <span className="text-foreground">
              Q{data?.avg ? data.avg.toFixed(2) : 0}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

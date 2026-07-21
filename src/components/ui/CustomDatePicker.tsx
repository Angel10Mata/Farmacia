import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface IntervaloSemana {
  label: string; // e.g. "Lun 1 - Dom 7" o "Lun 29 - Mar 30"
  desde: string; // YYYY-MM-DD
  hasta: string; // YYYY-MM-DD
}

export function obtenerSemanasDelMes(month: number, year: number): IntervaloSemana[] {
  const semanas: IntervaloSemana[] = [];
  const ultimoDia = new Date(year, month + 1, 0);
  const totalDias = ultimoDia.getDate();

  let diaInicio = 1;

  while (diaInicio <= totalDias) {
    const fechaInicio = new Date(year, month, diaInicio);
    const diasHastaDomingo = fechaInicio.getDay() === 0 ? 0 : 7 - fechaInicio.getDay();
    let diaFin = diaInicio + diasHastaDomingo;
    if (diaFin > totalDias) {
      diaFin = totalDias;
    }

    const fechaFin = new Date(year, month, diaFin);

    const formatDia = (d: Date) => {
      const nombresDias = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
      return `${nombresDias[d.getDay()]} ${d.getDate()}`;
    };

    const pad = (n: number) => n.toString().padStart(2, "0");
    const desdeStr = `${year}-${pad(month + 1)}-${pad(diaInicio)}`;
    const hastaStr = `${year}-${pad(month + 1)}-${pad(diaFin)}`;

    semanas.push({
      label: `${formatDia(fechaInicio)} - ${formatDia(fechaFin)}`,
      desde: desdeStr,
      hasta: hastaStr
    });

    diaInicio = diaFin + 1;
  }

  return semanas;
}

interface CalendarioCell {
  day: number;
  month: number;
  year: number;
  isCurrentMonth: boolean;
}

export function obtenerDiasDelMes(month: number, year: number): CalendarioCell[] {
  const cells: CalendarioCell[] = [];
  const primerDiaSemana = new Date(year, month, 1).getDay();
  const diasMesActual = new Date(year, month + 1, 0).getDate();
  const diasMesAnterior = new Date(year, month, 0).getDate();

  for (let i = primerDiaSemana - 1; i >= 0; i--) {
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    cells.push({
      day: diasMesAnterior - i,
      month: prevMonth,
      year: prevYear,
      isCurrentMonth: false
    });
  }

  for (let i = 1; i <= diasMesActual; i++) {
    cells.push({
      day: i,
      month,
      year,
      isCurrentMonth: true
    });
  }

  let nextMonthDay = 1;
  while (cells.length < 42) {
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    cells.push({
      day: nextMonthDay,
      month: nextMonth,
      year: nextYear,
      isCurrentMonth: false
    });
    nextMonthDay++;
  }

  return cells;
}

export const CustomDatePicker = ({
  value,
  onChange,
  placeholder,
  align = "left",
  dropDirection = "down"
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  align?: "left" | "right" | "center";
  dropDirection?: "up" | "down";
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const getParsedDate = () => {
    if (!value) return new Date();
    const [y, m, d] = value.split("-").map(Number);
    if (isNaN(y) || isNaN(m) || isNaN(d)) return new Date();
    return new Date(y, m - 1, d);
  };

  const parsedDate = getParsedDate();
  const [navMonth, setNavMonth] = useState(parsedDate.getMonth());
  const [navYear, setNavYear] = useState(parsedDate.getFullYear());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const p = getParsedDate();
    setNavMonth(p.getMonth());
    setNavYear(p.getFullYear());
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handlePrevMonth = () => {
    if (navMonth === 0) {
      setNavMonth(11);
      setNavYear(navYear - 1);
    } else {
      setNavMonth(navMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (navMonth === 11) {
      setNavMonth(0);
      setNavYear(navYear + 1);
    } else {
      setNavMonth(navMonth + 1);
    }
  };

  const handleSelectDay = (cell: CalendarioCell) => {
    const pad = (n: number) => n.toString().padStart(2, "0");
    const valStr = `${cell.year}-${pad(cell.month + 1)}-${pad(cell.day)}`;
    onChange(valStr);
    setIsOpen(false);
  };

  const getDisplayDate = () => {
    if (!value) return placeholder || "Seleccionar...";
    const [y, m, d] = value.split("-");
    if (!y || !m || !d) return placeholder || "Seleccionar...";
    return `${d}/${m}/${y}`;
  };

  const cells = obtenerDiasDelMes(navMonth, navYear);
  const nombresMeses = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between bg-white dark:bg-zinc-900 border border-slate-200 dark:border-slate-800 hover:border-[#8DA78E] rounded-xl px-2.5 py-1.5 cursor-pointer select-none transition-all shadow-xs h-[34px] min-w-[130px] text-left focus:outline-none focus:ring-1 focus:ring-[#8DA78E]"
      >
        <div className="flex items-center">
          <Calendar className="size-3.5 text-[#8DA78E] mr-1.5 shrink-0" />
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            {getDisplayDate()}
          </span>
        </div>
        <ChevronDown className="size-3 text-slate-400 ml-1.5 shrink-0" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "absolute bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-xl shadow-slate-100/50 dark:shadow-none z-50 p-4 min-w-[280px]",
              dropDirection === "down" ? "mt-2" : "bottom-full mb-2",
              align === "left" && "left-0",
              align === "right" && "right-0",
              align === "center" && "left-1/2 -translate-x-1/2"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4 pb-2.5 border-b border-slate-100 dark:border-slate-900/60">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg cursor-pointer text-slate-500 transition-colors"
              >
                <ChevronLeft className="size-4" />
              </button>
              
              <span className="text-xs font-bold text-slate-700 dark:text-[#A3BEB0] tracking-wide select-none">
                {nombresMeses[navMonth]} {navYear}
              </span>

              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg cursor-pointer text-slate-500 transition-colors"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>

            {/* Weekdays */}
            <div className="grid grid-cols-7 gap-1 text-center mb-2 text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider select-none">
              {["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"].map((dayName) => (
                <div key={dayName} className="py-1">{dayName}</div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {cells.map((cell, idx) => {
                const pad = (n: number) => n.toString().padStart(2, "0");
                const cellValStr = `${cell.year}-${pad(cell.month + 1)}-${pad(cell.day)}`;
                const isSelected = value === cellValStr;
                const isToday = () => {
                  const today = new Date();
                  return (
                    today.getDate() === cell.day &&
                    today.getMonth() === cell.month &&
                    today.getFullYear() === cell.year
                  );
                };

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectDay(cell)}
                    className={`py-1.5 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer ${
                      isSelected
                        ? "bg-[#8DA78E] text-white shadow-sm shadow-[#8DA78E]/30 scale-105 font-bold"
                        : cell.isCurrentMonth
                        ? isToday()
                          ? "border border-[#8DA78E] text-[#8DA78E] dark:text-[#A3BEB0] font-bold bg-[#8DA78E]/5 hover:bg-[#8DA78E]/10"
                          : "text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-900/60"
                        : "text-slate-400/50 dark:text-slate-650/30 hover:bg-slate-50/50 dark:hover:bg-zinc-900/10"
                    }`}
                  >
                    {cell.day}
                  </button>
                );
              })}
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-900/60 text-xs">
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setIsOpen(false);
                }}
                className="px-2.5 py-1 text-slate-500 hover:text-red-500 dark:hover:text-red-400 font-bold transition-colors cursor-pointer rounded-md hover:bg-red-50 dark:hover:bg-red-950/20"
              >
                Borrar
              </button>
              <button
                type="button"
                onClick={() => {
                  const pad = (n: number) => n.toString().padStart(2, "0");
                  const todayObj = new Date();
                  const todayStr = `${todayObj.getFullYear()}-${pad(todayObj.getMonth() + 1)}-${pad(todayObj.getDate())}`;
                  onChange(todayStr);
                  setIsOpen(false);
                }}
                className="px-2.5 py-1 text-[#8DA78E] dark:text-[#A3BEB0] hover:bg-[#8DA78E]/10 font-bold transition-colors cursor-pointer rounded-md"
              >
                Hoy
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

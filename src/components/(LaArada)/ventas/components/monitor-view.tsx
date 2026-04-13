import { Calendar, Edit, Lock } from "lucide-react";
import { useState, useMemo, useEffect } from "react";

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

    const startStr = daysStr[startJS === 0 ? 6 : startJS - 1];
    const endStr = daysStr[endJS === 0 ? 6 : endJS - 1];

    labels.push({
      week: weekNum,
      label: `${startStr} ${startDay} - ${endStr} ${endDay}`,
    });

    startDay = endDay + 1;
  }
  return labels;
};

export default function MonitorView({ items, orders, onStatusClick }: any) {
  const data = items || orders || [];
  const current = useMemo(() => getGuatemalaDateParts(), []);

  const [filtroEstado, setFiltroEstado] = useState("Pendiente");
  const [filtroAnio, setFiltroAnio] = useState<number>(current.year);
  const [filtroMes, setFiltroMes] = useState<number>(current.month);
  const [filtroSemana, setFiltroSemana] = useState<number | "Todas">(
    current.week,
  );

  const semanasDelMes = useMemo(
    () => getWeeksLabels(filtroAnio, filtroMes),
    [filtroAnio, filtroMes],
  );

  const counts = useMemo(() => {
    const c = { Pendiente: 0, Entregado: 0 };
    data.forEach((order: any) => {
      const estado = String(order.estado || "Pendiente")
        .trim()
        .toLowerCase();

      const orderDate = getGuatemalaDateParts(getOrderDateString(order));
      const matchAnio = orderDate.year === filtroAnio;
      const matchMes = orderDate.month === filtroMes;
      const matchSemana =
        filtroSemana === "Todas" || orderDate.week === filtroSemana;

      if (matchAnio && matchMes && matchSemana) {
        if (estado === "pendiente") c.Pendiente++;
        else if (estado === "entregado") c.Entregado++;
      }
    });
    return c;
  }, [data, filtroAnio, filtroMes, filtroSemana]);

  useEffect(() => {
    if (
      filtroEstado !== "" &&
      counts[filtroEstado as keyof typeof counts] === 0
    ) {
      setFiltroEstado("");
    }
  }, [counts, filtroEstado]);

  const groupedOrders = useMemo(() => {
    const priority: Record<string, number> = { pendiente: 1, entregado: 2 };

    const filtered = data.filter((order: any) => {
      const estado = String(order.estado || "Pendiente")
        .trim()
        .toLowerCase();

      if (estado === "anulado") return false;

      const matchEstado =
        filtroEstado === "" || estado === filtroEstado.trim().toLowerCase();
      const orderDate = getGuatemalaDateParts(getOrderDateString(order));

      return (
        matchEstado &&
        orderDate.year === filtroAnio &&
        orderDate.month === filtroMes &&
        (filtroSemana === "Todas" || orderDate.week === filtroSemana)
      );
    });

    const groups: Record<string, any[]> = {};
    filtered.forEach((order: any) => {
      const date = getOrderDateString(order);
      if (!groups[date]) groups[date] = [];
      groups[date].push(order);
    });

    Object.keys(groups).forEach((date) => {
      groups[date].sort((a, b) => {
        const pA =
          priority[
            String(a.estado || "Pendiente")
              .toLowerCase()
              .trim()
          ] || 3;
        const pB =
          priority[
            String(b.estado || "Pendiente")
              .toLowerCase()
              .trim()
          ] || 3;
        return pA - pB;
      });
    });

    return Object.keys(groups)
      .sort()
      .reverse()
      .map((date) => ({
        date,
        orders: groups[date],
      }));
  }, [data, filtroEstado, filtroAnio, filtroMes, filtroSemana]);

  return (
    <div className="flex flex-col gap-6 items-start animate-in fade-in duration-300">
      <div className="w-full flex flex-col xl:flex-row xl:items-end justify-start gap-4 xl:gap-8 sticky md:top-6 bg-background/95 z-20 pb-4 border-b text-xs">
        <div className="flex flex-col gap-2">
          <h3 className="font-bold text-muted-foreground uppercase text-[10px]">
            Filtrar por fecha
          </h3>
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={filtroAnio}
              onChange={(e) => setFiltroAnio(Number(e.target.value))}
              className="px-3 py-2 flex-grow border rounded-xl bg-background font-bold outline-none focus:ring-2 focus:ring-primary/20"
            >
              {[2025, 2026, 2027].map((anio) => (
                <option key={anio} value={anio}>
                  {anio}
                </option>
              ))}
            </select>
            <select
              value={filtroMes}
              onChange={(e) => {
                setFiltroMes(Number(e.target.value));
                setFiltroSemana("Todas");
              }}
              className="px-3 py-2 flex-grow border rounded-xl bg-background font-bold capitalize outline-none focus:ring-2 focus:ring-primary/20"
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
              className="px-3 py-2 flex-grow border rounded-xl bg-background font-bold outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="Todas">Todas las semanas</option>
              {semanasDelMes.map(({ week, label }) => (
                <option key={week} value={week}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="font-bold text-muted-foreground uppercase text-[10px]">
            Filtrar por estado
          </h3>
          <div className="flex gap-3 h-full items-center">
            {[
              {
                v: "Pendiente",
                c: "amber",
              },
              {
                v: "Entregado",
                c: "green",
              },
            ]
              .filter(({ v }) => counts[v as keyof typeof counts] > 0)
              .map(({ v, c }) => (
                <button
                  key={v}
                  onClick={() => setFiltroEstado(filtroEstado === v ? "" : v)}
                  className={`flex items-center justify-center px-4 py-2 border-[3px] rounded-xl cursor-pointer transition-all bg-${c}-500/10 text-${c}-600 ${
                    filtroEstado === v
                      ? `border-${c}-500`
                      : "border-transparent hover:opacity-70"
                  }`}
                >
                  <span className="font-bold text-xs truncate">
                    {v} ({counts[v as keyof typeof counts]})
                  </span>
                </button>
              ))}
          </div>
        </div>
      </div>

      <div className="w-full flex flex-col gap-8">
        {groupedOrders.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground border-2 border-border rounded-xl bg-card font-bold uppercase">
            No hay pedidos para mostrar.
          </div>
        ) : (
          groupedOrders.map((group) => {
            const rawDate =
              group.date !== "Sin Fecha"
                ? new Date(`${group.date}T12:00:00`).toLocaleDateString(
                    "es-GT",
                    { weekday: "long", day: "2-digit", month: "long" },
                  )
                : "Sin Fecha de Entrega";
            const formattedDate =
              group.date !== "Sin Fecha"
                ? rawDate.charAt(0).toUpperCase() +
                  rawDate.slice(1).replace(".", "")
                : rawDate;

            return (
              <div key={group.date} className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <div className="bg-primary/10 text-primary px-4 py-1.5 rounded-full flex items-center gap-2 border border-primary/20">
                    <Calendar className="size-4" />
                    <span className="font-black uppercase text-sm tracking-wider">
                      {formattedDate}
                    </span>
                  </div>
                  <div className="h-0.5 grow bg-border/50"></div>
                </div>

                <div className="flex flex-col gap-4">
                  {group.orders.map((order: any) => {
                    const estadoNormalizado = String(
                      order.estado || "Pendiente",
                    )
                      .trim()
                      .toLowerCase();
                    const isPendiente = estadoNormalizado === "pendiente";
                    const isEntregado = estadoNormalizado === "entregado";
                    const isAnulado = estadoNormalizado === "anulado";

                    let bgClass = "bg-amber-500/10 border-amber-500/50 hover:border-amber-500 dark:bg-amber-500/5";
                    let headerClass = "bg-amber-500/20 border-b-2 border-amber-500/30 text-amber-700 dark:text-amber-400";
                    let badgeClass = "bg-amber-500 text-white";

                    if (isEntregado) {
                      bgClass = "bg-green-500/10 border-green-500/50 hover:border-green-500 dark:bg-green-500/5";
                      headerClass = "bg-green-500/20 border-b-2 border-green-500/30 text-green-700 dark:text-green-400";
                      badgeClass = "bg-green-500 text-white";
                    } else if (isAnulado) {
                      bgClass = "bg-red-500/5 border-red-500/20 hover:border-red-500/40 dark:bg-red-500/5";
                      headerClass = "bg-red-500/10 border-b-2 border-red-500/20 text-red-700 dark:text-red-400";
                      badgeClass = "bg-red-600 text-white";
                    }

                    return (
                      <div
                        key={order.id}
                        onClick={() => isPendiente && onStatusClick(order)}
                        className={`border-[3px] rounded-2xl flex flex-col overflow-hidden relative transition-all shadow-sm h-full ${bgClass} ${isPendiente ? "cursor-pointer active:scale-[0.98]" : "opacity-90 grayscale-[0.1]"}`}
                      >
                        <div
                          className={`flex items-center gap-3 p-3 md:px-5 md:py-4 ${headerClass}`}
                        >
                          <span className="font-mono font-black text-lg md:text-xl shrink-0">
                            Venta #{order.id ? `${order.id.substring(0, 3).toUpperCase()}-${order.id.substring(3, 6).toUpperCase()} ` : '---'}
                          </span>
                          <h3 className="font-black text-base md:text-lg uppercase truncate grow text-foreground">
                            {order.ven_clientes?.nombre}
                          </h3>
                          <span
                            className={`px-3 py-1 text-[10px] md:text-xs font-black uppercase tracking-widest rounded-full shrink-0 ${badgeClass}`}
                          >
                            {order.estado || "Pendiente"}
                          </span>
                        </div>

                        <div className="p-4 md:p-6 grid grid-cols-1 sm:grid-cols-2 gap-3 content-start grow text-foreground">
                          {order.ven_detalle?.map((det: any) => (
                            <div
                              key={det.id}
                              className="bg-background/80 backdrop-blur-sm p-3 rounded-xl border border-border/50 flex items-center gap-4 shadow-sm"
                            >
                              <span className="bg-foreground text-background text-lg font-black px-3 py-1.5 rounded-lg shrink-0 text-center">
                                {`${det.cantidad} ${det.inv_productos?.medida}`}
                              </span>
                              <span className="text-xs font-bold truncate uppercase">
                                {det.inv_productos?.nombre}
                              </span>
                            </div>
                          ))}
                        </div>

                        {order.observaciones &&
                          order.observaciones.trim() !== "" && (
                            <div className="flex flex-col gap-1 p-3 md:px-5 md:py-3 border-t-2 border-border/30 bg-background/40">
                              <span className="font-bold text-[10px] uppercase tracking-wider opacity-70">
                                Observaciones
                              </span>
                              <p className="text-base md:text-lg font-black wrap-break-word leading-tight">
                                {order.observaciones}
                              </p>
                            </div>
                          )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

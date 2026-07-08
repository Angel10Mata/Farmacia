"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Home, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";

const SEGMENT_LABELS: Record<string, string> = {
  kore: "Farmacia La Salud",
  proyectos: "Proyectos",
  proyecto: "Proyectos",
  resumen: "Dashboard",
  nuevo: "Nuevo",
  editar: "Editar",
  ver: "Ver",
  qr: "QR",
  mantenimiento: "Mantenimiento",
  admin: "Administración",
  configuraciones: "Configuraciones",
  dispositivos: "Dispositivos de Acceso",
  usuarios: "Gestión de Usuarios",
  clientes: "Clientes",
  inventario: "Inventario",
  ventas: "Ventas",
  proveedores: "Proveedores",
  perfil: "Mi Perfil",
  finanzas: "Finanzas",
};

export function BreadcrumbNav() {
  const pathname = usePathname();

  if (pathname === "/kore") return null;

  const rawSegments = pathname.split("/").filter((item) => item !== "");

  const visibleSegments = rawSegments
    .map((segment, index) => {
      const label = SEGMENT_LABELS[segment];
      if (!label) return null;

      // Construir href incluyendo cualquier ID subsiguiente que no tenga etiqueta
      const parts = rawSegments.slice(0, index + 1);
      let nextIdx = index + 1;
      while (nextIdx < rawSegments.length && !SEGMENT_LABELS[rawSegments[nextIdx]]) {
        parts.push(rawSegments[nextIdx]);
        nextIdx++;
      }
      const href = "/" + parts.join("/");

      return { segment, label, href };
    })
    .filter((item): item is { segment: string; label: string; href: string } => item !== null);

  // ── Navegación hacia atrás (botón flecha izquierda) ────────────────────────
  let backHref = "/kore";
  if (rawSegments.includes("qr")) {
    const detalleIdx = rawSegments.indexOf("ver");
    const id = detalleIdx >= 0 && detalleIdx + 1 < rawSegments.length ? rawSegments[detalleIdx + 1] : "";
    backHref = id ? `/kore/proyectos/ver/${id}` : "/kore/proyectos";
  } else if (rawSegments.includes("editar")) {
    const detalleIdx = rawSegments.indexOf("ver");
    const id = detalleIdx >= 0 && detalleIdx + 1 < rawSegments.length ? rawSegments[detalleIdx + 1] : "";
    backHref = id ? `/kore/proyectos/ver/${id}` : "/kore/proyectos";
  } else if (rawSegments.includes("ver")) {
    backHref = "/kore/proyectos";
  } else if (rawSegments.length > 1) {
    backHref = `/${rawSegments.slice(0, -1).join("/")}`;
  }

  return (
    <LayoutGroup id="breadcrumb">
      <motion.div
        layout
        className="flex items-center gap-2 text-[9px] md:text-base font-medium text-muted-foreground overflow-hidden pt-1"
      >
        <motion.div layout="position">
          <Link
            href={backHref}
            className="group flex items-center justify-center hover:text-foreground transition-colors cursor-pointer mr-1"
            title="Atrás"
          >
            <ArrowLeft className="size-5 md:size-6 transition-transform group-hover:-translate-x-1" />
          </Link>
        </motion.div>

        <motion.div layout="position" className="flex items-center">
          <Link
            href="/kore"
            className="hover:text-foreground transition-colors p-1 shrink-0 flex items-center"
          >
            <Home className="size-5 md:size-6" />
          </Link>
        </motion.div>

        <div className="flex items-center gap-1 overflow-hidden mask-gradient">
          <AnimatePresence mode="popLayout" initial={false}>
            {visibleSegments.map((item, index) => {
              const isLast = index === visibleSegments.length - 1;

              return (
                <motion.div
                   layout="position"
                   key={item.href}
                   initial={{ opacity: 0, x: 10, scale: 0.9 }}
                   animate={{ opacity: 1, x: 0, scale: 1 }}
                   exit={{
                      opacity: 0,
                      scale: 0.9,
                      transition: { duration: 0.15 },
                   }}
                   transition={{
                     type: "spring",
                     stiffness: 350,
                     damping: 25,
                     mass: 1,
                   }}
                   className="flex items-center gap-1 shrink-0 whitespace-nowrap"
                >
                  <ChevronRight className="size-5 md:size-6 text-muted-foreground/40 shrink-0" />
                  <Link
                    href={item.href}
                    className={`capitalize hover:text-foreground transition-colors truncate ${
                      isLast
                        ? "text-foreground underline underline-offset-4 pointer-events-none text-xs md:text-lg"
                        : ""
                    }`}
                  >
                    {item.label}
                  </Link>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </motion.div>
    </LayoutGroup>
  );
}


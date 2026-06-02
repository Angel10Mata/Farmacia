"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Home, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";

// Regex para detectar UUIDs o IDs largos (más de 10 chars sin guion de separador de palabra)
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const SEGMENT_LABELS: Record<string, string> = {
  proyectos: "Proyectos",
  proyecto: "Proyectos",
  resumen: "Resumen",
  nuevo: "Nuevo Proyecto",
  editar: "Editar Proyecto",
  clientes: "Clientes",
};

export function BreadcrumbNav() {
  const pathname = usePathname();

  if (pathname === "/kore") return null;

  const cleanPathname = pathname.replace(/\/$/, "");
  const isClientes = cleanPathname === "/kore/clientes";

  const rawSegments = pathname.split("/").filter((item) => item !== "");

  // Filtramos UUIDs — el segmento "editar" ya contiene toda la info necesaria
  const segments = isClientes
    ? ["kore", "resumen", "clientes"]
    : rawSegments.filter((seg) => !UUID_REGEX.test(seg));

  const parentPath =
    segments.length > 1 ? `/${segments.slice(0, -1).join("/")}` : "/kore";

  // Para "editar", el back debe ir a /kore/proyectos (lista)
  const isEditPage = rawSegments.includes("editar");
  const backHref = isEditPage
    ? "/kore/proyectos"
    : isClientes
    ? "/kore/proyectos"
    : parentPath;

  const getSegmentLabel = (segment: string) =>
    SEGMENT_LABELS[segment] ?? segment.replace(/-/g, " ");

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
            <ArrowLeft className="size-4 md:size-5 transition-transform group-hover:-translate-x-1" />
          </Link>
        </motion.div>

        <motion.div layout="position" className="flex items-center">
          <Link
            href="/kore"
            className="hover:text-foreground transition-colors p-1 shrink-0 flex items-center"
          >
            <Home className="size-4 md:size-5" />
          </Link>
        </motion.div>

        <div className="flex items-center gap-1 overflow-hidden mask-gradient">
          <AnimatePresence mode="popLayout" initial={false}>
            {segments.map((segment, index) => {
              if (segment === "kore") return null;

              const href = isClientes
                ? segment === "resumen"
                  ? "/kore/proyectos"
                  : "/kore/clientes"
                : `/${segments.slice(0, index + 1).join("/")}`;

              const isLast = index === segments.length - 1;

              return (
                <motion.div
                  layout="position"
                  key={href}
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
                  <ChevronRight className="size-4 md:size-5 text-muted-foreground/40 shrink-0" />
                  <Link
                    href={href}
                    className={`capitalize hover:text-foreground transition-colors truncate ${
                      isLast
                        ? "text-foreground underline underline-offset-4 pointer-events-none text-xs md:text-lg"
                        : ""
                    }`}
                  >
                    {getSegmentLabel(segment)}
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

"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Home, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";

const isDynamicId = (seg: string): boolean => {
  if (!seg) return false;
  // 1. UUID estándar (con o sin guiones, 32 o 36 caracteres hex)
  if (/^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?-?[0-9a-f]{12}$/i.test(seg)) return true;
  // 2. Formato de código corto (e.g. 056-AC7)
  if (/^[0-9a-z]{3}-[0-9a-z]{3}$/i.test(seg)) return true;
  // 3. Secuencia numérica pura (e.g. IDs incrementales en BD)
  if (/^\d+$/.test(seg)) return true;
  // 4. Hashes y ObjectIds (cadenas hexadecimales de 20+ caracteres)
  if (/^[0-9a-f]{20,}$/i.test(seg)) return true;
  return false;
};

const SEGMENT_LABELS: Record<string, string> = {
  kore: "Kore",
  proyectos: "Proyectos",
  proyecto: "Proyectos",
  resumen: "Dashboard",
  nuevo: "Nuevo",
  editar: "Editar",
  detalle: "Detalle",
  clientes: "Clientes",
  admin: "Administración",
  configuraciones: "Configuraciones",
  dispositivos: "Dispositivos de Acceso",
  usuarios: "Gestión de Usuarios",
};

export function BreadcrumbNav() {
  const pathname = usePathname();

  if (pathname === "/kore") return null;

  const cleanPathname = pathname.replace(/\/$/, "");
  const isClientes = cleanPathname === "/kore/clientes";

  const rawSegments = pathname.split("/").filter((item) => item !== "");

  // Filtramos UUIDs y otros IDs dinámicos
  const segments = isClientes
    ? ["kore", "resumen", "clientes"]
    : rawSegments.filter((seg) => !isDynamicId(seg));

  const parentPath =
    segments.length > 1 ? `/${segments.slice(0, -1).join("/")}` : "/kore";

  // Para "editar" o "detalle", el back debe ir a /kore/proyectos (lista)
  const isEditOrDetailPage = rawSegments.includes("editar") || rawSegments.includes("detalle");
  const backHref = isEditOrDetailPage
    ? "/kore/proyectos"
    : isClientes
    ? "/kore/proyectos"
    : parentPath;

  const getSegmentLabel = (segment: string): string | null =>
    SEGMENT_LABELS[segment] ?? null;

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
            {segments.map((segment, index) => {
              const label = getSegmentLabel(segment);
              // Si el segmento no tiene etiqueta conocida, lo omitimos por completo
              if (!label) return null;

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
                  <ChevronRight className="size-5 md:size-6 text-muted-foreground/40 shrink-0" />
                  <Link
                    href={href}
                    className={`capitalize hover:text-foreground transition-colors truncate ${
                      isLast
                        ? "text-foreground underline underline-offset-4 pointer-events-none text-xs md:text-lg"
                        : ""
                    }`}
                  >
                    {label}
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

"use client";

import { useRef, useState, useEffect } from "react";
import { QRCode } from "react-qrcode-logo";
import { X, Download, QrCode, ChevronLeft, ArrowLeft, Home, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Swal from "sweetalert2";
import { updateProyectoOtrosCampos } from "@/app/kore/proyectos/actions";
import { useTheme } from "next-themes";
import Link from "next/link";
import { usePathname } from "next/navigation";

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

interface QRProyectoProps {
  proyecto: {
    id: string;
    nombre: string;
    cliente_nombre?: string;
    vendedor_nombre?: string;
    desarrollador_nombre?: string;
    estado?: string;
    otros_campos?: any;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function QRProyecto({ proyecto, isOpen, onClose, onSuccess }: QRProyectoProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname() || "";
  const rawSegments = pathname.split("/").filter((item) => item !== "");
  const segments = rawSegments.filter((seg) => !isDynamicId(seg));

  const getSegmentLabel = (segment: string) =>
    SEGMENT_LABELS[segment] ?? segment.replace(/-/g, " ");
  const { theme } = useTheme();
  
  // Estados para credenciales y URL de acceso manuales
  const [usuarioAcceso, setUsuarioAcceso] = useState("");
  const [passAcceso, setPassAcceso] = useState("");
  const [urlAcceso, setUrlAcceso] = useState("");
  const [saving, setSaving] = useState(false);

  // Inicializar URL y cargar campos guardados al abrir el modal o cambiar de proyecto
  useEffect(() => {
    if (isOpen && proyecto) {
      const otros = proyecto.otros_campos || {};
      setUsuarioAcceso(otros.usuario_acceso || "");
      setPassAcceso(otros.pass_acceso || "");
      
      const isLocalhost = typeof window !== "undefined" && (window.location.hostname.includes("localhost") || window.location.hostname.includes("127.0.0.1"));
      const origin = typeof window !== "undefined" && !isLocalhost ? window.location.origin : "https://koreapp.vercel.app";
      setUrlAcceso(otros.url_acceso || `${origin}/login`);
    }
  }, [isOpen, proyecto]);

  const handleSave = async () => {
    if (!proyecto) return;
    setSaving(true);
    try {
      const res = await updateProyectoOtrosCampos(proyecto.id, {
        usuario_acceso: usuarioAcceso.trim(),
        pass_acceso: passAcceso.trim(),
        url_acceso: urlAcceso.trim(),
      });

      const isDark = theme === "dark";
      if (res.error) {
        Swal.fire({
          icon: "error",
          title: "Error al guardar",
          text: res.error,
          background: isDark ? "#18181b" : "#ffffff",
          color: isDark ? "#ffffff" : "#000000",
        });
      } else {
        Swal.fire({
          icon: "success",
          title: "Credenciales guardadas",
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 3000,
          background: isDark ? "#18181b" : "#ffffff",
          color: isDark ? "#ffffff" : "#000000",
        });
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (err: any) {
      const isDark = theme === "dark";
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "Error al intentar guardar",
        background: isDark ? "#18181b" : "#ffffff",
        color: isDark ? "#ffffff" : "#000000",
      });
    } finally {
      setSaving(false);
    }
  };

  if (!proyecto) return null;

  // Código corto del proyecto
  const code = proyecto.id.replace(/-/g, "").slice(0, 6).toUpperCase();
  const shortCode = code.slice(0, 3) + "-" + code.slice(3, 6);

  // URL del proyecto (enlace de compartición pública con parámetros manuales opcionales)
  const isLocal = typeof window !== "undefined" && (window.location.hostname.includes("localhost") || window.location.hostname.includes("127.0.0.1"));
  const baseUrl = typeof window !== "undefined" && !isLocal ? window.location.origin : "https://koreapp.vercel.app";
  
  // Construir la URL simplificada usando solo el ID para que los cuadros del QR sean más grandes
  const shareUrl = `${baseUrl}/proyecto?id=${proyecto.id}`;

  // El QR debe contener la URL directa para que el celular la abra al escanear
  const qrValue = shareUrl;

  const handleDownload = () => {
    const canvas = canvasRef.current?.querySelector("canvas");
    if (!canvas) return;

    // Crear canvas con padding y branding
    const padding = 32;
    const labelH = 80;
    const finalCanvas = document.createElement("canvas");
    finalCanvas.width = canvas.width + padding * 2;
    finalCanvas.height = canvas.height + padding * 2 + labelH;

    const ctx = finalCanvas.getContext("2d");
    if (!ctx) return;

    // Fondo oscuro
    ctx.fillStyle = "#09090b";
    ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

    // Borde redondeado decorativo
    ctx.strokeStyle = "#B7494E";
    ctx.lineWidth = 2;
    ctx.strokeRect(8, 8, finalCanvas.width - 16, finalCanvas.height - 16);

    // Título KORE
    ctx.fillStyle = "#B7494E";
    ctx.font = "bold 20px helvetica, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("KORE", finalCanvas.width / 2, 36);

    ctx.fillStyle = "#a1a1aa";
    ctx.font = "10px helvetica, sans-serif";
    ctx.fillText("SISTEMA INTEGRAL DE GESTIÓN", finalCanvas.width / 2, 52);

    // QR centrado
    ctx.drawImage(canvas, padding, padding + 60);

    // Info debajo del QR
    const infoY = padding + 60 + canvas.height + 16;
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 13px helvetica, sans-serif";
    ctx.fillText(proyecto.nombre, finalCanvas.width / 2, infoY);

    ctx.fillStyle = "#71717a";
    ctx.font = "10px helvetica, sans-serif";
    ctx.fillText(`${proyecto.cliente_nombre || "N/A"} · ${proyecto.vendedor_nombre || "N/A"}`, finalCanvas.width / 2, infoY + 18);

    ctx.fillStyle = "#B7494E";
    ctx.font = "bold 11px monospace";
    ctx.fillText(shortCode, finalCanvas.width / 2, infoY + 36);

    // Descargar
    const link = document.createElement("a");
    link.download = `qr-${shortCode}.png`;
    link.href = finalCanvas.toDataURL("image/png");
    link.click();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
          className="fixed inset-0 z-[110] bg-background flex flex-col w-screen h-screen min-h-0 overflow-hidden text-zinc-900 dark:text-zinc-100"
        >
          {/* Header with Breadcrumbs */}
          <div className="flex items-center p-4 sm:p-5 border-b border-border dark:border-white/10 bg-muted/5 shrink-0 w-full overflow-hidden">
            <div className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-base font-medium text-muted-foreground overflow-hidden whitespace-nowrap">
              <button
                type="button"
                onClick={onClose}
                className="group flex items-center justify-center hover:text-foreground transition-colors cursor-pointer mr-1"
                title="Atrás"
              >
                <ArrowLeft className="size-5 md:size-6 transition-transform group-hover:-translate-x-1" />
              </button>

              <Link
                href="/kore"
                className="hover:text-foreground transition-colors p-1 shrink-0 flex items-center"
              >
                <Home className="size-5 md:size-6" />
              </Link>

              {segments.map((segment, index) => {
                const isLastPageSegment = index === segments.length - 1;
                const label = getSegmentLabel(segment);

                if (isLastPageSegment) {
                  return (
                    <div key={segment} className="flex items-center gap-1.5 md:gap-2 shrink-0">
                      <ChevronRight className="size-5 md:size-6 text-muted-foreground/40 shrink-0" />
                      <button
                        type="button"
                        onClick={onClose}
                        className="capitalize hover:text-foreground transition-colors truncate cursor-pointer"
                      >
                        {label}
                      </button>
                    </div>
                  );
                }

                const href = `/${segments.slice(0, index + 1).join("/")}`;

                return (
                  <div key={href} className="flex items-center gap-1.5 md:gap-2 shrink-0">
                    <ChevronRight className="size-5 md:size-6 text-muted-foreground/40 shrink-0" />
                    <Link
                      href={href}
                      className="capitalize hover:text-foreground transition-colors truncate"
                    >
                      {label}
                    </Link>
                  </div>
                );
              })}

              <ChevronRight className="size-5 md:size-6 text-muted-foreground/40 shrink-0" />

              <span className="capitalize text-foreground underline underline-offset-4 pointer-events-none text-xs md:text-lg font-black text-celeste-kore shrink-0">
                QR del Proyecto
              </span>
            </div>
          </div>

          {/* QR Content */}
          <div className="flex-1 overflow-y-auto flex flex-col items-center px-6 py-6 gap-5 custom-scrollbar max-w-lg mx-auto w-full">
            {/* QR Code */}
            <div
              ref={canvasRef}
              className="p-6 bg-white rounded-2xl shrink-0 border border-zinc-200/80 shadow-md"
            >
              <QRCode
                value={qrValue}
                size={280}
                bgColor="#ffffff"
                fgColor="#09090b"
                ecLevel="H"
                qrStyle="dots"
                logoImage="/kore/kore.png"
                logoWidth={96}
                logoHeight={54}
                logoPadding={5}
                logoPaddingStyle="square"
                removeQrCodeBehindLogo={true}
                eyeRadius={10}
              />
            </div>

            {/* Formulario de Configuración de Acceso manual */}
            <div className="w-full flex flex-col gap-2.5 bg-muted/20 dark:bg-white/5 border border-border dark:border-white/10 rounded-2xl p-4 shrink-0">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#B7494E]">
                Configurar Acceso Cliente
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1 text-left">
                  <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Usuario</label>
                  <input
                    type="text"
                    placeholder="Ej: cliente12"
                    value={usuarioAcceso}
                    onChange={(e) => setUsuarioAcceso(e.target.value)}
                    className="w-full bg-background dark:bg-zinc-900 border border-border dark:border-white/10 rounded-xl px-3 py-2 text-xs text-foreground dark:text-white focus:border-[#B7494E]/50 outline-none transition-all placeholder:text-muted-foreground/30"
                  />
                </div>
                <div className="flex flex-col gap-1 text-left">
                  <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Contraseña</label>
                  <input
                    type="text"
                    placeholder="Ej: 123456"
                    value={passAcceso}
                    onChange={(e) => setPassAcceso(e.target.value)}
                    className="w-full bg-background dark:bg-zinc-900 border border-border dark:border-white/10 rounded-xl px-3 py-2 text-xs text-foreground dark:text-white focus:border-[#B7494E]/50 outline-none transition-all placeholder:text-muted-foreground/30"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1 text-left">
                <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">URL de Acceso</label>
                <input
                  type="text"
                  placeholder="URL de entrada"
                  value={urlAcceso}
                  onChange={(e) => setUrlAcceso(e.target.value)}
                  className="w-full bg-background dark:bg-zinc-900 border border-border dark:border-white/10 rounded-xl px-3 py-2 text-xs text-foreground dark:text-white focus:border-[#B7494E]/50 outline-none transition-all placeholder:text-muted-foreground/30"
                />
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className="mt-1.5 w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-[#B7494E]/10 hover:bg-[#B7494E]/20 text-[#B7494E] font-black text-[10px] tracking-widest uppercase border border-[#B7494E]/20 hover:border-[#B7494E]/30 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                {saving ? "Guardando..." : "Guardar Credenciales"}
              </button>
            </div>

            {/* Info Cards */}
            <div className="w-full grid grid-cols-1 gap-2 shrink-0">
              <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-muted/20 dark:bg-white/5 border border-border dark:border-white/10">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Código</span>
                <code className="text-xs font-mono font-bold text-[#B7494E] bg-[#B7494E]/10 px-2 py-0.5 rounded border border-[#B7494E]/20">
                  {shortCode}
                </code>
              </div>
              <div className="flex flex-col items-start gap-0.5 px-4 py-2.5 rounded-xl bg-muted/20 dark:bg-white/5 border border-border dark:border-white/10 text-left">
                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Cliente</span>
                <span className="text-xs font-bold text-foreground dark:text-white break-words w-full">{proyecto.cliente_nombre || "N/A"}</span>
              </div>
              <div className="flex flex-col items-start gap-0.5 px-4 py-2.5 rounded-xl bg-muted/20 dark:bg-white/5 border border-border dark:border-white/10 text-left">
                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Vendedor</span>
                <span className="text-xs font-bold text-foreground dark:text-white break-words w-full">{proyecto.vendedor_nombre || "N/A"}</span>
              </div>
              <div className="flex flex-col items-start gap-0.5 px-4 py-2.5 rounded-xl bg-muted/20 dark:bg-white/5 border border-border dark:border-white/10 text-left">
                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Desarrollador</span>
                <span className="text-xs font-bold text-foreground dark:text-white break-words w-full">{proyecto.desarrollador_nombre || "N/A"}</span>
              </div>
            </div>

            {/* Download Button */}
            <button
              onClick={handleDownload}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#B7494E] hover:bg-[#B7494E]/90 text-white font-black text-sm tracking-wider transition-all active:scale-[0.98] shadow-lg shadow-[#B7494E]/20 cursor-pointer shrink-0"
            >
              <Download size={16} />
              DESCARGAR QR
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

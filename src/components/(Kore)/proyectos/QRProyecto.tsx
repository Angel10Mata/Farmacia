"use client";

import { useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { X, Download, QrCode } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface QRProyectoProps {
  proyecto: {
    id: string;
    nombre: string;
    cliente_nombre?: string;
    vendedor_nombre?: string;
    estado?: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function QRProyecto({ proyecto, isOpen, onClose }: QRProyectoProps) {
  const canvasRef = useRef<HTMLDivElement>(null);

  if (!proyecto) return null;

  // Código corto del proyecto
  const code = proyecto.id.replace(/-/g, "").slice(0, 6).toUpperCase();
  const shortCode = code.slice(0, 3) + "-" + code.slice(3, 6);

  // URL del proyecto (usamos el hostname actual + path)
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://koreapp.vercel.app";
  const proyectoUrl = `${baseUrl}/kore/proyectos`;

  // Contenido del QR: datos concatenados en formato legible
  const qrValue = [
    `KORE | Proyecto`,
    `Código: ${shortCode}`,
    `Nombre: ${proyecto.nombre}`,
    `Cliente: ${proyecto.cliente_nombre || "N/A"}`,
    `Vendedor: ${proyecto.vendedor_nombre || "N/A"}`,
    `Estado: ${proyecto.estado || "N/A"}`,
    `URL: ${proyectoUrl}`,
  ].join("\n");

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
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm bg-zinc-950 border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#B7494E]/10 border border-[#B7494E]/20 flex items-center justify-center">
                  <QrCode size={18} className="text-[#B7494E]" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#B7494E]">
                    QR del Proyecto
                  </p>
                  <p className="text-xs font-bold text-white truncate max-w-[180px]">
                    {proyecto.nombre}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-white/5 transition-colors text-zinc-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* QR Content */}
            <div className="flex flex-col items-center px-6 py-6 gap-5">
              {/* QR Code */}
              <div
                ref={canvasRef}
                className="p-4 bg-white rounded-2xl shadow-xl shadow-black/50"
              >
                <QRCodeCanvas
                  value={qrValue}
                  size={200}
                  bgColor="#ffffff"
                  fgColor="#09090b"
                  level="H"
                  imageSettings={{
                    src: "/kore/kore-light.png",
                    x: undefined,
                    y: undefined,
                    height: 36,
                    width: 36,
                    excavate: true,
                  }}
                />
              </div>

              {/* Info Cards */}
              <div className="w-full grid grid-cols-1 gap-2">
                <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Código</span>
                  <code className="text-xs font-mono font-bold text-[#B7494E] bg-[#B7494E]/10 px-2 py-0.5 rounded border border-[#B7494E]/20">
                    {shortCode}
                  </code>
                </div>
                <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Cliente</span>
                  <span className="text-xs font-bold text-white">{proyecto.cliente_nombre || "N/A"}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Vendedor</span>
                  <span className="text-xs font-bold text-white">{proyecto.vendedor_nombre || "N/A"}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Estado</span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border ${
                    proyecto.estado === "En Progreso"
                      ? "text-[#B7494E] bg-[#B7494E]/10 border-[#B7494E]/20"
                      : "text-zinc-400 bg-zinc-800 border-zinc-700"
                  }`}>
                    {proyecto.estado || "N/A"}
                  </span>
                </div>
                <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">URL</span>
                  <span className="text-[10px] font-mono text-zinc-400 truncate max-w-[180px]">{proyectoUrl}</span>
                </div>
              </div>

              {/* Download Button */}
              <button
                onClick={handleDownload}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#B7494E] hover:bg-[#B7494E]/90 text-white font-black text-sm tracking-wider transition-all active:scale-[0.98] shadow-lg shadow-[#B7494E]/20"
              >
                <Download size={16} />
                DESCARGAR QR
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

"use client";

import { useRef, useState, useEffect } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { X, Download, QrCode } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Swal from "sweetalert2";
import { updateProyectoOtrosCampos } from "@/app/kore/proyectos/actions";

interface QRProyectoProps {
  proyecto: {
    id: string;
    nombre: string;
    cliente_nombre?: string;
    vendedor_nombre?: string;
    estado?: string;
    otros_campos?: any;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function QRProyecto({ proyecto, isOpen, onClose, onSuccess }: QRProyectoProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  
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

      if (res.error) {
        Swal.fire({
          icon: "error",
          title: "Error al guardar",
          text: res.error,
          background: "#18181b",
          color: "#fff",
        });
      } else {
        Swal.fire({
          icon: "success",
          title: "Credenciales guardadas",
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 3000,
          background: "#18181b",
          color: "#fff",
        });
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "Error al intentar guardar",
        background: "#18181b",
        color: "#fff",
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
  
  // Construir la URL agregando de forma condicional la URL de acceso (excluyendo credenciales para mantener el QR estático)
  let shareUrl = `${baseUrl}/proyecto?id=${proyecto.id}&c=${encodeURIComponent(shortCode)}&n=${encodeURIComponent(proyecto.nombre)}&cl=${encodeURIComponent(proyecto.cliente_nombre || "N/A")}&v=${encodeURIComponent(proyecto.vendedor_nombre || "N/A")}`;
  
  if (urlAcceso.trim()) {
    shareUrl += `&url=${encodeURIComponent(urlAcceso.trim())}`;
  }

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
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[110] flex items-center justify-center p-4"
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
                  size={256}
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

              {/* Formulario de Configuración de Acceso manual */}
              <div className="w-full flex flex-col gap-2.5 bg-white/5 border border-white/10 rounded-2xl p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#B7494E]">
                  Configurar Acceso Cliente
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1 text-left">
                    <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Usuario</label>
                    <input
                      type="text"
                      placeholder="Ej: cliente12"
                      value={usuarioAcceso}
                      onChange={(e) => setUsuarioAcceso(e.target.value)}
                      className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-[#B7494E]/50 outline-none transition-all placeholder:text-zinc-600"
                    />
                  </div>
                  <div className="flex flex-col gap-1 text-left">
                    <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Contraseña</label>
                    <input
                      type="text"
                      placeholder="Ej: 123456"
                      value={passAcceso}
                      onChange={(e) => setPassAcceso(e.target.value)}
                      className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-[#B7494E]/50 outline-none transition-all placeholder:text-zinc-600"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1 text-left">
                  <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">URL de Acceso</label>
                  <input
                    type="text"
                    placeholder="URL de entrada"
                    value={urlAcceso}
                    onChange={(e) => setUrlAcceso(e.target.value)}
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-[#B7494E]/50 outline-none transition-all placeholder:text-zinc-600"
                  />
                </div>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="mt-1.5 w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-[#B7494E]/10 hover:bg-[#B7494E]/20 text-[#B7494E] font-black text-[10px] tracking-widest uppercase border border-[#B7494E]/20 hover:border-[#B7494E]/30 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {saving ? "Guardando..." : "Guardar Credenciales"}
                </button>
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

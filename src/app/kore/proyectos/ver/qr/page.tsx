"use client";

import { useRef, useState, useEffect } from "react";
import { QRCode } from "react-qrcode-logo";
import { ArrowLeft, Download, RefreshCw } from "lucide-react";
import Swal from "sweetalert2";
import { getProyectos, updateProyectoOtrosCampos } from "@/components/(Kore)/proyectos/lib/actions";
import { useTheme } from "next-themes";
import { useParams, useRouter } from "next/navigation";
import { useUserContext } from "@/components/(base)/providers/UserProvider";

const getCode = (id: string) => {
  if (!id) return "";
  const clean = id.replace(/-/g, "").slice(0, 6).toUpperCase();
  return clean.slice(0, 3) + "-" + clean.slice(3, 6);
};

export default function ProyectoQRPage() {
  const [paramId, setParamId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const id = sessionStorage.getItem('selectedProyectoId');
    if (id) {
      setParamId(id);
    } else {
      router.replace('/kore/proyectos');
    }
  }, [router]);
  const { resolvedTheme } = useTheme();
  const { effectiveRole } = useUserContext();

  const [proyecto, setProyecto] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);
  
  // Estados para credenciales y URL de acceso manuales
  const [usuarioAcceso, setUsuarioAcceso] = useState("");
  const [passAcceso, setPassAcceso] = useState("");
  const [urlAcceso, setUrlAcceso] = useState("");
  const [saving, setSaving] = useState(false);

  // Guard de rol
  useEffect(() => {
    if (!["super", "admin", "proyectos"].includes(effectiveRole)) {
      router.replace("/kore");
    }
  }, [effectiveRole, router]);

  // Cargar proyecto
  useEffect(() => {
    if (!paramId) return;
    let active = true;
    setLoading(true);
    getProyectos()
      .then((data) => {
        if (!active) return;
        const found = data.find((p: any) => p.id === paramId || getCode(p.id) === paramId);
        if (found) {
          setProyecto(found);
          const otros: any = found.otros_campos || {};
          setUsuarioAcceso(otros.usuario_acceso || "");
          setPassAcceso(otros.pass_acceso || "");
          
          const isLocalhost = typeof window !== "undefined" && (window.location.hostname.includes("localhost") || window.location.hostname.includes("127.0.0.1"));
          const origin = typeof window !== "undefined" && !isLocalhost ? window.location.origin : "https://koreapp.vercel.app";
          setUrlAcceso(otros.url_acceso || `${origin}/login`);
        } else {
          setNotFound(true);
        }
      })
      .catch(() => { if (active) setNotFound(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [paramId]);

  const handleSave = async () => {
    if (!proyecto) return;
    setSaving(true);
    const isDark = typeof window !== "undefined" && document.documentElement.classList.contains("dark");
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
          background: isDark ? "#09090b" : "#ffffff",
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
          background: isDark ? "#09090b" : "#ffffff",
          color: isDark ? "#ffffff" : "#000000",
        });
      }
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "Error al intentar guardar",
        background: isDark ? "#09090b" : "#ffffff",
        color: isDark ? "#ffffff" : "#000000",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 pt-32 md:p-8 md:pt-24">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <RefreshCw size={32} className="animate-spin text-celeste-kore" />
          <p className="text-sm font-bold uppercase tracking-widest">Cargando código QR…</p>
        </div>
      </div>
    );
  }

  if (notFound || !proyecto) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 pt-32 md:p-8 md:pt-24">
        <div className="text-center space-y-3">
          <p className="text-lg font-black text-foreground">Proyecto no encontrado</p>
          <p className="text-sm text-muted-foreground">El proyecto solicitado no existe o fue eliminado.</p>
        </div>
      </div>
    );
  }

  const code = proyecto.id.replace(/-/g, "").slice(0, 6).toUpperCase();
  const shortCode = code.slice(0, 3) + "-" + code.slice(3, 6);
  const isLocal = typeof window !== "undefined" && (window.location.hostname.includes("localhost") || window.location.hostname.includes("127.0.0.1"));
  const baseUrl = typeof window !== "undefined" && !isLocal ? window.location.origin : "https://koreapp.vercel.app";
  const shareUrl = `${baseUrl}/proyecto?id=${proyecto.id}`;
  const qrValue = shareUrl;

  const handleDownload = () => {
    const canvas = canvasRef.current?.querySelector("canvas");
    if (!canvas) return;

    const padding = 32;
    const labelH = 80;
    const finalCanvas = document.createElement("canvas");
    finalCanvas.width = canvas.width + padding * 2;
    finalCanvas.height = canvas.height + padding * 2 + labelH;

    const ctx = finalCanvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#09090b";
    ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

    ctx.strokeStyle = "#B7494E";
    ctx.lineWidth = 2;
    ctx.strokeRect(8, 8, finalCanvas.width - 16, finalCanvas.height - 16);

    ctx.fillStyle = "#B7494E";
    ctx.font = "bold 20px helvetica, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("KORE", finalCanvas.width / 2, 36);

    ctx.fillStyle = "#a1a1aa";
    ctx.font = "10px helvetica, sans-serif";
    ctx.fillText("SISTEMA INTEGRAL DE GESTIÓN", finalCanvas.width / 2, 52);

    ctx.drawImage(canvas, padding, padding + 60);

    const infoY = padding + 60 + canvas.height + 16;
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 13px helvetica, sans-serif";
    ctx.fillText(proyecto.nombre, finalCanvas.width / 2, infoY);

    ctx.fillStyle = "#71717a";
    ctx.font = "10px helvetica, sans-serif";
    ctx.fillText(`${proyecto.cliente_nombre || "N/A"}`, finalCanvas.width / 2, infoY + 18);

    const link = document.createElement("a");
    link.download = `qr-${shortCode}.png`;
    link.href = finalCanvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 px-4 pt-32 pb-16 md:px-8 md:pt-20">
      <title>{`Código QR: ${proyecto.nombre} | KORE BMS`}</title>

      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-4xl font-black tracking-tight mt-0.5 sm:mt-1 leading-none uppercase">
            CÓDIGO <br className="hidden sm:block" />
            <span className="text-celeste-kore">QR</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-1.5 uppercase font-black tracking-wider">
            {proyecto.nombre}
          </p>
        </div>
      </div>

      {/* 2-COLUMN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-8 items-start">
        {/* Left Column: QR and Download Action */}
        <div className="flex flex-col items-center gap-4">
          <div
            ref={canvasRef}
            className="p-6 bg-white rounded-3xl shrink-0 border border-zinc-200 dark:border-zinc-800 shadow-xl animate-fade-in flex items-center justify-center w-full"
          >
            <div className="w-full max-w-[280px] aspect-square flex items-center justify-center">
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
          </div>
        </div>

        {/* Right Column: Configuration and Project Info */}
        <div className="space-y-6">
          {/* Configuración Acceso Cliente Card */}
          <div className="rounded-2xl border border-border dark:border-white/10 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl shadow-md p-5 sm:p-6 space-y-4">
            <h3 className="text-[10px] sm:text-xs font-black text-[#B7494E] uppercase tracking-widest border-b border-zinc-200 dark:border-zinc-800/80 pb-1.5">
              Configurar Acceso Cliente
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1 text-left">
                <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Usuario</label>
                <input
                  type="text"
                  placeholder=""
                  value={usuarioAcceso}
                  onChange={(e) => setUsuarioAcceso(e.target.value)}
                  className="w-full bg-background dark:bg-zinc-950 border border-border dark:border-white/10 rounded-xl px-3 py-2 text-xs text-foreground dark:text-white focus:border-[#B7494E]/50 outline-none transition-all"
                />
              </div>

              <div className="flex flex-col gap-1 text-left">
                <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Contraseña</label>
                <input
                  type="text"
                  placeholder=""
                  value={passAcceso}
                  onChange={(e) => setPassAcceso(e.target.value)}
                  className="w-full bg-background dark:bg-zinc-950 border border-border dark:border-white/10 rounded-xl px-3 py-2 text-xs text-foreground dark:text-white focus:border-[#B7494E]/50 outline-none transition-all"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1 text-left">
              <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">URL de Acceso</label>
              <input
                type="text"
                placeholder=""
                value={urlAcceso}
                onChange={(e) => setUrlAcceso(e.target.value)}
                className="w-full bg-background dark:bg-zinc-950 border border-border dark:border-white/10 rounded-xl px-3 py-2 text-xs text-foreground dark:text-white focus:border-[#B7494E]/50 outline-none transition-all"
              />
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#B7494E]/10 hover:bg-[#B7494E]/20 text-[#B7494E] font-black text-[10px] tracking-widest uppercase border border-[#B7494E]/20 hover:border-[#B7494E]/30 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {saving ? "Guardando..." : "Guardar Credenciales"}
            </button>
          </div>

          {/* Información del Proyecto Card */}
          <div className="rounded-2xl border border-border dark:border-white/10 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl shadow-md p-5 sm:p-6 space-y-3">
            <h3 className="text-[10px] sm:text-xs font-black text-celeste-kore uppercase tracking-widest border-b border-zinc-200 dark:border-zinc-800/80 pb-1.5">
              Información del Proyecto
            </h3>

            <div className="grid grid-cols-1 gap-4">
              <div className="flex flex-col items-start gap-0.5 px-4 py-2.5 rounded-xl bg-muted/20 dark:bg-white/5 border border-border dark:border-white/10 text-left">
                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Cliente</span>
                <span className="text-xs font-bold text-foreground dark:text-white break-words w-full">
                  {proyecto.cliente_nombre || "N/A"}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handleDownload}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#B7494E] hover:bg-[#B7494E]/90 text-white font-black text-sm tracking-wider transition-all active:scale-[0.98] shadow-lg shadow-[#B7494E]/20 cursor-pointer"
          >
            <Download size={16} />
            DESCARGAR QR
          </button>
        </div>
      </div>
    </div>
  );
}

import { Metadata } from "next";
import Link from "next/link";
import { Briefcase, User, UserCheck, ArrowRight, Key } from "lucide-react";
import LogoKore from "@/components/(Kore)/logo/LogoKore";

export const metadata: Metadata = {
  title: "Kore | Detalle del Proyecto",
  description: "Consulta pública del estado y detalles del proyecto en Kore ERP.",
  other: {
    google: "notranslate",
  },
};

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ProyectoPublicPage({ searchParams }: PageProps) {
  const params = await searchParams;
  
  const code = typeof params.c === "string" ? params.c : "N/A";
  const nombre = typeof params.n === "string" ? params.n : "Proyecto sin nombre";
  const cliente = typeof params.cl === "string" ? params.cl : "N/A";
  const vendedor = typeof params.v === "string" ? params.v : "N/A";
  
  let usuario = typeof params.usr === "string" ? params.usr : null;
  let password = typeof params.pwd === "string" ? params.pwd : null;
  let loginUrl = typeof params.url === "string" ? params.url : "/login";

  const projectId = typeof params.id === "string" ? params.id : null;
  if (projectId) {
    try {
      const { createAdminClient } = await import("@/utils/supabase/admin");
      const adminSupabase = createAdminClient();
      const { data: dbProyecto } = await adminSupabase
        .from("proyectos")
        .select("otros_campos")
        .eq("id", projectId)
        .single();

      if (dbProyecto?.otros_campos) {
        const otros = dbProyecto.otros_campos as any;
        if (otros.usuario_acceso) usuario = otros.usuario_acceso;
        if (otros.pass_acceso) password = otros.pass_acceso;
        if (otros.url_acceso) loginUrl = otros.url_acceso;
      }
    } catch (err) {
      console.error("Error loading project access credentials from database:", err);
    }
  }

  // Formatear URL para asegurar que tenga protocolo absoluto si es externa
  const formatUrl = (url: string): string => {
    if (!url) return "/login";
    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/")) {
      return url;
    }
    return `https://${url}`;
  };

  const formattedLoginUrl = formatUrl(loginUrl);
  const isExternal = formattedLoginUrl.startsWith("http://") || formattedLoginUrl.startsWith("https://");

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col justify-between relative overflow-hidden select-none translate-y-0">
      {/* Luces de Fondo */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#B7494E]/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-900/10 blur-[120px] pointer-events-none" />

      {/* Header / Logo */}
      <header className="w-full flex justify-center pt-10 pb-4 z-10">
        <div className="flex flex-col items-center gap-2">
          <LogoKore scale={0.7} backgroundEffect="glow" />
          <p className="text-[9px] font-black tracking-[0.4em] text-zinc-500 uppercase">
            Plataforma de Verificación
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 md:p-6 z-10 w-full max-w-md mx-auto">
        <div className="w-full bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl relative">
          
          {/* Borde superior decorativo */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[40%] h-[2px] bg-gradient-to-r from-transparent via-[#B7494E] to-transparent" />

          {/* Icono del Proyecto */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#B7494E]/20 to-blue-500/10 border border-[#B7494E]/30 flex items-center justify-center shadow-inner shadow-[#B7494E]/20">
              <Briefcase className="size-8 text-[#B7494E]" />
            </div>
          </div>

          {/* Nombre y Código */}
          <div className="text-center mb-8">
            <span className="text-[10px] font-mono font-black uppercase tracking-widest text-[#B7494E] bg-[#B7494E]/10 px-3 py-1 rounded-full border border-[#B7494E]/20">
              Código: {code}
            </span>
            <h1 className="text-2xl font-black mt-4 text-white tracking-tight leading-tight">
              {nombre}
            </h1>
          </div>

          {/* Información Detallada */}
          <div className="space-y-4 mb-8">
            {/* Cliente */}
            <div className="flex items-center gap-4 p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
              <div className="p-2 bg-blue-500/10 rounded-xl text-blue-400">
                <User className="size-4" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Cliente</p>
                <p className="text-sm font-bold text-white mt-0.5">{cliente}</p>
              </div>
            </div>

            {/* Usuario (si existe) */}
            {usuario && (
              <div className="flex items-center gap-4 p-3 rounded-2xl bg-[#B7494E]/5 border border-[#B7494E]/10 hover:border-[#B7494E]/25 transition-colors">
                <div className="p-2 bg-[#B7494E]/10 rounded-xl text-[#B7494E]">
                  <UserCheck className="size-4" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-[9px] font-black uppercase tracking-widest text-[#B7494E]/80">Usuario</p>
                  <p className="text-sm font-mono font-bold text-white mt-0.5 select-all">{usuario}</p>
                </div>
              </div>
            )}

            {/* Contraseña (si existe) */}
            {password && (
              <div className="flex items-center gap-4 p-3 rounded-2xl bg-[#B7494E]/5 border border-[#B7494E]/10 hover:border-[#B7494E]/25 transition-colors">
                <div className="p-2 bg-[#B7494E]/10 rounded-xl text-[#B7494E]">
                  <Key className="size-4" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-[9px] font-black uppercase tracking-widest text-[#B7494E]/80">Contraseña</p>
                  <p className="text-sm font-mono font-bold text-white mt-0.5 select-all">{password}</p>
                </div>
              </div>
            )}
          </div>

          {/* Botón de Entrada */}
          {isExternal ? (
            <a
              href={formattedLoginUrl}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-[#B7494E] hover:bg-[#B7494E]/90 text-white font-black text-xs tracking-widest uppercase transition-all duration-300 active:scale-[0.98] shadow-lg shadow-[#B7494E]/20"
            >
              Entrar
              <ArrowRight className="size-4" />
            </a>
          ) : (
            <Link
              href={formattedLoginUrl}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-[#B7494E] hover:bg-[#B7494E]/90 text-white font-black text-xs tracking-widest uppercase transition-all duration-300 active:scale-[0.98] shadow-lg shadow-[#B7494E]/20"
            >
              Entrar
              <ArrowRight className="size-4" />
            </Link>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-8 text-center text-zinc-600 text-[10px] font-black uppercase tracking-[0.2em] z-10">
        © 2026 KoreAPP · Verificación Autorizada
      </footer>
    </div>
  );
}

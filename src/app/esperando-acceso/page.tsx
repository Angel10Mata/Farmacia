"use client";

import AnimatedIcon from "@/components/ui/AnimatedIcon";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { checkDeviceRequest, createDeviceRequest, notifyAdminsOfArrival } from "./actions";
import { Loader2, Lock, PhoneOff } from "lucide-react";
import Swal from "sweetalert2";
import { useTheme } from "next-themes";

export default function EsperandoAcceso() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason");
  const isDeviceLimit = reason === "limit";

  const [hasRequest, setHasRequest] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const { theme } = useTheme();

  useEffect(() => {
    if (isDeviceLimit) return; // No polling needed for limit case

    const verifyRequest = async () => {
      const exists = await checkDeviceRequest();
      setHasRequest(exists);
      // Notify admins that the user is on this page (only if not limit reached)
      await notifyAdminsOfArrival();
    };
    verifyRequest();

    const interval = setInterval(() => {
      router.refresh();
    }, 5000);

    return () => clearInterval(interval);
  }, [router, isDeviceLimit]);

  const handleCreateRequest = async () => {
    setLoading(true);
    const res = await createDeviceRequest();
    setLoading(false);

    const isDark = theme === "dark";

    if (res.success) {
      setHasRequest(true);
      Swal.fire({
        icon: "success",
        title: "Solicitud enviada",
        text: "El administrador revisará su solicitud pronto.",
        background: isDark ? "#09090b" : "#ffffff",
        color: isDark ? "#ffffff" : "#000000",
        confirmButtonColor: "#059669",
      });
    } else {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: res.error,
        background: isDark ? "#09090b" : "#ffffff",
        color: isDark ? "#ffffff" : "#000000",
        confirmButtonColor: "#ea580c",
      });
    }
  };

  // ── DEVICE LIMIT VIEW ──────────────────────────────────────────────
  if (isDeviceLimit) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
        <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 text-center shadow-2xl">
          <div className="mb-6 flex justify-center">
            <div className="p-4 bg-red-500/10 rounded-full">
              <PhoneOff className="size-16 text-red-500" />
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-2">Límite de dispositivos alcanzado</h1>
          <p className="text-muted-foreground mb-6">
            Ya tienes <strong>3 dispositivos</strong> autorizados en el sistema, que es el máximo permitido.
          </p>
          <div className="bg-red-500/5 border border-red-500/20 p-4 rounded-xl text-sm mb-6 text-red-600 dark:text-red-400">
            Para agregar un nuevo dispositivo, primero debes revocar el acceso a uno de los existentes o comunicarte con{" "}
            <strong>Soporte Técnico</strong>.
          </div>
          <a
            href="/login"
            className="inline-flex items-center justify-center gap-2 w-full bg-muted hover:bg-muted/80 border border-border text-foreground py-3 rounded-xl font-semibold transition-all active:scale-95"
          >
            Volver al inicio de sesión
          </a>
        </div>
      </div>
    );
  }

  // ── NORMAL PENDING VIEW ─────────────────────────────────────────────
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
      <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 text-center shadow-2xl">
        <div className="mb-6 flex justify-center">
          <div className="p-4 bg-amber-500/10 rounded-full">
            <AnimatedIcon iconKey="oskfhomm" className="size-20 text-white" />
          </div>
        </div>
        <h1 className="text-2xl font-bold mb-2">Acceso en espera</h1>
        <p className="text-muted-foreground mb-6">
          Su dispositivo está registrado pero aún no ha sido autorizado.
        </p>
        <div className="bg-muted/50 p-4 rounded-xl text-sm mb-6 border border-border italic">
          Por favor, solicite su acceso al departamento de sistemas.
        </div>
        {!hasRequest && (
          <button
            onClick={handleCreateRequest}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground py-3 rounded-xl font-semibold transition-all disabled:opacity-50 active:scale-95"
          >
            {loading ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <Lock className="size-5" />
            )}
            Volver a enviar solicitud
          </button>
        )}
      </div>
    </div>
  );
}

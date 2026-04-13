"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Trash2, Fingerprint, Plus } from "lucide-react";
import { MagicCard } from "@/components/ui/magic-card";
import { cn } from "@/lib/utils";
import Swal from "sweetalert2";
import {
  getRegistrationOptions,
  verifyRegistration,
  getPasskeys,
  removePasskey,
  PasskeyDevice,
} from "@/components/(base)/(auth)/login/passkeys/passkeys-actions";
import { startRegistration } from "@simplewebauthn/browser";
import AnimatedIcon from "@/components/ui/AnimatedIcon";

interface PassKeysModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
}

export default function PassKeysModal({ isOpen, onClose, user }: PassKeysModalProps) {
  const [passkeys, setPasskeys] = useState<PasskeyDevice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const passkeyCount = passkeys.length;

  const fetchPasskeys = useCallback(async () => {
    if (!user) return;
    const data = await getPasskeys();
    setPasskeys(data);
  }, [user]);

  useEffect(() => {
    if (isOpen) fetchPasskeys();
  }, [isOpen, fetchPasskeys]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleDeletePasskey = async (id: string, name: string) => {
    const isDark = document.documentElement.classList.contains("dark");
    const result = await Swal.fire({
      title: "¿Eliminar dispositivo?",
      text: `Se revocará el acceso desde "${name}".`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: isDark ? "#3f3f46" : "#e4e4e7",
      confirmButtonText: "Eliminar",
      cancelButtonText: "Cancelar",
      background: isDark ? "#09090b" : "#ffffff",
      color: isDark ? "#ffffff" : "#000000",
    });
    
    if (result.isConfirmed) {
      const ok = await removePasskey(id);
      if (ok) {
        setPasskeys((prev) => prev.filter((p) => p.id !== id));
      } else {
        Swal.fire({
          title: "Error",
          text: "No se pudo eliminar el dispositivo.",
          icon: "error",
          background: isDark ? "#09090b" : "#ffffff",
          color: isDark ? "#ffffff" : "#000000",
        });
      }
    }
  };

  const handleRegisterPasskey = async () => {
    const isDark = document.documentElement.classList.contains("dark");

    if (passkeyCount >= 3) {
      Swal.fire({
        title: "Límite alcanzado",
        text: "Solo puedes tener un máximo de 3 dispositivos seguros.",
        icon: "warning",
        background: isDark ? "#09090b" : "#ffffff",
        color: isDark ? "#ffffff" : "#000000",
      });
      return;
    }

    const { value: deviceName } = await Swal.fire({
      title: "Identifica tu dispositivo",
      input: "text",
      inputLabel: "Dale un nombre para reconocerlo (Ej. Mi iPhone)",
      inputPlaceholder: "Nombre del dispositivo...",
      showCancelButton: true,
      confirmButtonText: "Configurar",
      cancelButtonText: "Cancelar",
      background: isDark ? "#09090b" : "#ffffff",
      color: isDark ? "#ffffff" : "#000000",
      inputValidator: (value) => {
        if (!value.trim()) {
          return "Por favor ingresa un nombre válido";
        }
      }
    });

    if (!deviceName) return;

    setIsLoading(true);
    try {
      const options = await getRegistrationOptions();
      const regResp = await startRegistration({ optionsJSON: options });
      const verification = await verifyRegistration(regResp, deviceName.trim());

      if (verification.success) {
        localStorage.setItem("cermad-device-passkey-enabled", "true");
        fetchPasskeys();
        Swal.fire({
          title: "¡Éxito!",
          text: "Dispositivo registrado correctamente",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
          background: isDark ? "#09090b" : "#ffffff",
          color: isDark ? "#ffffff" : "#000000",
        });
      } else {
        Swal.fire({
          title: "Error de Base de Datos",
          text: verification.error || "Fallo desconocido al guardar.",
          icon: "error",
          background: isDark ? "#09090b" : "#ffffff",
          color: isDark ? "#ffffff" : "#000000",
        });
      }
    } catch (error: any) {
      if (error.name === "InvalidStateError") {
        localStorage.setItem("cermad-device-passkey-enabled", "true");
        Swal.fire({
          title: "Dispositivo ya registrado",
          text: "Este dispositivo ya se encuentra en tu lista de dispositivos seguros.",
          icon: "info",
          background: isDark ? "#09090b" : "#ffffff",
          color: isDark ? "#ffffff" : "#000000",
        });
      } else if (error.name !== "NotAllowedError" && error.name !== "AbortError") {
        alert("Error de hardware/navegador: " + error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-md p-10">
      <MagicCard
        className="w-full sm:max-w-md h-fit flex flex-col rounded-3xl border border-border/60 bg-card overflow-hidden transition-all duration-300 shadow-none"
      >
        <div className="relative shrink-0 px-6 pt-6 pb-4 border-b border-border/40 bg-muted/5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <div className="shrink-0 relative aspect-square h-12 w-12 rounded-2xl bg-background p-1 border border-border/60">
                <div className="h-full w-full rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                  <Fingerprint className="h-6 w-6" />
                </div>
              </div>

              <div className="min-w-0">
                <h2 className="text-lg font-bold tracking-tight text-foreground truncate">
                  Ingreso Seguro
                </h2>
                <div className="mt-1 flex items-center">
                  <div className="flex items-center bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider">
                    {passkeyCount} / 3 DISPOSITIVOS
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="shrink-0 p-2 text-muted-foreground hover:bg-muted rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-background/50 custom-scrollbar max-h-[60vh]">
          {passkeys.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
              <Fingerprint className="size-12 mb-3 opacity-20" />
              <p className="text-sm font-medium">No hay dispositivos registrados.</p>
              <p className="text-xs opacity-70 mt-1 max-w-[250px]">
                Añade tu huella, rostro o PIN para iniciar sesión de forma rápida y segura.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {passkeys.map((pk) => (
                <div
                  key={pk.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-background border border-border/50 shadow-sm"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-foreground truncate">
                      {pk.device_name}
                    </span>
                    <span className="text-xs text-muted-foreground mt-0.5">
                      {new Date(pk.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeletePasskey(pk.id, pk.device_name)}
                    className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors cursor-pointer shrink-0"
                    title="Eliminar dispositivo"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6">
            <button
              onClick={handleRegisterPasskey}
              disabled={isLoading || passkeyCount >= 3}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer shadow-md"
            >
              {isLoading ? (
                "Configurando..."
              ) : (
                <>
                  <Plus className="size-4" />
                  Agregar nuevo dispositivo
                </>
              )}
            </button>
            {passkeyCount >= 3 && (
              <p className="text-[10px] text-center text-muted-foreground mt-2 px-2">
                Has alcanzado el límite de 3 dispositivos. Elimina uno para agregar otro.
              </p>
            )}
          </div>
        </div>
      </MagicCard>
    </div>
  );
}

"use client";

import { useState, useEffect, useActionState } from "react";
import { login, getPublicAppSettings, type ActionState } from "./actions";import { getPasskeyOptions, verifyPasskey } from "./passkeys/passkeys-actions";
import { startAuthentication } from "@simplewebauthn/browser";
import { MagicCard } from "@/components/ui/magic-card";
import { Eye, EyeOff, Fingerprint, ScanFace, KeyRound, User, ArrowBigUpDash } from "lucide-react";
import { cn } from "@/lib/utils";
import { AuroraText } from "@/components/ui/aurora-text";
import { DotPattern } from "@/components/ui/dot-pattern";
import { Skeleton } from "@/components/ui/skeleton";
import { useTheme } from "next-themes";
import Swal from "sweetalert2";


export default function LogIn() {
  const [mounted, setMounted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isPasskeyPending, setIsPasskeyPending] = useState<boolean>(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const [isPasskeysEnabled, setIsPasskeysEnabled] = useState<boolean>(false);
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const { theme } = useTheme();

  const handleKeyUpDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    setIsCapsLockOn(e.getModifierState("CapsLock"));
  };

  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    login,
    null,
  );

  const showError = (message: string) => {
    const isDark = theme === "dark";
    Swal.fire({
      icon: "error",
      title: "Error de Acceso",
      text: message,
      background: isDark ? "#18181b" : "#F5F5F1",
      color: isDark ? "#F5F5F1" : "#525D53",
      confirmButtonColor: isDark ? "#525D53" : "#8DA78E",
      customClass: {
        popup: cn(
          "rounded-3xl border backdrop-blur-xl transition-colors duration-300",
          isDark ? "border-[#525D53]/40 shadow-2xl" : "border-[#C1D1C5]/60 shadow-lg",
        ),
      },
    });
  };

useEffect(() => {
    setMounted(true);
    getPublicAppSettings().then((settings) => {
      const passkeysEnabled = settings?.enable_passkeys ?? false;
      const hasLocalPasskey = localStorage.getItem("cermad-device-passkey-enabled") === "true";
      
      const shouldShowPasskeys = passkeysEnabled && hasLocalPasskey;
      setIsPasskeysEnabled(shouldShowPasskeys);
      if (!shouldShowPasskeys) {
        setShowCredentials(true);
      }
      setIsLoadingSettings(false);
    });
  }, []);
  useEffect(() => {
    if (state?.success) {
      window.location.href = "/kore";
    } else if (state?.message === "DEVICE_LIMIT") {
      window.location.href = "/esperando-acceso?reason=limit";
    } else if (state?.message === "DEVICE_PENDING") {
      window.location.href = "/esperando-acceso";
    } else if (state?.message) {
      showError(state.message);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, theme]);

  const handlePasskeyLogin = async () => {
    setIsPasskeyPending(true);
    try {
      const options = await getPasskeyOptions();
      const asseResp = await startAuthentication({ optionsJSON: options });
      const verification = await verifyPasskey(asseResp);

      if (verification.success) {
        localStorage.setItem("cermad-device-passkey-enabled", "true");
        window.location.href = "/kore";
      } else if (verification.error === "DEVICE_LIMIT") {
        window.location.href = "/esperando-acceso?reason=limit";
      } else if (verification.error === "DEVICE_PENDING") {
        window.location.href = "/esperando-acceso";
      } else if (verification.error) {
        showError(verification.error);
      }
    } catch (error: unknown) {
      const err = error as Error;
      const msg = err.message || "";
      if (
        err.name === "NotAllowedError" ||
        err.name === "AbortError" ||
        msg.includes("timed out") ||
        msg.includes("not allowed")
      ) {
        return;
      }
      showError("Fallo en la biometría o tiempo excedido.");
    } finally {
      setIsPasskeyPending(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="relative flex-1 flex flex-col items-center justify-center w-full bg-transparent z-0 overflow-hidden">
      <div className="relative w-full max-w-md px-6 md:px-12 pb-12 z-10">
        <MagicCard className="rounded-3xl border border-[#C1D1C5]/40 dark:border-[#525D53]/50 bg-white/40 dark:bg-[#1a1d1a]/95 backdrop-blur-xl shadow-2xl overflow-visible!">
          <div className="flex flex-col items-center space-y-6 p-10 border-b border-border/50 text-center">
            


            <div className="space-y-1">
              <h3 className="text-2xl font-black tracking-tight">
                <AuroraText>Bienvenido de nuevo</AuroraText>
              </h3>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em]">
                FARMACIA SALUD
              </p>
            </div>
          </div>

          {isLoadingSettings ? (
            <div className="flex flex-col gap-6 p-10 w-full animate-in fade-in duration-500">
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-10 w-full rounded-lg" />
                </div>
                <div className="grid gap-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full rounded-lg" />
                </div>
              </div>
              <Skeleton className="h-12 w-full rounded-xl mt-4" />
            </div>
          ) : (
            <form
              action={formAction}
            className={cn(
              "transition-all duration-500 flex flex-col",
              showCredentials ? "gap-6 p-10" : "gap-0 px-10 pb-10 pt-8"
            )}
          >
            <div
              className={cn(
                "grid transition-all duration-500 ease-in-out",
                showCredentials
                  ? "grid-rows-[1fr] opacity-100 mb-6"
                  : "grid-rows-[0fr] opacity-0 pointer-events-none mb-0",
              )}
            >
              <div className="overflow-hidden p-2 -m-2 flex flex-col gap-6">
                <div className="grid gap-2">
                  <label className="text-sm font-semibold text-foreground/70">
                    Usuario
                  </label>
                  <input
                    id="username"
                    type="text"
                    placeholder="Tu usuario"
                    required={showCredentials}
                    value={username}
                    className="flex h-10 w-full rounded-lg border border-input bg-background/50 px-3 py-2 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                    onChange={(e) =>
                      setUsername(e.target.value.toLowerCase().trim())
                    }
                  />
                  <input
                    type="hidden"
                    name="email"
                    value={username ? `${username}@app.com` : ""}
                  />
                </div>

                <div className="grid gap-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-foreground/70">
                    Contraseña
                    {isCapsLockOn && (
                      <span className="text-[10px] text-amber-500 font-bold uppercase animate-pulse">
                        Mayúsculas activadas
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    {isCapsLockOn && (
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500 pointer-events-none" title="Mayúsculas activadas">
                        <ArrowBigUpDash className="size-4" />
                      </div>
                    )}
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required={showCredentials}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={handleKeyUpDown}
                      onKeyUp={handleKeyUpDown}
                      className={cn(
                        "flex h-10 w-full rounded-lg border border-input bg-background/50 py-2 text-sm pr-10 transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent",
                        isCapsLockOn ? "pl-9" : "pl-3"
                      )}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 cursor-pointer"
                    >
                      {showPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <button
                type={showCredentials ? "submit" : "button"}
                onClick={(e) => {
                  if (!showCredentials) {
                    e.preventDefault();
                    setShowCredentials(true);
                  }
                }}
                className="w-full h-12 inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all duration-300 bg-[#8DA78E] dark:bg-[#525D53] hover:bg-[#525D53] dark:hover:bg-[#8DA78E] border border-[#8DA78E]/30 dark:border-[#A3BEB0]/20 text-[#F5F5F1] cursor-pointer active:scale-[0.98] disabled:opacity-50 shadow-sm"
                disabled={showCredentials && (isPending || isPasskeyPending)}
              >
                <User className="size-4 text-[#F5F5F1]/80" />
                <span>
                  {!showCredentials
                    ? "Iniciar sesión con contraseña"
                    : isPending
                      ? "Verificando..."
                      : "Entrar ahora"}
                </span>
              </button>
{isPasskeysEnabled && (
                <>
                  <div className="relative my-2">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border/50" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase font-bold tracking-widest">
                      <span className="bg-card px-3 text-muted-foreground/70">O</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handlePasskeyLogin}
                    className="w-full py-5 flex flex-col items-center justify-center gap-3 rounded-xl transition-all duration-300 bg-[#C1D1C5]/20 dark:bg-[#525D53]/30 hover:bg-[#C1D1C5]/40 dark:hover:bg-[#525D53]/50 border border-[#8DA78E]/30 dark:border-[#A3BEB0]/20 text-slate-700 dark:text-[#A3BEB0] cursor-pointer active:scale-[0.98] disabled:opacity-50"
                    disabled={isPending || isPasskeyPending}
                  >
                    {isPasskeyPending ? (
                      <div className="flex flex-col items-center gap-3">
                        <div className="size-6 rounded-full border-2 border-[#A3BEB0]/30 border-t-[#8DA78E] animate-spin" />
                        <span className="text-sm font-bold">Esperando dispositivo...</span>
                      </div>
                    ) : (
                      <>
                        <span className="text-[15px] font-bold">
                          Ingreso Seguro
                        </span>
                        <div className="flex items-center gap-4">
                          <Fingerprint className="size-6 text-[#8DA78E] dark:text-[#A3BEB0]" />
                          <div className="w-px h-5 bg-[#C1D1C5] dark:bg-[#525D53]" />
                          <ScanFace className="size-6 text-[#8DA78E] dark:text-[#A3BEB0]" />
                          <div className="w-px h-5 bg-[#C1D1C5] dark:bg-[#525D53]" />
                          <KeyRound className="size-6 text-[#8DA78E] dark:text-[#A3BEB0]" />
                        </div>
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </form>
          )}
        </MagicCard>
      </div>
    </div>
  );
}

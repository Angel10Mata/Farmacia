"use client";

import { useState, useEffect } from "react";
import {
  getRegistrationOptions,
  verifyRegistration,
  getPasskeysCount,
} from "../passkeys/passkeys-actions";
import { startRegistration } from "@simplewebauthn/browser";
import { browserSupportsWebAuthn } from "@simplewebauthn/browser";
import { Fingerprint, X } from "lucide-react";

export function PasskeyPrompt() {
  const [isVisible, setIsVisible] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [deviceName, setDeviceName] = useState("");
  const [passkeyCount, setPasskeyCount] = useState<number | null>(null);
  const [errorStatus, setErrorStatus] = useState("");

  useEffect(() => {
    const checkStatus = async () => {
      const dismissed = localStorage.getItem("passkey-prompt-dismissed");
      if (dismissed === "true") return;

      const supports = browserSupportsWebAuthn();
      if (supports) {
        const count = await getPasskeysCount();
        setPasskeyCount(count);
        if (count < 3) {
          setIsVisible(true);
        }
      }
    };
    checkStatus();
  }, []);

  const handleDismiss = () => {
    if (dontShowAgain) {
      localStorage.setItem("passkey-prompt-dismissed", "true");
    }
    setIsVisible(false);
  };

  const handleRegister = async () => {
    if (!deviceName.trim()) {
      setErrorStatus("Debes ingresar un nombre para el dispositivo.");
      return;
    }

    setIsPending(true);
    setErrorStatus("");
    try {
      const options = await getRegistrationOptions();
      const regResp = await startRegistration({ optionsJSON: options });
      const verification = await verifyRegistration(regResp, deviceName.trim());

      if (verification.success) {
        localStorage.setItem("passkey-prompt-dismissed", "true");
        localStorage.setItem("cermad-device-passkey-enabled", "true");
        setIsVisible(false);
      } else {
        setErrorStatus(`Error: ${verification.error}`);
      }
    } catch (error: any) {
      if (error.name === "InvalidStateError") {
        localStorage.setItem("cermad-device-passkey-enabled", "true");
        setErrorStatus("Este dispositivo ya está registrado.");
      } else {
        setErrorStatus(`Error: ${error.message}`);
      }
    } finally {
      setIsPending(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-border bg-card shadow-2xl">
        <button
          onClick={() => setIsVisible(false)}
          className="absolute right-4 top-4 p-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="size-5" />
        </button>

        <div className="p-8 flex flex-col items-center text-center space-y-6">
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 rounded-full border-4 border-background bg-amber-100 p-4 dark:bg-amber-900/30">
            <Fingerprint className="h-8 w-8 text-amber-600 dark:text-amber-500" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold tracking-tight text-foreground">
              Activar Ingreso Seguro
            </h3>
            <p className="text-sm text-muted-foreground">
              Usa tu huella, rostro o PIN para entrar de forma más rápida y segura
              en las próximas visitas.
            </p>
          </div>

          <div className="w-full space-y-3 text-left">
            {passkeyCount !== null && (
              <div className="text-xs font-semibold text-muted-foreground mb-4 text-center">
                 Dispositivos registrados: {passkeyCount} / 3
              </div>
            )}
            
            <input
              type="text"
              placeholder="Nombre (ej. Mi iPhone, Computadora)"
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              className="w-full h-11 px-3 rounded-lg border border-input bg-background/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary mb-2"
              disabled={isPending}
            />
            {errorStatus ? (
              <div className="text-sm font-medium text-destructive bg-destructive/10 p-3 rounded-lg mt-2 text-center">
                {errorStatus}
              </div>
            ) : (
              <button
                onClick={handleRegister}
                disabled={isPending || !deviceName.trim()}
                className="w-full h-11 bg-amber-600 text-white font-medium rounded-xl hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {isPending ? "Configurando..." : "Activar Ahora"}
              </button>
            )}
            
            <button
              onClick={handleDismiss}
              className="w-full h-11 bg-secondary text-secondary-foreground font-medium rounded-xl hover:bg-secondary/80 transition-all"
            >
              Quizás más tarde
            </button>
          </div>

          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="size-4 rounded border-input bg-background"
            />
            <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
              No volver a preguntar en este dispositivo
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}

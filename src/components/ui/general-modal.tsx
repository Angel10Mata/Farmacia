"use client";

import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";


export function ModalShell({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const shellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex flex-col md:items-center md:justify-center md:p-4">

      <div 
        className="absolute inset-0 bg-zinc-100 dark:bg-zinc-900 md:bg-zinc-700/20 md:backdrop-blur-sm"
        onClick={onClose}
      />


      <div
        ref={shellRef}
        className="relative flex flex-col w-full h-[100dvh] md:h-auto md:max-w-lg md:rounded-3xl bg-zinc-100 dark:bg-zinc-900 overflow-hidden shadow-none md:shadow-lg pointer-events-auto"
      >

        <div className="hidden md:block absolute inset-0 rounded-3xl pointer-events-none p-[3px]" style={{
            background: "linear-gradient(90deg, #0e73f6 0%, #29b4f8 40%, #8958d7 75%, #de3e96 100%)",
            WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude"
        }} />


        <div className="relative flex flex-col flex-1 h-full w-full z-10 bg-zinc-100 dark:bg-zinc-800 md:bg-transparent">

          <div 
            className="flex-none flex items-center justify-between px-4 py-4 md:pt-6 md:px-6 md:pb-4 bg-zinc-100 dark:bg-zinc-800 md:bg-transparent"
            style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
          >
            <div>
              <h2 className="text-xl font-bold text-foreground">{title}</h2>
              {subtitle && <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              className="p-2 -mr-2 text-blue-500 hover:text-blue-400 transition-colors"
            >
              <X size={24} />
            </button>
          </div>


          <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 bg-zinc-100 dark:bg-zinc-900 md:bg-transparent">
            {children}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}


export function ModalInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      placeholder=""
      className={cn(
        "w-full bg-transparent border-2 border-[var(--color-celeste-kore)] text-foreground focus:ring-2 focus:ring-[var(--color-celeste-kore)] outline-none rounded-md px-3 py-2",
        props.className
      )}
    />
  );
}


export function ModalLabel({ children, className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={cn("block text-sm font-semibold text-foreground mb-1", className)} {...props}>
      {children}
    </label>
  );
}


export function ModalTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      placeholder=""
      className={cn(
        "w-full bg-transparent border-2 border-[var(--color-celeste-kore)] text-foreground focus:ring-2 focus:ring-[var(--color-celeste-kore)] outline-none rounded-md px-3 py-2 resize-y",
        props.className
      )}
    />
  );
}


export function ModalFooter({ children }: { children: React.ReactNode }) {
  return (
    <div 
      className="flex-none px-4 py-4 md:px-6 md:py-6 bg-zinc-100 dark:bg-zinc-800"
      style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
    >
      <div className="flex justify-center w-full">
        {children}
      </div>
    </div>
  );
}


export function ModalSubmit({ children, loading, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={cn(
        "w-full md:w-auto px-8 py-3 rounded-full border-2 border-emerald-600 dark:border-emerald-400 text-emerald-700 dark:text-emerald-400 font-bold hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50",
        props.className
      )}
    >
      {loading ? "Guardando..." : children || "Guardar"}
    </button>
  );
}


export function ModalConfirmDelete({
  onConfirm,
  onCancel,
  title = "¿Eliminar registro?",
  description = "Esta acción no se puede deshacer.",
}: {
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  description?: string;
}) {
  return (
    <div className="p-4 border-2 border-red-500/50 rounded-xl bg-red-50 dark:bg-red-950/20">
      <h3 className="text-red-700 dark:text-red-400 font-bold">{title}</h3>
      <p className="text-sm text-red-600/80 dark:text-red-400/80 mt-1 mb-4">{description}</p>
      <div className="flex gap-4 justify-end">
        <button onClick={onCancel} className="px-4 py-2 font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 cursor-pointer">
          Cancelar
        </button>
        <button onClick={onConfirm} className="px-4 py-2 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 cursor-pointer">
          Eliminar
        </button>
      </div>
    </div>
  );
}

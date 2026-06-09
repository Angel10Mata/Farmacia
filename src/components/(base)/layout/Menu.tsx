"use client";

import type { User } from "@supabase/supabase-js";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Swal from "sweetalert2";
import {
  LogIn,
  LogOut,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";
import { useUserContext } from "@/components/(base)/providers/UserProvider";
import { AuroraText } from "@/components/ui/aurora-text";
import { PushNotificationToggle } from "@/components/ui/PushNotificationToggle";

interface MenuProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  user: User | null;
}

export default function Menu({ isOpen, setIsOpen, user }: MenuProps) {
  const pathname = usePathname();
  const { realRole, effectiveRole, simulatedRole, setSimulatedRole } = useUserContext();
  const isRoot = pathname === "/kore";

  // On mobile root: no breadcrumb bar, so menu starts right below header (3.5rem)
  // On mobile subpages: breadcrumb bar exists, so menu starts below header+breadcrumb (~6.5rem) 
  // On desktop (md+): always below header (4rem)
  const mobileTop = isRoot ? "top-14" : "top-[6.5rem]";
  const mobileHeight = isRoot ? "h-[calc(100vh-3.5rem)]" : "h-[calc(100vh-6.5rem)]";

  const metadata = user?.user_metadata || {};
  const username =
    metadata.username || user?.email?.split("@")[0] || "Invitado";

  const handleLogout = async () => {
    setIsOpen(false);
    const isDark = document.documentElement.classList.contains("dark");
    const result = await Swal.fire({
      title: "¿Cerrar sesión?",
      text: "Se cerrará tu sesión actual.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#ef4444",
      confirmButtonText: "Sí, salir",
      cancelButtonText: "Cancelar",
      background: isDark ? "#000000" : "#ffffff",
      color: isDark ? "#ffffff" : "#000000",
    });

    if (result.isConfirmed) {
      const supabase = createClient();
      await supabase.auth.signOut();
      window.location.replace("/login");
    }
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/40 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={cn(
          `fixed right-0 ${mobileTop} md:top-16 z-50 ${mobileHeight} md:h-[calc(100vh-4rem)] w-full sm:w-100 bg-white dark:bg-background border-l border-border/40 transition-transform duration-500 overflow-y-auto shadow-2xl flex flex-col`,
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex items-center justify-between p-6">
          {user ? (
            <div className="flex flex-col text-sm">
              <span className="font-bold leading-tight">{username}</span>
              <span className="text-muted-foreground text-xs font-medium uppercase leading-tight">
                {effectiveRole}
              </span>
            </div>
          ) : (
            <div />
          )}
          <div className="flex items-center gap-2">
            <PushNotificationToggle />
          </div>
        </div>

        <div className="flex flex-col flex-1 px-6 pb-8">
          {user ? (
            <>
              {realRole === "super" && (
                <div className="mb-6 flex items-center gap-2 bg-celeste-kore/10 border border-celeste-kore/50 p-3 rounded-xl">
                  <ShieldAlert className="size-5 text-celeste-kore shrink-0" />
                  <select
                    value={simulatedRole || ""}
                    onChange={(e) => setSimulatedRole(e.target.value || null)}
                    className="bg-transparent text-xs font-bold text-red-700 outline-none cursor-pointer w-full"
                  >
                    <option value="">Rol Real: {realRole.toUpperCase()}</option>
                    <option value="admin">Simular: ADMIN</option>
                    <option value="proyectos">Simular: DESARROLLADOR</option>
                    <option value="user">Simular: USER</option>
                  </select>
                </div>
              )}

              <div className="mb-4">
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-between rounded-xl bg-celeste-kore text-white px-5 py-3 text-sm font-bold w-full hover:opacity-90 transition-all cursor-pointer"
                >
                  <span>Cerrar Sesión</span>
                  <LogOut className="size-4 rotate-180" />
                </button>
              </div>
            </>
          ) : (
            <div className="mb-8 mt-2">
              <Link
                href="/login"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground px-5 py-3 text-sm font-bold w-full hover:opacity-90 transition-all"
              >
                <span>Iniciar Sesión</span>
                <LogIn className="size-4" />
              </Link>
            </div>
          )}
        </div>

        {/* Footer dentro del menú */}
        <div className="mt-auto border-t border-border/30 px-6 py-4">
          <div className="flex flex-col items-center justify-center gap-1">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 dark:text-zinc-400">
              © 2026 KoreAPP
            </p>
            <div className="text-xs font-bold uppercase tracking-widest text-zinc-600 dark:text-zinc-400 flex items-center gap-1 mt-1">
              Powered by{" "}
              <a
                href="https://www.oscar27jimenez.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline cursor-pointer transition-all inline-flex items-center text-zinc-900 dark:text-zinc-100"
              >
                <AuroraText className="text-xs whitespace-nowrap">
                  KoreAPP | Ing. de Software
                </AuroraText>
              </a>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

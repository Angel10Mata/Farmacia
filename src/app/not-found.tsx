import AnimatedIcon from "@/components/ui/AnimatedIcon";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground text-center">
      <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 shadow-2xl">
        <div className="mb-6 flex justify-center">
          <div className="p-4 bg-red-500/10 rounded-full">
            <AnimatedIcon iconKey="jzspergk" className="size-32 text-red-600" />
          </div>
        </div>
        <h1 className="text-2xl font-bold mb-2 uppercase tracking-tight">
          Página no encontrada
        </h1>
        <p className="text-muted-foreground mb-6 text-sm">
          Lo sentimos, la ruta que intenta consultar no existe en el sistema de{" "}
          <strong>CERMAD S.A.</strong>
        </p>
        <Link
          href="/cermadsa"
          className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground py-3 rounded-xl font-bold text-xs transition-all active:scale-95 uppercase"
        >
          <ArrowLeft className="size-4 stroke-3" />
          Regresar al Panel
        </Link>
      </div>
    </div>
  );
}

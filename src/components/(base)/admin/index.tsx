import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { getPendingDevicesCount } from "@/components/(Kore)/admin/lib/actions";
import AnimatedIcon from "@/components/ui/AnimatedIcon";
import { AdminCards } from "./AdminCards";


export async function AdminPanel() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const metadata = user.user_metadata || {};
  const role = metadata.rol || user.role || "user";

  if (!["super", "admin"].includes(role)) {
    redirect("/kore");
  }

  const pendingDevices = (await getPendingDevicesCount()) ?? 0;

  return (
    <div className="space-y-8 w-full p-4 md:p-6 pt-20 md:pt-24">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <AnimatedIcon iconKey="oskfhomm" size={28} />
          </div>
          <h1 className="text-3xl font-bold tracking-tighter text-foreground">
            Administración
          </h1>
        </div>
        <p className="text-sm text-muted-foreground ml-0.5">
          Panel de control administrativo.
        </p>
      </div>

      {/* Pending alert */}
      {pendingDevices > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30">
          <div className="shrink-0">
            <AnimatedIcon iconKey="qvyppzqz" size={24} />
          </div>
          <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
            Hay{" "}
            <span className="font-bold">{pendingDevices}</span>{" "}
            solicitud{pendingDevices !== 1 && "es"} de dispositivo
            {pendingDevices !== 1 && "s"} pendiente
            {pendingDevices !== 1 && "s"} de aprobación.
          </p>
        </div>
      )}

      {/* Module cards with AnimatedIcon */}
      <AdminCards pendingDevices={pendingDevices} />
    </div>
  );
}

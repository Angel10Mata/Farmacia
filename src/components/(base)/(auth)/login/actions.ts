"use server";

import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";

export type ActionState = {
  success: boolean;
  message: string;
  errorType?: "invalid" | "device";
  fields?: Record<string, string>;
} | null;

export async function login(
  prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      success: false,
      message: "Credenciales inválidas",
      errorType: "invalid",
      fields: { email },
    };
  }

const user = data.user;
  const metadata = user.user_metadata || {};
  const realRole = metadata.rol || user.role || "user";

  const { data: settings } = await supabase
    .from("app_settings")
    .select("require_device_authorization")
    .limit(1)
    .maybeSingle();

  const requireAuth = settings?.require_device_authorization ?? false;

  if (requireAuth && !["super", "admin"].includes(realRole)) {
    const userAgent =
      (await headers()).get("user-agent") || "Dispositivo Desconocido";

    const { data: device } = await supabase
      .from("authorized_devices")
      .select("is_authorized")
      .eq("user_id", user.id)
      .eq("browser_fingerprint", userAgent)
      .single();

    if (!device) {
      const { count } = await supabase
        .from("authorized_devices")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);

      if ((count ?? 0) >= 3) {
        return { success: false, message: "DEVICE_LIMIT", errorType: "device" };
      }

      await supabase.from("authorized_devices").insert({
        user_id: user.id,
        device_name: userAgent,
        browser_fingerprint: userAgent,
        is_authorized: false,
      });
      return { success: false, message: "DEVICE_PENDING", errorType: "device" };
    }

    if (!device.is_authorized) {
      return { success: false, message: "DEVICE_PENDING", errorType: "device" };
    }
  }

  return { success: true, message: "Inicio exitoso" };
}

export async function getPublicAppSettings() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("app_settings")
    .select("require_device_authorization, enable_passkeys")
    .limit(1)
    .maybeSingle();

  return data || { require_device_authorization: false, enable_passkeys: false };
}
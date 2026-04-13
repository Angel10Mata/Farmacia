import { createClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase con SERVICE_ROLE_KEY — bypass total de RLS.
 * Solo usar en API Routes server-side, NUNCA en el cliente.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

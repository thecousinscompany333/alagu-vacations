import "server-only";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "./env";

/** Server-only client for admin bootstrap scripts and password-reset eligibility checks. */
export function createServiceClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  return createClient(SUPABASE_URL, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

/** When the service role is configured, only admin accounts may request a reset email. */
export async function isRegisteredAdminEmail(email: string): Promise<boolean> {
  const service = createServiceClient();
  if (!service) return true;

  const normalized = email.trim().toLowerCase();
  let page = 1;
  for (let i = 0; i < 20; i++) {
    const { data, error } = await service.auth.admin.listUsers({ page, perPage: 200 });
    if (error || !data?.users.length) return false;
    const match = data.users.find((u) => u.email?.toLowerCase() === normalized);
    if (match) {
      const { data: row } = await service.from("admin_users").select("user_id").eq("user_id", match.id).maybeSingle();
      return Boolean(row);
    }
    if (data.users.length < 200) return false;
    page += 1;
  }
  return false;
}
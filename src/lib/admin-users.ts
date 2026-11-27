import "server-only";
import { createServiceClient } from "@/lib/supabase/service";

import type { UserRole } from "@/lib/types";

export type AdminDirectoryEntry = {
  userId: string;
  email: string;
  role: UserRole;
  /** Business name, for partner logins. */
  businessName: string | null;
  createdAt: string;
};

export type AdminDirectoryResult =
  | { ok: true; admins: AdminDirectoryEntry[] }
  | { ok: false; reason: "missing_service_role" | "load_failed" };

function businessNameOf(embedded: unknown): string | null {
  const p = Array.isArray(embedded) ? embedded[0] : embedded;
  return p && typeof p === "object" && "business_name" in p ? String(p.business_name) : null;
}

export async function fetchAdminDirectory(): Promise<AdminDirectoryResult> {
  const service = createServiceClient();
  if (!service) return { ok: false, reason: "missing_service_role" };

  const { data: rows, error } = await service.from("admin_users").select("user_id, role, created_at, partners(business_name)").order("created_at", {
    ascending: true,
  });
  if (error || !rows) return { ok: false, reason: "load_failed" };

  const admins: AdminDirectoryEntry[] = [];
  for (const row of rows) {
    const { data, error: userErr } = await service.auth.admin.getUserById(row.user_id);
    if (userErr || !data.user) continue;
    admins.push({
      userId: row.user_id,
      email: data.user.email ?? "(no email)",
      role: row.role === "super_admin" || row.role === "partner" ? row.role : "admin",
      businessName: businessNameOf(row.partners),
      createdAt: row.created_at,
    });
  }
  return { ok: true, admins };
}
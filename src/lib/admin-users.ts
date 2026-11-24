import "server-only";
import { createServiceClient } from "@/lib/supabase/service";

import type { AdminRole } from "@/lib/types";

export type AdminDirectoryEntry = {
  userId: string;
  email: string;
  role: AdminRole;
  createdAt: string;
};

export type AdminDirectoryResult =
  | { ok: true; admins: AdminDirectoryEntry[] }
  | { ok: false; reason: "missing_service_role" | "load_failed" };

export async function fetchAdminDirectory(): Promise<AdminDirectoryResult> {
  const service = createServiceClient();
  if (!service) return { ok: false, reason: "missing_service_role" };

  const { data: rows, error } = await service.from("admin_users").select("user_id, role, created_at").order("created_at", {
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
      role: row.role === "super_admin" ? "super_admin" : "admin",
      createdAt: row.created_at,
    });
  }
  return { ok: true, admins };
}
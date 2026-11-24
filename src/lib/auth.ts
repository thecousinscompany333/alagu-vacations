import "server-only";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createSessionClient } from "./supabase/server";
import { isSupabaseConfigured } from "./supabase/env";
import { assertDemoAccess } from "./demo-server";
import type { AdminRole } from "./types";

export type AdminSession = {
  supabase: Awaited<ReturnType<typeof createSessionClient>>;
  user: { id: string; email: string };
  role: AdminRole;
};

/**
 * Data Access Layer for the admin area.
 * Verifies the user with the Supabase Auth server (getUser) AND checks admin membership
 * (is_admin() in Postgres). Every admin page and Server Action calls this.
 */
export async function getAdmin(): Promise<AdminSession | null> {
  await connection();
  await assertDemoAccess();
  if (!isSupabaseConfigured) return null;
  const supabase = await createSessionClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: isAdmin, error } = await supabase.rpc("is_admin");
  if (error || isAdmin !== true) return null;

  const { data: roleRaw } = await supabase.rpc("admin_role");
  const role: AdminRole = roleRaw === "super_admin" ? "super_admin" : "admin";

  return { supabase, user: { id: user.id, email: user.email ?? "" }, role };
}

export async function requireAdmin(): Promise<AdminSession> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

export async function requireSuperAdmin(): Promise<AdminSession> {
  const admin = await requireAdmin();
  if (admin.role !== "super_admin") redirect("/admin");
  return admin;
}

export function isSuperAdmin(admin: AdminSession) {
  return admin.role === "super_admin";
}
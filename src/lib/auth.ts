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
  // A signed-in partner who opens an admin page is sent to their own dashboard.
  if (!admin) redirect((await getPartner()) ? "/partner" : "/admin/login");
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

/* ------------------------------------------------------------- partners */

export type PartnerSession = {
  supabase: Awaited<ReturnType<typeof createSessionClient>>;
  user: { id: string; email: string };
  partner: { id: string; business_name: string };
};

/**
 * Data Access Layer for the partner area. current_partner_id() is NULL for admins, visitors
 * and paused partners, so only an active partner login gets a session here. Partners read and
 * change data only through the partner_* functions and RLS policies scoped to their business.
 */
export async function getPartner(): Promise<PartnerSession | null> {
  await connection();
  await assertDemoAccess();
  if (!isSupabaseConfigured) return null;
  const supabase = await createSessionClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: partnerId, error } = await supabase.rpc("current_partner_id");
  if (error || typeof partnerId !== "string") return null;
  const { data: partner } = await supabase.from("partners").select("id, business_name").eq("id", partnerId).maybeSingle();
  if (!partner) return null;
  return { supabase, user: { id: user.id, email: user.email ?? "" }, partner };
}

export async function requirePartner(): Promise<PartnerSession> {
  const partner = await getPartner();
  if (!partner) redirect((await getAdmin()) ? "/admin" : "/admin/login");
  return partner;
}

/**
 * Where a just-signed-in user belongs: "/admin" for staff, "/partner" for an active partner,
 * or an error message (the caller signs them out).
 */
export async function homeForSignedInUser(
  supabase: Awaited<ReturnType<typeof createSessionClient>>,
): Promise<{ path: "/admin" | "/partner" } | { error: string }> {
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (isAdmin === true) return { path: "/admin" };
  const { data: partnerId } = await supabase.rpc("current_partner_id");
  if (typeof partnerId === "string") return { path: "/partner" };
  const { data: role } = await supabase.rpc("admin_role");
  if (role === "partner") {
    return { error: "Your partner account is paused. Please contact Alagu Vacations." };
  }
  return { error: "This account does not have admin access." };
}

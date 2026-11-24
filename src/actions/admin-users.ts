"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/actions/admin";
import { requireSuperAdmin } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/service";

const newAdminSchema = z
  .object({
    email: z.string().trim().email("Enter a valid email address."),
    password: z.string().min(10, "Use at least 10 characters for the password."),
    password_confirm: z.string().min(10, "Confirm the password."),
  })
  .refine((v) => v.password === v.password_confirm, {
    message: "Passwords do not match.",
    path: ["password_confirm"],
  });

export async function createAdminUser(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const { user: actor } = await requireSuperAdmin();

  const service = createServiceClient();
  if (!service) {
    return {
      ok: false,
      message:
        "Admin creation is not enabled on this server (missing SUPABASE_SERVICE_ROLE_KEY). Ask your developer to add it in Render environment variables, then redeploy.",
    };
  }

  const parsed = newAdminSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    password_confirm: formData.get("password_confirm"),
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the form." };
  }

  const email = parsed.data.email.trim().toLowerCase();
  const { password } = parsed.data;

  let userId: string;
  const { data: created, error: createErr } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createErr) {
    const { data: list, error: listErr } = await service.auth.admin.listUsers({ perPage: 1000 });
    if (listErr) return { ok: false, message: "Could not create the user. Try again." };
    const existing = list.users.find((u) => u.email?.toLowerCase() === email);
    if (!existing) return { ok: false, message: createErr.message || "Could not create the user." };
    userId = existing.id;
    const { error: pwErr } = await service.auth.admin.updateUserById(userId, { password });
    if (pwErr) return { ok: false, message: "User exists but password could not be updated." };
  } else {
    userId = created.user.id;
  }

  const { data: priorAdmin } = await service.from("admin_users").select("user_id").eq("user_id", userId).maybeSingle();
  const role = formData.get("role") === "super_admin" ? "super_admin" : "admin";
  const { error: roleErr } = await service.from("admin_users").upsert({ user_id: userId, role });
  if (roleErr) return { ok: false, message: "Could not grant admin access." };

  revalidatePath("/admin/users");
  if (priorAdmin) {
    return { ok: true, message: `${email} already had admin access; password was reset.` };
  }
  if (userId === actor.id) {
    return { ok: true, message: "Your account password was updated." };
  }
  return { ok: true, message: `Admin added: ${email}. They can sign in at /admin/login or use forgot password.` };
}

export async function removeAdminUser(formData: FormData) {
  const { user: actor } = await requireSuperAdmin();
  const service = createServiceClient();
  if (!service) return;

  const userId = z.string().uuid().parse(formData.get("user_id"));
  const { count } = await service.from("admin_users").select("user_id", { count: "exact", head: true });
  if ((count ?? 0) <= 1) return;

  if (userId === actor.id) return;

  await service.from("admin_users").delete().eq("user_id", userId);
  revalidatePath("/admin/users");
}
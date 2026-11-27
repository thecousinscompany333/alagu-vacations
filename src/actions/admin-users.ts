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

const optionalField = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => v || null);

const partnerSchema = z.object({
  business_name: z.string().trim().min(2, "Enter the partner's business name.").max(120),
  contact_name: optionalField(100),
  phone: optionalField(20),
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

  const { data: priorAdmin } = await service
    .from("admin_users")
    .select("user_id, role, partner_id")
    .eq("user_id", userId)
    .maybeSingle();
  const roleRaw = formData.get("role");
  const role = roleRaw === "super_admin" || roleRaw === "partner" ? roleRaw : "admin";

  // Staff and partner are kept apart: switching an existing login between them is not done here.
  if (priorAdmin && (priorAdmin.role === "partner") !== (role === "partner")) {
    const was = priorAdmin.role === "partner" ? "a partner" : "an admin";
    return { ok: false, message: `${email} is already ${was}. Its password was reset, but its role was not changed.` };
  }

  if (role === "partner") {
    const partner = partnerSchema.safeParse({
      business_name: formData.get("business_name"),
      contact_name: formData.get("contact_name") ?? "",
      phone: formData.get("phone") ?? "",
    });
    if (!partner.success) return { ok: false, message: partner.error.issues[0]?.message ?? "Check the partner details." };

    if (priorAdmin?.partner_id) {
      const { error } = await service.from("partners").update(partner.data).eq("id", priorAdmin.partner_id);
      if (error) return { ok: false, message: "Could not update the partner details." };
    } else {
      const { data: created, error } = await service
        .from("partners")
        .insert({ ...partner.data, email })
        .select("id")
        .single();
      if (error || !created) return { ok: false, message: "Could not create the partner." };
      const { error: linkErr } = await service
        .from("admin_users")
        .insert({ user_id: userId, role: "partner", partner_id: created.id });
      if (linkErr) {
        await service.from("partners").delete().eq("id", created.id);
        return { ok: false, message: "Could not grant partner access." };
      }
    }
    revalidatePath("/admin/users");
    return priorAdmin
      ? { ok: true, message: `${email} was already a partner; details updated and password reset.` }
      : { ok: true, message: `Partner added: ${email}. Assign their vehicles on the Vehicles page.` };
  }

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


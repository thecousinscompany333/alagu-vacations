"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { assertCaptcha } from "@/lib/captcha";
import { requireAdmin, requireSuperAdmin } from "@/lib/auth";
import { assertDemoAccess } from "@/lib/demo-server";
import { createSessionClient } from "@/lib/supabase/server";
import { isRegisteredAdminEmail } from "@/lib/supabase/service";
import { SITE_URL } from "@/lib/site";
import { CONTENT_TAG } from "@/lib/data";
import { ENQUIRY_STATUSES } from "@/lib/types";

export type ActionResult = { ok: boolean; message: string } | null;

/* ------------------------------------------------------------------ auth */

const RESET_EMAIL_SENT =
  "If this email is registered for admin access, you will receive a password reset link shortly.";

const passwordResetSchema = z
  .object({
    password: z.string().min(8, "Use at least 8 characters."),
    password_confirm: z.string().min(8, "Confirm your password."),
  })
  .refine((v) => v.password === v.password_confirm, {
    message: "Passwords do not match.",
    path: ["password_confirm"],
  });

export async function requestPasswordReset(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await assertDemoAccess();
  const captcha = await assertCaptcha(formData);
  if (!captcha.ok) return { ok: false, message: captcha.message };

  const email = String(formData.get("email") ?? "").trim();
  if (!email || !z.string().email().safeParse(email).success) {
    return { ok: false, message: "Enter a valid email address." };
  }

  if (!(await isRegisteredAdminEmail(email))) {
    return { ok: true, message: RESET_EMAIL_SENT };
  }

  const supabase = await createSessionClient();
  const redirectTo = `${SITE_URL}/admin/auth/callback?next=${encodeURIComponent("/admin/reset-password")}`;
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) {
    console.error("[auth] resetPasswordForEmail:", error.message);
    if (error.status === 429 || error.code === "over_email_send_rate_limit") {
      return {
        ok: false,
        message:
          "Too many reset emails were sent recently (Supabase limit). Wait about an hour, check spam, or configure custom SMTP in Supabase → Authentication → SMTP.",
      };
    }
    return { ok: true, message: RESET_EMAIL_SENT };
  }
  return { ok: true, message: RESET_EMAIL_SENT };
}

export async function completePasswordReset(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await assertDemoAccess();
  const captcha = await assertCaptcha(formData);
  if (!captcha.ok) return { ok: false, message: captcha.message };

  const parsed = passwordResetSchema.safeParse({
    password: formData.get("password"),
    password_confirm: formData.get("password_confirm"),
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the form." };
  }

  const supabase = await createSessionClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: "Your reset link expired. Request a new link from the forgot-password page." };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("different") || msg.includes("same")) {
      return { ok: false, message: "Choose a new password that is different from your current one." };
    }
    if (msg.includes("weak") || msg.includes("character")) {
      return { ok: false, message: "Password is too weak. Use at least 8 characters with mixed characters." };
    }
    console.error("[auth] updateUser:", error.message);
    return { ok: false, message: "Could not update password. Request a new link and try again." };
  }

  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (isAdmin !== true) {
    await supabase.auth.signOut();
    return { ok: false, message: "This account does not have admin access." };
  }

  redirect("/admin");
}

export async function signIn(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await assertDemoAccess();
  const captcha = await assertCaptcha(formData);
  if (!captcha.ok) return { ok: false, message: captcha.message };

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { ok: false, message: "Enter your email and password." };

  const supabase = await createSessionClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, message: "Incorrect email or password." };

  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (isAdmin !== true) {
    await supabase.auth.signOut();
    return { ok: false, message: "This account does not have admin access." };
  }
  redirect("/admin");
}

export async function signOut() {
  const supabase = await createSessionClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

/* ------------------------------------------------------------- helpers */

const lines = (v: FormDataEntryValue | null) =>
  String(v ?? "")
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 30);

const optional = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "").trim();
  return s ? s : null;
};

const imageUrl = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === "" || v.startsWith("/images/") || /^https?:\/\//.test(v), "Image must be an uploaded image or a valid URL")
  .transform((v) => (v ? v : null));

/** "https://…/storage/v1/object/public/media/packages/x.webp" -> "packages/x.webp" (uploaded files only). */
function mediaPath(url: string | null | undefined): string | null {
  const marker = "/storage/v1/object/public/media/";
  const i = url?.indexOf(marker) ?? -1;
  return url && i >= 0 ? decodeURIComponent(url.slice(i + marker.length)) : null;
}

function done(message: string): ActionResult {
  updateTag(CONTENT_TAG);
  return { ok: true, message };
}

/* ----------------------------------------------------------- enquiries */

export async function updateEnquiry(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const parsed = z
    .object({
      id: z.string().uuid(),
      status: z.enum(ENQUIRY_STATUSES),
      admin_notes: z.string().max(3000).optional(),
    })
    .safeParse({ id: formData.get("id"), status: formData.get("status"), admin_notes: formData.get("admin_notes") ?? undefined });
  if (!parsed.success) return { ok: false, message: "Invalid update." };

  const { id, status, admin_notes } = parsed.data;
  const { error } = await supabase.from("enquiries").update({ status, admin_notes: admin_notes?.trim() || null }).eq("id", id);
  if (error) return { ok: false, message: "Could not save. Please try again." };
  revalidatePath("/admin");
  revalidatePath(`/admin/enquiries/${id}`);
  return { ok: true, message: "Enquiry updated." };
}

export async function quickSetStatus(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = z.string().uuid().parse(formData.get("id"));
  const status = z.enum(ENQUIRY_STATUSES).parse(formData.get("status"));
  await supabase.from("enquiries").update({ status }).eq("id", id);
  revalidatePath("/admin");
}

/* ------------------------------------------------------------ vehicles */

const vehicleSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(120),
  model: z.string().trim().max(120).optional().transform((v) => v || null),
  seats: z.union([z.literal(""), z.coerce.number().int().min(1).max(80)]).transform((v) => (v === "" ? null : v)),
  description: z.string().trim().max(1000).optional().transform((v) => v || null),
  image_url: imageUrl,
  sort_order: z.coerce.number().int().min(0).max(999).default(0),
});

export async function saveVehicle(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const parsed = vehicleSchema.safeParse({
    name: formData.get("name"),
    model: formData.get("model") ?? undefined,
    seats: formData.get("seats") ?? "",
    description: formData.get("description") ?? undefined,
    image_url: formData.get("image_url") ?? "",
    sort_order: formData.get("sort_order") || 0,
  });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the form." };

  const photos = lines(formData.get("photos")).filter((p) => p.startsWith("/images/") || /^https?:\/\//.test(p));
  const row = {
    ...parsed.data,
    facilities: lines(formData.get("facilities")),
    trip_types: lines(formData.get("trip_types")),
    photos: parsed.data.image_url && !photos.includes(parsed.data.image_url) ? [parsed.data.image_url, ...photos] : photos,
    is_active: formData.get("is_active") === "on",
  };
  const id = optional(formData.get("id"));
  const { error } = id
    ? await supabase.from("vehicles").update(row).eq("id", id)
    : await supabase.from("vehicles").insert(row);
  if (error) return { ok: false, message: "Could not save the vehicle." };
  revalidatePath("/admin/vehicles");
  return done(id ? "Vehicle updated." : "Vehicle added.");
}

export async function deleteVehicle(formData: FormData) {
  const { supabase } = await requireSuperAdmin();
  const id = z.string().uuid().parse(formData.get("id"));
  const { data } = await supabase.from("vehicles").select("image_url, photos").eq("id", id).maybeSingle();
  await supabase.from("vehicles").delete().eq("id", id);
  const paths = [data?.image_url, ...(data?.photos ?? [])].map(mediaPath).filter((p): p is string => Boolean(p));
  if (paths.length) await supabase.storage.from("media").remove([...new Set(paths)]);
  updateTag(CONTENT_TAG);
  revalidatePath("/admin/vehicles");
}

/* ------------------------------------------------------------ packages */

const packageSchema = z.object({
  title: z.string().trim().min(2, "Title is required").max(160),
  destination: z.string().trim().max(160).optional().transform((v) => v || null),
  duration: z.string().trim().max(80).optional().transform((v) => v || null),
  price: z.union([z.literal(""), z.coerce.number().min(0).max(10_000_000)]).transform((v) => (v === "" ? null : v)),
  price_note: z.string().trim().max(160).optional().transform((v) => v || null),
  image_url: imageUrl,
  sort_order: z.coerce.number().int().min(0).max(999).default(0),
});

export async function savePackage(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const parsed = packageSchema.safeParse({
    title: formData.get("title"),
    destination: formData.get("destination") ?? undefined,
    duration: formData.get("duration") ?? undefined,
    price: formData.get("price") ?? "",
    price_note: formData.get("price_note") ?? undefined,
    image_url: formData.get("image_url") ?? "",
    sort_order: formData.get("sort_order") || 0,
  });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the form." };
  const row = { ...parsed.data, highlights: lines(formData.get("highlights")), is_active: formData.get("is_active") === "on" };
  const id = optional(formData.get("id"));
  const { error } = id
    ? await supabase.from("packages").update(row).eq("id", id)
    : await supabase.from("packages").insert(row);
  if (error) return { ok: false, message: "Could not save the package." };
  revalidatePath("/admin/packages");
  return done(id ? "Package updated." : "Package added.");
}

export async function deletePackage(formData: FormData) {
  const { supabase } = await requireSuperAdmin();
  const id = z.string().uuid().parse(formData.get("id"));
  const { data } = await supabase.from("packages").select("image_url").eq("id", id).maybeSingle();
  await supabase.from("packages").delete().eq("id", id);
  const path = mediaPath(data?.image_url);
  if (path) await supabase.storage.from("media").remove([path]);
  updateTag(CONTENT_TAG);
  revalidatePath("/admin/packages");
}

/* ------------------------------------------------------------- gallery */

export async function addGalleryItem(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const parsed = z
    .object({
      image_url: imageUrl.refine((v) => v !== null, "Upload an image first"),
      storage_path: z.string().max(300).optional().transform((v) => v || null),
      caption: z.string().trim().max(160).optional().transform((v) => v || null),
    })
    .safeParse({
      image_url: formData.get("image_url") ?? "",
      storage_path: formData.get("storage_path") ?? undefined,
      caption: formData.get("caption") ?? undefined,
    });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the form." };
  const { error } = await supabase.from("gallery_items").insert({ ...parsed.data, sort_order: 0 });
  if (error) return { ok: false, message: "Could not add the photo." };
  revalidatePath("/admin/gallery");
  return done("Photo added to the gallery.");
}

export async function toggleGalleryItem(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = z.string().uuid().parse(formData.get("id"));
  const active = formData.get("is_active") === "true";
  await supabase.from("gallery_items").update({ is_active: !active }).eq("id", id);
  updateTag(CONTENT_TAG);
  revalidatePath("/admin/gallery");
}

export async function deleteGalleryItem(formData: FormData) {
  const { supabase } = await requireSuperAdmin();
  const id = z.string().uuid().parse(formData.get("id"));
  const { data } = await supabase.from("gallery_items").select("storage_path").eq("id", id).maybeSingle();
  if (data?.storage_path) await supabase.storage.from("media").remove([data.storage_path]);
  await supabase.from("gallery_items").delete().eq("id", id);
  updateTag(CONTENT_TAG);
  revalidatePath("/admin/gallery");
}

/* ------------------------------------------------------------ settings */

const phone = z
  .string()
  .trim()
  .transform((v) => v.replace(/[^\d+]/g, ""))
  .refine((v) => v === "" || /^\+?\d{10,13}$/.test(v), "Enter a valid phone number")
  .transform((v) => v || null);

export async function saveSettings(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const { supabase } = await requireSuperAdmin();
  const text = (max: number) => z.string().trim().max(max).optional().transform((v) => v || null);
  const parsed = z
    .object({
      business_name: z.string().trim().min(2).max(120),
      tagline: text(160),
      phone,
      whatsapp: phone,
      email: z.union([z.literal(""), z.string().trim().email("Enter a valid email")]).transform((v) => v || null),
      address: text(300),
      city: text(120),
      instagram_url: z.union([z.literal(""), z.string().trim().url("Enter a valid Instagram URL")]).transform((v) => v || null),
      about_text: text(1000),
      since_text: text(120),
      map_query: text(300),
    })
    .safeParse(Object.fromEntries(
      ["business_name", "tagline", "phone", "whatsapp", "email", "address", "city", "instagram_url", "about_text", "since_text", "map_query"]
        .map((k) => [k, String(formData.get(k) ?? "")]),
    ));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the form." };
  const { error } = await supabase.from("site_settings").upsert({ id: 1, ...parsed.data });
  if (error) return { ok: false, message: "Could not save settings." };
  revalidatePath("/admin/settings");
  return done("Business details saved. The website is updated.");
}

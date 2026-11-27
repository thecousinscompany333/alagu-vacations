"use server";

import { assertCaptcha } from "@/lib/captcha";
import { createPublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { assertDemoAccess } from "@/lib/demo-server";
import { enquirySchema, UUID_RE, type EnquiryInput, type FieldErrors } from "@/lib/validation";

export type EnquiryState =
  | { status: "idle" }
  | { status: "error"; message: string; errors?: FieldErrors; values?: Record<string, string> }
  | { status: "success"; reference: string; enquiry: EnquiryInput };

const FIELDS = [
  "full_name", "mobile", "email", "pickup_location", "destination", "pickup_date",
  "return_date", "passengers", "vehicle_id", "trip_type", "notes",
] as const;

export async function submitEnquiry(_prev: EnquiryState, formData: FormData): Promise<EnquiryState> {
  await assertDemoAccess();
  const values = Object.fromEntries(FIELDS.map((f) => [f, String(formData.get(f) ?? "")])) as Record<string, string>;

  // Spam protection: hidden honeypot field + minimum time on page.
  const honeypot = String(formData.get("company") ?? "");
  const startedAt = Number(formData.get("started_at") ?? 0);
  if (honeypot || (startedAt && Date.now() - startedAt < 3000)) {
    return { status: "error", message: "Something went wrong. Please try again in a moment.", values };
  }

  const captcha = await assertCaptcha(formData);
  if (!captcha.ok) {
    return { status: "error", message: captcha.message, values };
  }

  if (!formData.get("consent")) {
    return {
      status: "error",
      message: "Please agree to be contacted about your enquiry.",
      values,
    };
  }

  const parsed = enquirySchema.safeParse(values);
  if (!parsed.success) {
    const errors: FieldErrors = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof FieldErrors;
      if (key && !errors[key]) errors[key] = issue.message;
    }
    return { status: "error", message: "Please check the highlighted fields.", errors, values };
  }

  if (!isSupabaseConfigured) {
    console.error("[enquiry] Supabase is not configured; enquiry not saved.");
    return {
      status: "error",
      message: "Online booking is temporarily unavailable. Please call or WhatsApp us — we'll respond quickly.",
      values,
    };
  }

  const e = parsed.data;
  const { data, error } = await createPublicClient().rpc("submit_enquiry", {
    p_full_name: e.full_name,
    p_mobile: e.mobile,
    p_email: e.email ?? "",
    p_pickup_location: e.pickup_location,
    p_destination: e.destination,
    p_pickup_date: e.pickup_date,
    p_return_date: e.return_date ?? null,
    p_passengers: e.passengers,
    // The database looks up the vehicle (and its owner, for partner vehicles) from this id.
    p_vehicle_preference: "",
    p_vehicle_id: e.vehicle_id && UUID_RE.test(e.vehicle_id) ? e.vehicle_id : null,
    p_trip_type: e.trip_type ?? "",
    p_notes: e.notes ?? "",
  });

  if (error || typeof data !== "string") {
    console.error("[enquiry] submit failed:", error?.message);
    const friendly = error?.message?.includes("Too many enquiries")
      ? "We've already received several enquiries from this number. Please call or WhatsApp us instead."
      : "We couldn't save your enquiry just now. Please try again, or call / WhatsApp us.";
    return { status: "error", message: friendly, values };
  }

  return { status: "success", reference: data, enquiry: e };
}

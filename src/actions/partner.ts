"use server";

import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { requirePartner } from "@/lib/auth";
import { CONTENT_TAG } from "@/lib/data";
import { ENQUIRY_STATUSES } from "@/lib/types";
import type { ActionResult } from "./admin";

/* Partners change data only through the partner_* database functions, which check ownership. */

const lines = (v: FormDataEntryValue | null, max: number) =>
  String(v ?? "")
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, max);

export async function updatePartnerEnquiry(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const { supabase } = await requirePartner();
  const parsed = z
    .object({
      id: z.string().uuid(),
      status: z.enum(ENQUIRY_STATUSES),
      partner_notes: z.string().max(3000, "Notes are too long."),
    })
    .safeParse({
      id: formData.get("id"),
      status: formData.get("status"),
      partner_notes: String(formData.get("partner_notes") ?? ""),
    });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid update." };

  const { id, status, partner_notes } = parsed.data;
  const { error } = await supabase.rpc("partner_update_enquiry", {
    p_id: id,
    p_status: status,
    p_partner_notes: partner_notes,
  });
  if (error) return { ok: false, message: "Could not save. Please try again." };
  revalidatePath("/partner");
  revalidatePath(`/partner/enquiries/${id}`);
  return { ok: true, message: "Enquiry updated." };
}

const httpsUrl = z.string().trim().max(500).regex(/^https:\/\//, "Photos must be uploaded images.");

export async function savePartnerVehicle(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const { supabase } = await requirePartner();
  const parsed = z
    .object({
      id: z.string().uuid(),
      description: z.string().trim().max(1000, "Description is too long (max 1000 characters)."),
      seats: z.union([z.literal(""), z.coerce.number().int().min(1).max(80)]),
      image_url: z.union([z.literal(""), httpsUrl]),
      photos: z.array(httpsUrl).max(20, "Up to 20 photos."),
    })
    .safeParse({
      id: formData.get("id"),
      description: String(formData.get("description") ?? ""),
      seats: String(formData.get("seats") ?? "").trim(),
      image_url: String(formData.get("image_url") ?? "").trim(),
      photos: formData.getAll("photos").map(String).filter(Boolean),
    });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the form." };

  const { id, description, seats, image_url, photos } = parsed.data;
  const mainPhoto = image_url || photos[0] || null;
  const allPhotos = mainPhoto && !photos.includes(mainPhoto) ? [mainPhoto, ...photos] : photos;
  const { error } = await supabase.rpc("partner_update_vehicle", {
    p_id: id,
    p_description: description,
    p_facilities: lines(formData.get("facilities"), 30),
    p_seats: seats === "" ? null : seats,
    p_image_url: mainPhoto,
    p_photos: allPhotos,
  });
  if (error) {
    console.error("[partner] update vehicle:", error.message);
    return { ok: false, message: "Could not save the vehicle. Please try again." };
  }
  updateTag(CONTENT_TAG);
  revalidatePath("/partner/vehicles");
  return { ok: true, message: "Vehicle updated. The website now shows your changes." };
}

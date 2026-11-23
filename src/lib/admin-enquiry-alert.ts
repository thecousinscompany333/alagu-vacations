import type { EnquiryInput } from "@/lib/validation";
import { formatDate, formatPhone } from "@/lib/site";

/** Short alert text for admin WhatsApp when a new web enquiry is saved. */
export function buildAdminEnquiryAlert(reference: string, e: EnquiryInput): string {
  const lines = [
    "NEW booking enquiry — Alagu Vacations",
    `Ref: ${reference}`,
    `Name: ${e.full_name}`,
    `Mobile: ${formatPhone(e.mobile)}`,
    e.email ? `Email: ${e.email}` : "",
    `Route: ${e.pickup_location} → ${e.destination}`,
    `Dates: ${formatDate(e.pickup_date)}${e.return_date ? ` – ${formatDate(e.return_date)}` : ""}`,
    `Passengers: ${e.passengers}`,
    e.trip_type ? `Trip: ${e.trip_type}` : "",
    e.vehicle_preference ? `Vehicle: ${e.vehicle_preference}` : "",
    e.notes ? `Notes: ${e.notes.slice(0, 200)}` : "",
    "",
    "Open admin dashboard to follow up.",
  ];
  return lines.filter(Boolean).join("\n").slice(0, 3500);
}
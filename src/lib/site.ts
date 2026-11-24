/** Helpers shared by server and client components. */

/** "7010998586" -> "+91 70109 98586" */
export function formatPhone(raw: string | null | undefined): string {
  if (!raw) return "";
  const d = raw.replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");
  return d.length === 10 ? `+91 ${d.slice(0, 5)} ${d.slice(5)}` : raw;
}

/** E.164-ish digits for tel: and wa.me links. */
export function phoneDigits(raw: string | null | undefined): string {
  if (!raw) return "";
  const d = raw.replace(/\D/g, "");
  return d.length === 10 ? `91${d}` : d;
}

export function whatsappLink(number: string | null | undefined, message?: string): string | null {
  const digits = phoneDigits(number);
  if (!digits) return null;
  return `https://wa.me/${digits}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
}

export type EnquiryMessageInput = {
  reference?: string;
  full_name?: string;
  mobile?: string;
  pickup_location?: string;
  destination?: string;
  pickup_date?: string;
  return_date?: string;
  passengers?: string | number;
  vehicle_preference?: string;
  trip_type?: string;
  notes?: string;
};

function fmtDate(iso?: string) {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/** Builds the WhatsApp message sent to the business (wa.me) after a saved enquiry. */
export function buildEnquiryMessage(e: EnquiryMessageInput): string {
  const lines = [
    e.reference
      ? "Hello Alagu Vacations — new booking enquiry from your website."
      : "Hello Alagu Vacations, I'd like to enquire about a trip.",
    e.reference ? `Enquiry ref: ${e.reference}` : "",
    "",
    e.full_name ? `Name: ${e.full_name}` : "",
    e.mobile ? `Mobile: ${e.mobile}` : "",
    e.pickup_location ? `Pickup: ${e.pickup_location}` : "",
    e.destination ? `Destination: ${e.destination}` : "",
    e.pickup_date ? `Start date: ${fmtDate(e.pickup_date)}` : "",
    e.return_date ? `Return date: ${fmtDate(e.return_date)}` : "",
    e.passengers ? `Passengers: ${e.passengers}` : "",
    e.vehicle_preference ? `Vehicle: ${e.vehicle_preference}` : "",
    e.trip_type ? `Trip type: ${e.trip_type}` : "",
    e.notes ? `Notes: ${e.notes}` : "",
  ];
  return lines.filter((l, i) => l !== "" || i === 2).join("\n").trim();
}

export function formatDate(iso: string | null | undefined): string {
  return iso ? fmtDate(iso.slice(0, 10)) : "—";
}

const MS_PER_DAY = 86_400_000;

/** Pending enquiries older than 24 hours (from created_at) need follow-up. */
export function isPendingStale(status: string, createdAtIso: string, maxAgeMs = MS_PER_DAY): boolean {
  if (status !== "pending") return false;
  const created = Date.parse(createdAtIso);
  if (Number.isNaN(created)) return false;
  return Date.now() - created >= maxAgeMs;
}

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

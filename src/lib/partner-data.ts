import "server-only";
import type { PartnerSession } from "@/lib/auth";
import type { EnquiryStatus } from "@/lib/types";

/** One enquiry as a partner sees it. Customer contact fields are null until an admin releases them. */
export type PartnerEnquiry = {
  id: string;
  reference: string;
  created_at: string;
  pickup_location: string;
  destination: string;
  pickup_date: string;
  return_date: string | null;
  passengers: number;
  trip_type: string | null;
  vehicle_id: string | null;
  vehicle_name: string | null;
  status: EnquiryStatus;
  partner_notes: string | null;
  shared_at: string | null;
  full_name: string | null;
  mobile: string | null;
  email: string | null;
  notes: string | null;
};

export async function listPartnerEnquiries(
  supabase: PartnerSession["supabase"],
  opts: { status?: EnquiryStatus | null; search?: string; id?: string } = {},
): Promise<{ rows: PartnerEnquiry[]; error: boolean }> {
  const { data, error } = await supabase.rpc("partner_list_enquiries", {
    p_status: opts.status ?? null,
    p_search: opts.search || null,
    p_id: opts.id ?? null,
  });
  if (error) console.error("[partner] list enquiries:", error.message);
  return { rows: (data ?? []) as PartnerEnquiry[], error: Boolean(error) };
}

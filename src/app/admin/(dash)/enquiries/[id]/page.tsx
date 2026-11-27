import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, EyeOff, Mail, Phone, Share2 } from "lucide-react";
import { assignEnquiryPartner, setEnquiryShared, updateEnquiry } from "@/actions/admin";
import { WhatsAppIcon } from "@/components/icons";
import { ActionForm, SubmitButton, adminInput, adminLabel } from "@/components/admin/forms";
import { Card, LoadingBlock, StatusBadge } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import { formatDate, formatPhone, phoneDigits, whatsappLink } from "@/lib/site";
import { ENQUIRY_STATUSES, type Enquiry } from "@/lib/types";

export default function EnquiryPage(props: PageProps<"/admin/enquiries/[id]">) {
  return (
    <>
      <Link href="/admin" className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-navy-900">
        <ArrowLeft className="h-4 w-4" aria-hidden /> All enquiries
      </Link>
      <Suspense fallback={<LoadingBlock />}>
        <EnquiryDetail params={props.params} />
      </Suspense>
    </>
  );
}

async function EnquiryDetail({ params }: { params: PageProps<"/admin/enquiries/[id]">["params"] }) {
  const { supabase } = await requireAdmin();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [{ data }, { data: partnerRows }] = await Promise.all([
    supabase.from("enquiries").select("*").eq("id", id).maybeSingle(),
    supabase.from("partners").select("id, business_name, is_active").order("business_name"),
  ]);
  if (!data) notFound();
  const e = data as Enquiry;
  const partners = partnerRows ?? [];
  const owner = e.partner_id ? partners.find((p) => p.id === e.partner_id) : null;
  const wa = whatsappLink(e.mobile, `Hello ${e.full_name}, this is Alagu Vacations regarding your trip enquiry ${e.reference} (${e.pickup_location} → ${e.destination}, ${formatDate(e.pickup_date)}).`);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-sm text-slate-500">{e.reference}</p>
            <h1 className="mt-1 font-display text-2xl font-semibold text-navy-900">{e.full_name}</h1>
            <p className="text-sm text-slate-500">Received {new Date(e.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</p>
          </div>
          <StatusBadge status={e.status} />
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <a href={`tel:+${phoneDigits(e.mobile)}`} className="inline-flex items-center gap-2 rounded-lg bg-navy-800 px-3.5 py-2 text-sm font-semibold text-white"><Phone className="h-4 w-4" aria-hidden /> {formatPhone(e.mobile)}</a>
          {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-[#1fa855] px-3.5 py-2 text-sm font-semibold text-white"><WhatsAppIcon className="h-4 w-4" /> WhatsApp</a>}
          {e.email && <a href={`mailto:${e.email}`} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3.5 py-2 text-sm font-semibold"><Mail className="h-4 w-4" aria-hidden /> {e.email}</a>}
        </div>

        <dl className="mt-6 grid gap-x-6 gap-y-4 sm:grid-cols-2">
          <Item k="Pickup location" v={e.pickup_location} />
          <Item k="Destination" v={e.destination} />
          <Item k="Pickup date" v={formatDate(e.pickup_date)} />
          <Item k="Return date" v={formatDate(e.return_date)} />
          <Item k="Passengers" v={String(e.passengers)} />
          <Item k="Vehicle preference" v={e.vehicle_preference ?? "No preference"} />
          <Item k="Owner" v={e.partner_id ? owner?.business_name ?? "Partner" : "Alagu Vacations"} />
          <Item k="Trip type" v={e.trip_type ?? "—"} />
        </dl>
        {e.notes && (
          <div className="mt-5">
            <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">Additional requirements</dt>
            <dd className="mt-1 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm">{e.notes}</dd>
          </div>
        )}
      </Card>

      <Card>
        <h2 className="font-semibold text-navy-900">Follow-up</h2>
        <ActionForm key={e.updated_at} action={updateEnquiry} className="mt-4 space-y-4">
          <input type="hidden" name="id" value={e.id} />
          <div>
            <label htmlFor="status" className={adminLabel}>Status</label>
            <select id="status" name="status" defaultValue={e.status} className={adminInput}>
              {ENQUIRY_STATUSES.map((s) => <option key={s} value={s} className="capitalize">{s[0].toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="admin_notes" className={adminLabel}>Internal notes</label>
            <textarea id="admin_notes" name="admin_notes" rows={5} defaultValue={e.admin_notes ?? ""} placeholder="Quote given, driver assigned, advance received…" className={adminInput} />
          </div>
          <SubmitButton className="w-full">Save</SubmitButton>
        </ActionForm>
        <p className="mt-4 text-xs text-slate-500">Mark as <strong>confirmed</strong> only after you have verified availability and agreed the trip with the customer.</p>

        {partners.length > 0 && (
          <div className="mt-6 border-t border-slate-100 pt-5">
            <h2 className="font-semibold text-navy-900">Partner</h2>
            {e.partner_id ? (
              <>
                <p className="mt-2 text-sm text-slate-700">
                  <span className="font-medium">{owner?.business_name ?? "Partner"}</span> sees this enquiry.{" "}
                  {e.shared_at
                    ? `Customer contact shared on ${new Date(e.shared_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" })}.`
                    : "They see trip details only. Name, mobile, email and notes are hidden."}
                </p>
                <form action={setEnquiryShared} className="mt-3">
                  <input type="hidden" name="id" value={e.id} />
                  <input type="hidden" name="share" value={e.shared_at ? "false" : "true"} />
                  {e.shared_at ? (
                    <button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold hover:bg-slate-50">
                      <EyeOff className="h-4 w-4" aria-hidden /> Hide contact from partner
                    </button>
                  ) : (
                    <button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600">
                      <Share2 className="h-4 w-4" aria-hidden /> Release contact to partner
                    </button>
                  )}
                </form>
                {e.partner_notes && (
                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Partner&apos;s notes</p>
                    <p className="mt-1 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm">{e.partner_notes}</p>
                  </div>
                )}
              </>
            ) : (
              <p className="mt-2 text-sm text-slate-700">Handled by Alagu Vacations. You can hand it to a partner below.</p>
            )}
            <ActionForm key={e.partner_id ?? "own"} action={assignEnquiryPartner} className="mt-4 space-y-2">
              <input type="hidden" name="id" value={e.id} />
              <label htmlFor="partner_id" className={adminLabel}>Assign to</label>
              <select id="partner_id" name="partner_id" defaultValue={e.partner_id ?? ""} className={adminInput}>
                <option value="">Alagu Vacations (keep in house)</option>
                {partners.map((p) => (
                  <option key={p.id} value={p.id}>{p.business_name}{p.is_active ? "" : " (paused)"}</option>
                ))}
              </select>
              <SubmitButton className="w-full">Save owner</SubmitButton>
            </ActionForm>
          </div>
        )}
      </Card>
    </div>
  );
}

function Item({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">{k}</dt>
      <dd className="mt-0.5 text-sm text-ink">{v}</dd>
    </div>
  );
}

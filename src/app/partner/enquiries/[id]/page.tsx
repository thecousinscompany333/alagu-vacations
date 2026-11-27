import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, Lock, Mail, Phone } from "lucide-react";
import { updatePartnerEnquiry } from "@/actions/partner";
import { WhatsAppIcon } from "@/components/icons";
import { ActionForm, SubmitButton, adminInput, adminLabel } from "@/components/admin/forms";
import { Card, LoadingBlock, StatusBadge } from "@/components/admin/ui";
import { requirePartner } from "@/lib/auth";
import { listPartnerEnquiries } from "@/lib/partner-data";
import { formatDate, formatPhone, phoneDigits, whatsappLink } from "@/lib/site";
import { ENQUIRY_STATUSES } from "@/lib/types";
import { UUID_RE } from "@/lib/validation";

export default function PartnerEnquiryPage(props: PageProps<"/partner/enquiries/[id]">) {
  return (
    <>
      <Link href="/partner" className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-navy-900">
        <ArrowLeft className="h-4 w-4" aria-hidden /> My enquiries
      </Link>
      <Suspense fallback={<LoadingBlock />}>
        <EnquiryDetail params={props.params} />
      </Suspense>
    </>
  );
}

async function EnquiryDetail({ params }: { params: PageProps<"/partner/enquiries/[id]">["params"] }) {
  const { supabase, partner } = await requirePartner();
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();
  const { rows } = await listPartnerEnquiries(supabase, { id });
  const e = rows[0];
  if (!e) notFound();
  const shared = Boolean(e.shared_at && e.mobile);
  const wa = shared
    ? whatsappLink(e.mobile, `Hello ${e.full_name ?? ""}, this is ${partner.business_name} (Alagu Vacations partner) regarding your trip enquiry ${e.reference} (${e.pickup_location} → ${e.destination}, ${formatDate(e.pickup_date)}).`)
    : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-sm text-slate-500">{e.reference}</p>
            <h1 className="mt-1 font-display text-2xl font-semibold text-navy-900">
              {shared ? e.full_name : `${e.pickup_location} → ${e.destination}`}
            </h1>
            <p className="text-sm text-slate-500">Received {new Date(e.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</p>
          </div>
          <StatusBadge status={e.status} />
        </div>

        {shared ? (
          <div className="mt-5 flex flex-wrap gap-2">
            <a href={`tel:+${phoneDigits(e.mobile)}`} className="inline-flex items-center gap-2 rounded-lg bg-navy-800 px-3.5 py-2 text-sm font-semibold text-white"><Phone className="h-4 w-4" aria-hidden /> {formatPhone(e.mobile)}</a>
            {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-[#1fa855] px-3.5 py-2 text-sm font-semibold text-white"><WhatsAppIcon className="h-4 w-4" /> WhatsApp</a>}
            {e.email && <a href={`mailto:${e.email}`} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3.5 py-2 text-sm font-semibold"><Mail className="h-4 w-4" aria-hidden /> {e.email}</a>}
          </div>
        ) : (
          <p className="mt-5 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-950">
            <Lock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            Customer name and mobile are hidden until Alagu Vacations shares this enquiry with you.
          </p>
        )}

        <dl className="mt-6 grid gap-x-6 gap-y-4 sm:grid-cols-2">
          <Item k="Pickup location" v={e.pickup_location} />
          <Item k="Destination" v={e.destination} />
          <Item k="Pickup date" v={formatDate(e.pickup_date)} />
          <Item k="Return date" v={formatDate(e.return_date)} />
          <Item k="Passengers" v={String(e.passengers)} />
          <Item k="Vehicle" v={e.vehicle_name ?? "—"} />
          <Item k="Trip type" v={e.trip_type ?? "—"} />
        </dl>
        {shared && e.notes && (
          <div className="mt-5">
            <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">Additional requirements</dt>
            <dd className="mt-1 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm">{e.notes}</dd>
          </div>
        )}
      </Card>

      <Card>
        <h2 className="font-semibold text-navy-900">Follow-up</h2>
        <ActionForm key={`${e.status}:${e.partner_notes ?? ""}`} action={updatePartnerEnquiry} className="mt-4 space-y-4">
          <input type="hidden" name="id" value={e.id} />
          <div>
            <label htmlFor="status" className={adminLabel}>Status</label>
            <select id="status" name="status" defaultValue={e.status} className={adminInput}>
              {ENQUIRY_STATUSES.map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="partner_notes" className={adminLabel}>My notes</label>
            <textarea id="partner_notes" name="partner_notes" rows={5} maxLength={3000} defaultValue={e.partner_notes ?? ""} placeholder="Quote given, driver assigned, advance received…" className={adminInput} />
            <p className="mt-1 text-xs text-slate-500">Alagu Vacations can see your notes.</p>
          </div>
          <SubmitButton className="w-full">Save</SubmitButton>
        </ActionForm>
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

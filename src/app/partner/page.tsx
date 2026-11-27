import Link from "next/link";
import { Suspense } from "react";
import { Lock, Search } from "lucide-react";
import { Card, LoadingBlock, PageTitle, StatusBadge } from "@/components/admin/ui";
import { adminInput } from "@/components/admin/forms";
import { requirePartner } from "@/lib/auth";
import { listPartnerEnquiries } from "@/lib/partner-data";
import { formatDate, formatPhone, isPendingStale } from "@/lib/site";
import { ENQUIRY_STATUSES, type EnquiryStatus } from "@/lib/types";

export default function PartnerEnquiriesPage(props: PageProps<"/partner">) {
  return (
    <>
      <PageTitle
        title="My enquiries"
        text="Booking enquiries for your vehicles. Customer name and mobile appear once Alagu Vacations shares them with you."
      />
      <Suspense fallback={<LoadingBlock />}>
        <EnquiryList searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}

async function EnquiryList({ searchParams }: { searchParams: PageProps<"/partner">["searchParams"] }) {
  const { supabase } = await requirePartner();
  const sp = await searchParams;
  const status =
    typeof sp.status === "string" && (ENQUIRY_STATUSES as readonly string[]).includes(sp.status) ? (sp.status as EnquiryStatus) : null;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 60) : "";

  const { rows: all, error } = await listPartnerEnquiries(supabase);
  const counts = ENQUIRY_STATUSES.map((s) => [s, all.filter((e) => e.status === s).length] as const);
  const needle = q.toLowerCase();
  const rows = all.filter(
    (e) =>
      (!status || e.status === status) &&
      (!needle ||
        [e.reference, e.destination, e.pickup_location, e.full_name, e.mobile].some((v) => v?.toLowerCase().includes(needle))),
  );

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {counts.map(([s, n]) => (
          <Link key={s} href={status === s ? "/partner" : `/partner?status=${s}`}
            className={`rounded-xl border bg-white p-4 shadow-sm transition hover:border-navy-700 ${status === s ? "border-navy-700 ring-2 ring-navy-100" : "border-slate-200"}`}>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{s}</p>
            <p className="mt-1 font-display text-3xl font-semibold text-navy-900">{n}</p>
          </Link>
        ))}
      </div>

      <form className="mt-6 flex gap-2" role="search">
        {status && <input type="hidden" name="status" value={status} />}
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
          <input name="q" defaultValue={q} placeholder="Search reference, place or customer" className={`${adminInput} pl-9`} aria-label="Search enquiries" />
        </div>
        <button className="rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium hover:bg-slate-50">Search</button>
        {(q || status) && <Link href="/partner" className="self-center px-2 text-sm text-slate-600 underline">Clear</Link>}
      </form>

      {error && <p className="mt-4 text-sm text-red-700">Could not load enquiries.</p>}

      {rows.length === 0 ? (
        <Card className="mt-6 text-center text-slate-600">
          {q || status ? "No enquiries match your filters." : "No enquiries yet. When a customer books one of your vehicles, it appears here."}
        </Card>
      ) : (
        <ul className="mt-6 space-y-3">
          {rows.map((e) => {
            const stale = isPendingStale(e.status, e.created_at);
            return (
              <li key={e.id}>
                <Link href={`/partner/enquiries/${e.id}`} className="block">
                  <Card className={`transition hover:border-navy-700 ${stale ? "border-red-400 bg-red-50 ring-1 ring-red-200" : ""}`}>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-navy-900">{e.pickup_location} → {e.destination}</p>
                        <p className="text-sm text-slate-600">
                          {formatDate(e.pickup_date)}{e.return_date ? ` – ${formatDate(e.return_date)}` : ""} · {e.passengers} pax
                          {e.vehicle_name ? ` · ${e.vehicle_name}` : ""}
                        </p>
                      </div>
                      <StatusBadge status={e.status} />
                    </div>
                    <p className="mt-2 flex flex-wrap items-center gap-x-2 text-xs text-slate-500">
                      <span className="font-mono">{e.reference}</span>
                      <span>·</span>
                      {e.shared_at && e.full_name ? (
                        <span className="text-slate-700">{e.full_name}{e.mobile ? ` · ${formatPhone(e.mobile)}` : ""}</span>
                      ) : (
                        <span className="inline-flex items-center gap-1"><Lock className="h-3 w-3" aria-hidden /> Contact not shared yet</span>
                      )}
                    </p>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

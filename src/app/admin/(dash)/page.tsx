import Link from "next/link";
import { Suspense } from "react";
import { Phone, Search } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons";
import { Card, LoadingBlock, PageTitle, StatusBadge } from "@/components/admin/ui";
import { adminInput } from "@/components/admin/forms";
import { requireAdmin } from "@/lib/auth";
import { formatDate, formatPhone, isPendingStale, phoneDigits, whatsappLink } from "@/lib/site";
import { ENQUIRY_STATUSES, type Enquiry, type EnquiryStatus } from "@/lib/types";

export default function EnquiriesPage(props: PageProps<"/admin">) {
  return (
    <>
      <PageTitle title="Booking enquiries" text="New enquiries arrive here. Update the status as you follow up with each customer." />
      <Suspense fallback={<LoadingBlock />}>
        <EnquiryList searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}

async function EnquiryList({ searchParams }: { searchParams: PageProps<"/admin">["searchParams"] }) {
  const { supabase } = await requireAdmin();
  const sp = await searchParams;
  const status = typeof sp.status === "string" && (ENQUIRY_STATUSES as readonly string[]).includes(sp.status) ? (sp.status as EnquiryStatus) : null;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 60) : "";

  const counts = await Promise.all(
    ENQUIRY_STATUSES.map(async (s) => {
      const { count } = await supabase.from("enquiries").select("id", { count: "exact", head: true }).eq("status", s);
      return [s, count ?? 0] as const;
    }),
  );

  let query = supabase.from("enquiries").select("*").order("created_at", { ascending: false }).limit(200);
  if (status) query = query.eq("status", status);
  if (q) {
    const safe = q.replace(/[%,()]/g, "");
    query = query.or(`full_name.ilike.%${safe}%,mobile.ilike.%${safe}%,reference.ilike.%${safe}%,destination.ilike.%${safe}%`);
  }
  const { data, error } = await query;
  const rows = (data ?? []) as Enquiry[];

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {counts.map(([s, n]) => (
          <Link key={s} href={status === s ? "/admin" : `/admin?status=${s}`}
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
          <input name="q" defaultValue={q} placeholder="Search name, mobile, reference or destination" className={`${adminInput} pl-9`} aria-label="Search enquiries" />
        </div>
        <button className="rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium hover:bg-slate-50">Search</button>
        {(q || status) && <Link href="/admin" className="self-center px-2 text-sm text-slate-600 underline">Clear</Link>}
      </form>

      {error && <p className="mt-4 text-sm text-red-700">Could not load enquiries.</p>}

      {rows.length === 0 ? (
        <Card className="mt-6 text-center text-slate-600">
          {q || status ? "No enquiries match your filters." : "No enquiries yet. New booking enquiries from the website will appear here."}
        </Card>
      ) : (
        <>
          {/* Desktop table */}
          <div className="mt-6 hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Customer</th><th className="px-4 py-3">Trip</th><th className="px-4 py-3">Dates</th>
                  <th className="px-4 py-3">Pax</th><th className="px-4 py-3">Status</th><th className="px-4 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((e) => {
                  const stale = isPendingStale(e.status, e.created_at);
                  return (
                  <tr
                    key={e.id}
                    className={
                      stale
                        ? "border-l-4 border-l-red-500 bg-red-50 hover:bg-red-50/90"
                        : "hover:bg-slate-50/70"
                    }
                  >
                    <td className="px-4 py-3">
                      <Link href={`/admin/enquiries/${e.id}`} className="font-semibold text-navy-900 hover:underline">{e.full_name}</Link>
                      <p className="text-xs text-slate-500">{formatPhone(e.mobile)} · <span className="font-mono">{e.reference}</span></p>
                    </td>
                    <td className="px-4 py-3"><p>{e.pickup_location} → {e.destination}</p><p className="text-xs text-slate-500">{e.trip_type ?? "—"}</p></td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatDate(e.pickup_date)}{e.return_date ? ` – ${formatDate(e.return_date)}` : ""}</td>
                    <td className="px-4 py-3">{e.passengers}</td>
                    <td className="px-4 py-3"><StatusBadge status={e.status} /></td>
                    <td className="px-4 py-3"><RowActions e={e} /></td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Mobile cards */}
          <ul className="mt-6 space-y-3 md:hidden">
            {rows.map((e) => {
              const stale = isPendingStale(e.status, e.created_at);
              return (
              <li key={e.id}>
                <Card
                  className={
                    stale
                      ? "border-red-400 bg-red-50 ring-1 ring-red-200"
                      : ""
                  }
                >
                  <div className="flex items-start justify-between gap-2">
                    <Link href={`/admin/enquiries/${e.id}`} className="font-semibold text-navy-900">{e.full_name}</Link>
                    <div className="flex shrink-0 items-center gap-2">
                      {stale ? (
                        <span className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                          Overdue
                        </span>
                      ) : null}
                      <StatusBadge status={e.status} />
                    </div>
                  </div>
                  <p className="mt-1 text-sm">{e.pickup_location} → {e.destination}</p>
                  <p className="text-xs text-slate-500">{formatDate(e.pickup_date)} · {e.passengers} pax · <span className="font-mono">{e.reference}</span></p>
                  <div className="mt-3"><RowActions e={e} /></div>
                </Card>
              </li>
              );
            })}
          </ul>
        </>
      )}
    </>
  );
}

function RowActions({ e }: { e: Enquiry }) {
  const wa = whatsappLink(e.mobile, `Hello ${e.full_name}, this is Alagu Vacations regarding your enquiry ${e.reference}.`);
  return (
    <div className="flex items-center gap-1.5">
      <a href={`tel:+${phoneDigits(e.mobile)}`} className="rounded-md p-2 text-navy-800 hover:bg-navy-100" aria-label={`Call ${e.full_name}`}><Phone className="h-4 w-4" /></a>
      {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className="rounded-md p-2 text-[#178a45] hover:bg-emerald-50" aria-label={`WhatsApp ${e.full_name}`}><WhatsAppIcon className="h-4 w-4" /></a>}
      <Link href={`/admin/enquiries/${e.id}`} className="rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-medium hover:bg-slate-50">Open</Link>
    </div>
  );
}

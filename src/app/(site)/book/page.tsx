import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import { CircleCheck, Clock, Phone, ShieldCheck } from "lucide-react";
import { BookingForm } from "@/components/site/BookingForm";
import { WhatsAppIcon } from "@/components/icons";
import { getSettings, getVehicles } from "@/lib/data";
import { formatPhone, phoneDigits, whatsappLink } from "@/lib/site";
import { isDemoMode } from "@/lib/demo";
import { STATIC_DATE_MIN } from "@/lib/validation";

export const metadata: Metadata = {
  title: "Book Your Trip",
  description:
    "Book Force Urbania van hire and all-India tour enquiries with Alagu Vacations, Dindigul (since 1992). Family, college, pilgrimage, honeymoon and package trips — no online payment.",
  alternates: { canonical: "/book" },
  openGraph: {
    title: "Book Your Trip | Alagu Vacations",
    description: "Send your route, dates and passenger count. We confirm availability by phone or WhatsApp.",
  },
};

const PREFILL_KEYS = ["pickup_location", "destination", "pickup_date", "return_date", "passengers", "trip_type", "vehicle_preference"];

export default async function BookPage(props: PageProps<"/book">) {
  const [settings, vehicles] = await Promise.all([getSettings(), getVehicles()]);
  const wa = whatsappLink(settings.whatsapp, "Hello Alagu Vacations, I'd like to plan a trip.");

  return (
    <>
      <section className="bg-navy-900 bg-ornament pb-16 pt-32 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-gold-300">Booking enquiry</p>
          <h1 className="mt-3 font-display text-4xl font-semibold sm:text-5xl">Book your trip</h1>
          <p className="mt-4 max-w-2xl text-lg text-white/75">
            Share your travel plan and we&apos;ll check vehicle availability for your dates. Nothing is charged online.
            We confirm every booking personally.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_360px] lg:px-8">
        <div id="booking-form" className="scroll-mt-28">
          <Suspense fallback={<FormSkeleton />}>
            <PrefilledForm
              searchParams={props.searchParams}
              vehicleOptions={vehicles.map((v) => v.name)}
              phone={settings.phone}
              whatsapp={settings.whatsapp}
            />
          </Suspense>
        </div>

        <aside className="space-y-6">
          <div className="overflow-hidden rounded-[1.5rem] bg-white shadow-card ring-1 ring-navy-100">
            <div className="relative aspect-[446/280]">
              <Image src="/images/van-side-wide.webp" alt="Alagu Vacations Force Urbania" fill sizes="360px" className="object-cover" />
            </div>
            <div className="p-6">
              <h2 className="font-display text-xl font-semibold text-navy-900">What happens next?</h2>
              <ol className="mt-4 space-y-4 text-sm text-muted">
                <Step icon={<CircleCheck />} title="You send an enquiry" text="You get a reference number straight away." />
                <Step icon={<Clock />} title="We check availability" text="We review your dates, route and group size." />
                <Step icon={<Phone />} title="We call you back" text="We confirm the trip and price with you directly." />
              </ol>
            </div>
          </div>

          <div className="rounded-[1.5rem] bg-navy-900 p-6 text-white">
            <p className="flex items-center gap-2 font-semibold"><ShieldCheck className="h-5 w-5 text-gold-300" aria-hidden /> Prefer to talk?</p>
            <p className="mt-2 text-sm text-white/70">Call or WhatsApp us directly. We&apos;re happy to help plan your route.</p>
            <div className="mt-5 grid gap-3">
              {settings.phone && (
                <a href={`tel:+${phoneDigits(settings.phone)}`} className="flex items-center justify-center gap-2 rounded-full bg-gold-500 py-3 font-semibold text-navy-950 hover:bg-gold-300">
                  <Phone className="h-4 w-4" aria-hidden /> {formatPhone(settings.phone)}
                </a>
              )}
              {wa && (
                <a href={wa} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded-full border border-white/25 py-3 font-semibold hover:bg-white/10">
                  <WhatsAppIcon className="h-5 w-5" /> WhatsApp us
                </a>
              )}
            </div>
          </div>
        </aside>
      </section>
    </>
  );
}

async function PrefilledForm({
  searchParams,
  ...rest
}: {
  searchParams: PageProps<"/book">["searchParams"];
  vehicleOptions: string[];
  phone: string | null;
  whatsapp: string | null;
}) {
  const sp = await searchParams;
  const prefill: Record<string, string> = {};
  for (const k of PREFILL_KEYS) {
    const v = sp[k];
    if (typeof v === "string") prefill[k] = v.slice(0, 160);
  }
  return <BookingForm prefill={prefill} minDate={STATIC_DATE_MIN} demo={isDemoMode()} {...rest} />;
}

function Step({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 text-gold-600 [&>svg]:h-5 [&>svg]:w-5" aria-hidden>{icon}</span>
      <span><strong className="block text-navy-900">{title}</strong>{text}</span>
    </li>
  );
}

function FormSkeleton() {
  return (
    <div className="animate-pulse rounded-[1.75rem] bg-white p-8 shadow-card ring-1 ring-navy-100" aria-label="Loading booking form">
      <div className="h-6 w-40 rounded bg-navy-100" />
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-12 rounded-xl bg-navy-100/70" />)}
      </div>
      <div className="mt-8 h-12 w-56 rounded-full bg-navy-100" />
    </div>
  );
}

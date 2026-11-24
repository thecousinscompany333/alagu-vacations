import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight, Calendar, Church, Compass, GraduationCap, Heart, MapPin, Phone, Plane, Route, ShieldCheck, Snowflake,
  Sparkles, Users, Wallet,
} from "lucide-react";
import { Gallery } from "@/components/site/Gallery";
import { JsonLd } from "@/components/site/JsonLd";
import { QuickBooking } from "@/components/site/QuickBooking";
import { VehicleCard } from "@/components/site/VehicleCard";
import { InstagramIcon, WhatsAppIcon } from "@/components/icons";
import { getGallery, getPackages, getSettings, getVehicles } from "@/lib/data";
import { INDIA_REGION_ENQUIRIES } from "@/lib/regions";
import { faqJsonLd, homeDescription, localBusinessJsonLd } from "@/lib/seo";
import { formatPhone, phoneDigits, whatsappLink } from "@/lib/site";
import type { TravelPackage } from "@/lib/types";
import { turnstileSiteKey } from "@/lib/turnstile-public";
import { STATIC_DATE_MIN } from "@/lib/validation";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const description = homeDescription(settings);
  return {
    title: { absolute: "Alagu Vacations | All-India Tours & Force Urbania Rental, Dindigul" },
    description,
    alternates: { canonical: "/" },
    openGraph: {
      title: "Alagu Vacations | Tours & Holiday Packages",
      description,
      images: [{ url: "/images/van-front.webp", alt: "Alagu Vacations Force Urbania van" }],
    },
  };
}

export default async function HomePage() {
  const [settings, vehicles, packages, gallery] = await Promise.all([
    getSettings(), getVehicles(), getPackages(), getGallery(),
  ]);
  const wa = whatsappLink(settings.whatsapp, "Hello Alagu Vacations, I'd like to plan a trip.");
  const destinations = uniqueDestinations(packages);
  // Avoid duplicating the same trip: destination tiles and package cards share one DB source.
  const showDestinationTiles = destinations.length > 0 && packages.length === 0;

  return (
    <>
      <JsonLd data={[localBusinessJsonLd(settings), faqJsonLd()]} />
      {/* ------------------------------------------------------------------ Hero */}
      <section id="home" className="relative overflow-hidden bg-navy-900 bg-ornament pt-28 text-white sm:pt-32">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 pb-40 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:px-8 lg:pb-48">
          <div className="animate-fade-up">
            {settings.since_text && (
              <p className="inline-flex items-center gap-2 rounded-full border border-gold-500/40 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-gold-300">
                <Sparkles className="h-3.5 w-3.5" aria-hidden /> {settings.since_text}
              </p>
            )}
            <h1 className="mt-6 font-display text-4xl font-semibold leading-[1.08] sm:text-5xl lg:text-6xl">
              All Over India — <span className="text-gold-500">Travel</span> With Comfort &amp; Care
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/80">
              From mountains to beaches, temples to cities — plan group journeys across India in our 16-seater A/C Force
              Urbania. Family, college, pilgrimage, honeymoon and customized package enquiries from Dindigul, backed by{" "}
              <strong className="font-semibold text-white">Alagu Travels since 1992</strong>.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/book" className="inline-flex items-center justify-center gap-2 rounded-full bg-gold-500 px-7 py-4 font-semibold text-navy-950 shadow-lift transition hover:bg-gold-300">
                Book Your Trip <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link href="/#vehicles" className="inline-flex items-center justify-center rounded-full border border-white/30 px-7 py-4 font-semibold text-white transition hover:bg-white/10">
                Explore Our Services
              </Link>
            </div>
            <dl className="mt-10 grid max-w-md grid-cols-3 gap-4 border-t border-white/10 pt-6">
              <Stat value="16" label="Seater A/C van" />
              <Stat value="New" label="Force Urbania" />
              <Stat value="India" label="All-India routes" />
            </dl>
          </div>

          <div className="relative mx-auto w-full max-w-md animate-fade-up [animation-delay:150ms] lg:max-w-none">
            <div className="relative ml-auto aspect-[4/5] w-[82%] overflow-hidden rounded-[2rem] shadow-2xl ring-1 ring-white/15">
              <Image src="/images/van-front.webp" alt="Alagu Vacations' blue Force Urbania van" fill preload sizes="(min-width: 1024px) 34vw, 80vw" className="object-cover" />
            </div>
            <div className="absolute -bottom-8 left-0 aspect-square w-[46%] overflow-hidden rounded-[1.5rem] border-4 border-navy-900 shadow-2xl">
              <Image src="/images/interior-aisle.webp" alt="Inside the van: rows of high-back seats with A/C vents" fill sizes="(min-width: 1024px) 20vw, 40vw" className="object-cover" />
            </div>
            <div className="absolute -left-2 top-8 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-navy-900 shadow-lift sm:-left-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-navy-100"><Snowflake className="h-5 w-5 text-navy-700" aria-hidden /></span>
              <span className="text-sm leading-tight"><strong className="block">A/C Comfort</strong><span className="text-muted">16 seats</span></span>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------- Quick booking */}
      <section aria-label="Quick booking" className="relative z-10 mx-auto -mt-28 max-w-7xl px-4 sm:px-6 lg:-mt-32 lg:px-8">
        <QuickBooking minDate={STATIC_DATE_MIN} turnstileSiteKey={turnstileSiteKey()} />
      </section>

      {/* ---------------------------------------------------------------- About */}
      <section id="about" className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <div className="relative">
            <div className="relative aspect-[517/420] overflow-hidden rounded-[2rem] shadow-card">
              <Image src="/images/launch-garland.webp" alt="The Alagu Vacations team with the garlanded Urbania on launch day" fill sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover" />
            </div>
            <div className="absolute -bottom-6 -right-2 hidden w-44 overflow-hidden rounded-2xl border-4 border-ivory shadow-lift sm:block">
              <Image src="/images/logo.webp" alt="" width={176} height={176} className="h-auto w-full" />
            </div>
          </div>
          <div>
            <SectionLabel>About Alagu Vacations</SectionLabel>
            <h2 className="mt-3 font-display text-3xl font-semibold leading-tight text-navy-900 sm:text-4xl">
              Comfortable journeys for families and friends
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-muted">
              Alagu Vacations offers <strong className="text-ink">tours and holiday packages</strong> from Dindigul. We take
              booking enquiries for trips across India — budget getaways, planned packages, and routes you design with our team.
              Explore more, travel comfortably, and discover incredible India together.
            </p>
            <ul className="mt-7 grid gap-4 sm:grid-cols-2">
              <Point icon={<Wallet />} title="Budget-friendly trips" text="Trips for all your friends and family." />
              <Point icon={<Heart />} title="Luxury & comfort" text="A comfortable journey in our new A/C van." />
              <Point icon={<ShieldCheck />} title="Experienced drivers" text="Well-organised trips with experienced drivers." />
              <Point icon={<Route />} title="Package trips" text="Tell us where you want to go. We'll plan it with you." />
            </ul>
            {settings.since_text && (
              <p className="mt-7 border-l-4 border-gold-500 pl-4 font-display text-lg italic text-navy-800">
                {settings.since_text}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- Vehicles */}
      <section id="vehicles" className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading label="Our Vehicles" title="Travel in comfort" text="Meet our fleet. Every trip is planned around your group, your dates and your route." />
          <div className="mt-12 grid gap-8">
            {vehicles.map((v) => <VehicleCard key={v.id} vehicle={v} />)}
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------- India regions */}
      <section id="regions" className="bg-ivory py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            label="Explore India"
            title="Popular regions we plan for you"
            text="Tell us your region and dates — we confirm route, permits and availability. Prices are shared after enquiry (no fixed rates published online)."
          />
          <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {INDIA_REGION_ENQUIRIES.map((r) => (
              <li key={r.name} className="rounded-[1.25rem] bg-white p-5 shadow-card ring-1 ring-navy-100">
                <h3 className="font-display text-xl font-semibold text-navy-900">{r.name}</h3>
                <p className="mt-2 text-sm text-muted">{r.blurb}</p>
                <Link
                  href={`/book?destination=${encodeURIComponent(r.destination)}&trip_type=${encodeURIComponent("Package trip")}#booking-form`}
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-navy-700 hover:text-gold-600"
                >
                  Enquire for {r.name} <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* -------------------------------------------- Destinations + Packages */}
      <section id="packages" className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {showDestinationTiles && (
            <div className="mb-20">
              <SectionHeading label="Popular Destinations" title="Where we travel" />
              <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {destinations.map((d) => (
                  <li key={d.name} className="group overflow-hidden rounded-[1.5rem] bg-white shadow-card ring-1 ring-navy-100">
                    <div className="relative aspect-[4/3] bg-navy-100">
                      {d.image && <Image src={d.image} alt={d.name} fill sizes="(min-width:1024px) 33vw, 100vw" className="object-cover transition duration-500 group-hover:scale-105" />}
                    </div>
                    <div className="flex items-center justify-between p-5">
                      <p className="font-display text-xl font-semibold text-navy-900">{d.name}</p>
                      <Link href={`/book?destination=${encodeURIComponent(d.name)}#booking-form`} className="text-sm font-semibold text-navy-700 hover:text-gold-600">Enquire →</Link>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {packages.length > 0 && (
            <div className="mb-20">
              <SectionHeading
                label="Travel Packages"
                title="Our travel packages"
                text="Pick a package or ask us to customise one for your group."
              />
              <ul className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {packages.map((p) => (
                  <PackageCard key={p.id} p={p} />
                ))}
              </ul>
            </div>
          )}

          <SectionHeading
            label="Travel Packages"
            title="Trips planned around you"
            text="Choose the kind of trip you want and tell us your destination. We'll check availability and plan the journey with you."
          />
          <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <TripType icon={<Wallet />} title="Budget trips" text="Affordable group trips without compromising on comfort." type="Budget trip" />
            <TripType icon={<Compass />} title="Package trips" text="Planned trips with your destinations and stops in one package." type="Package trip" />
            <TripType icon={<Sparkles />} title="Customized packages" text="Your route, your pace — we plan the journey with you." type="Customized package" />
            <TripType icon={<Users />} title="Family tours" text="Holidays and outings with the whole family." type="Family trip" />
            <TripType icon={<Heart />} title="Friends & group tours" text="Day outings and weekend getaways with your gang." type="Friends / group trip" />
            <TripType icon={<GraduationCap />} title="College trips" text="Excursions and study tours for student groups." type="College trip" />
            <TripType icon={<Church />} title="Pilgrimage tours" text="Temple circuits and devotional journeys across India." type="Pilgrimage / temple visit" />
            <TripType icon={<Plane />} title="Honeymoon trips" text="Comfortable private group travel for your celebration." type="Honeymoon trip" />
          </ul>
        </div>
      </section>

      {/* ---------------------------------------------------------- Why choose */}
      <section className="bg-navy-900 py-24 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading dark label="Why Choose Us" title="Travel the Alagu way" />
          <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Why icon={<Snowflake />} title="Brand-new A/C van" text="Travel in our new Force Urbania with roof-mounted air-conditioning." />
            <Why icon={<Users />} title="Room for 16" text="Individual high-back seats, so the whole group travels together." />
            <Why icon={<ShieldCheck />} title="Experienced drivers" text="Well-organised journeys with experienced drivers." />
            <Why icon={<Wallet />} title="Budget-friendly" text="Trips planned for families and friends, at budget-friendly prices." />
            <Why icon={<Calendar />} title="Flexible planning" text="Day trips or multi-day trips. Tell us your plan and dates." />
            <Why icon={<MapPin />} title="All-India enquiries" text="Outstation routes across India — planned from Dindigul with clear follow-up by phone or WhatsApp." />
          </ul>
        </div>
      </section>

      {/* -------------------------------------------------------------- Gallery */}
      <section id="gallery" className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <SectionHeading label="Gallery" title="Moments from the road" />
            {settings.instagram_url && (
              <a href={settings.instagram_url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 self-start rounded-full bg-gradient-to-r from-[#f58529] via-[#dd2a7b] to-[#8134af] px-6 py-3 font-semibold text-white shadow-card transition hover:opacity-90 md:self-auto">
                <InstagramIcon className="h-5 w-5" /> Follow @alagu_vacations
              </a>
            )}
          </div>
          <div className="mt-10"><Gallery items={gallery} /></div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ CTA */}
      <section className="px-4 pb-24 sm:px-6 lg:px-8">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-navy-800 bg-ornament px-6 py-14 text-center text-white sm:px-12 sm:py-20">
          <h2 className="font-display text-3xl font-semibold sm:text-5xl">Planning Your Next Journey?</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-white/80">Let Alagu Vacations make it memorable.</p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/book" className="inline-flex items-center justify-center gap-2 rounded-full bg-gold-500 px-8 py-4 font-semibold text-navy-950 transition hover:bg-gold-300">
              Book Your Trip <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            {wa && (
              <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 px-8 py-4 font-semibold transition hover:bg-white/10">
                <WhatsAppIcon className="h-5 w-5" /> Chat on WhatsApp
              </a>
            )}
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------- Contact */}
      <section id="contact" className="bg-white py-24">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <SectionHeading label="Contact" title="Talk to us" text="Call or WhatsApp to check availability for your dates. We're happy to help plan your route." />
            <ul className="mt-10 space-y-4">
              {settings.phone && (
                <ContactRow icon={<Phone />} label="Call us" value={formatPhone(settings.phone)} href={`tel:+${phoneDigits(settings.phone)}`} />
              )}
              {wa && <ContactRow icon={<WhatsAppIcon className="h-5 w-5" />} label="WhatsApp" value="Send us a message" href={wa} external />}
              {settings.instagram_url && <ContactRow icon={<InstagramIcon className="h-5 w-5" />} label="Instagram" value="@alagu_vacations" href={settings.instagram_url} external />}
              {(settings.address || settings.city) && (
                <ContactRow icon={<MapPin />} label="Location" value={[settings.address, settings.city].filter(Boolean).join(", ")} />
              )}
            </ul>
          </div>
          {settings.map_query && (
            <div className="overflow-hidden rounded-[2rem] shadow-card ring-1 ring-navy-100">
              <iframe
                title={`Map: ${settings.map_query}`}
                src={`https://maps.google.com/maps?q=${encodeURIComponent(settings.map_query)}&z=13&output=embed`}
                className="h-[380px] w-full lg:h-full lg:min-h-[420px]"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          )}
        </div>
      </section>
    </>
  );
}

/* ---------------------------------------------------------------- helpers */

function uniqueDestinations(packages: TravelPackage[]) {
  const map = new Map<string, string | null>();
  for (const p of packages) if (p.destination && !map.has(p.destination)) map.set(p.destination, p.image_url);
  return [...map].map(([name, image]) => ({ name, image }));
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <dt className="sr-only">{label}</dt>
      <dd className="font-display text-2xl font-semibold text-gold-300">{value}</dd>
      <dd className="mt-1 text-xs text-white/60">{label}</dd>
    </div>
  );
}

function SectionLabel({ children, dark }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span className="gold-rule" />
      <p className={`text-xs font-bold uppercase tracking-[0.22em] ${dark ? "text-gold-300" : "text-gold-600"}`}>{children}</p>
    </div>
  );
}

function SectionHeading({ label, title, text, dark }: { label: string; title: string; text?: string; dark?: boolean }) {
  return (
    <div className="max-w-2xl">
      <SectionLabel dark={dark}>{label}</SectionLabel>
      <h2 className={`mt-3 font-display text-3xl font-semibold leading-tight sm:text-4xl ${dark ? "text-white" : "text-navy-900"}`}>{title}</h2>
      {text && <p className={`mt-4 text-lg ${dark ? "text-white/70" : "text-muted"}`}>{text}</p>}
    </div>
  );
}

function Point({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <li className="flex gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold-100 text-gold-600 [&>svg]:h-5 [&>svg]:w-5" aria-hidden>{icon}</span>
      <span><strong className="block text-navy-900">{title}</strong><span className="text-sm text-muted">{text}</span></span>
    </li>
  );
}

function TripType({ icon, title, text, type }: { icon: React.ReactNode; title: string; text: string; type: string }) {
  return (
    <li className="group flex flex-col rounded-[1.5rem] bg-white p-6 shadow-card ring-1 ring-navy-100 transition hover:-translate-y-1 hover:shadow-lift">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-navy-800 text-gold-300 [&>svg]:h-6 [&>svg]:w-6" aria-hidden>{icon}</span>
      <h3 className="mt-5 font-display text-xl font-semibold text-navy-900">{title}</h3>
      <p className="mt-2 flex-1 text-sm text-muted">{text}</p>
      <Link href={`/book?trip_type=${encodeURIComponent(type)}#booking-form`} className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-navy-700 group-hover:text-gold-600">
        Enquire Now <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    </li>
  );
}

function PackageCard({ p }: { p: TravelPackage }) {
  return (
    <li className="flex flex-col overflow-hidden rounded-[1.5rem] bg-white shadow-card ring-1 ring-navy-100">
      <div className="relative aspect-[16/10] bg-navy-100">
        {p.image_url && <Image src={p.image_url} alt={p.title} fill sizes="(min-width:1024px) 33vw, 100vw" className="object-cover" />}
        {p.duration && <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-navy-900">{p.duration}</span>}
      </div>
      <div className="flex flex-1 flex-col p-6">
        {p.destination && <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gold-600"><MapPin className="h-3.5 w-3.5" aria-hidden />{p.destination}</p>}
        <h3 className="mt-2 font-display text-xl font-semibold text-navy-900">{p.title}</h3>
        {p.highlights.length > 0 && (
          <ul className="mt-3 space-y-1.5 text-sm text-muted">
            {p.highlights.slice(0, 5).map((h) => <li key={h} className="flex gap-2"><span className="text-gold-500">•</span>{h}</li>)}
          </ul>
        )}
        <div className="mt-auto pt-6">
          {p.price != null ? (
            <>
              <p className="text-xs text-muted">Starting from</p>
              <p className="font-display text-2xl font-semibold text-navy-900">₹{Number(p.price).toLocaleString("en-IN")}</p>
            </>
          ) : (
            <p className="text-sm text-muted">Price on request</p>
          )}
          {p.price_note && <p className="mt-1 text-xs text-muted">{p.price_note}</p>}
          <Link
            href={`/book?destination=${encodeURIComponent(p.destination ?? p.title)}&trip_type=Package%20trip#booking-form`}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-navy-800 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-navy-700"
          >
            Enquire Now <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </li>
  );
}

function Why({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <li className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-6 transition hover:border-gold-500/40 hover:bg-white/[0.07]">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold-500/15 text-gold-300 [&>svg]:h-5 [&>svg]:w-5" aria-hidden>{icon}</span>
      <h3 className="mt-4 font-display text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-white/70">{text}</p>
    </li>
  );
}

function ContactRow({ icon, label, value, href, external }: { icon: React.ReactNode; label: string; value: string; href?: string; external?: boolean }) {
  const inner = (
    <>
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-navy-100 text-navy-800 [&>svg]:h-5 [&>svg]:w-5" aria-hidden>{icon}</span>
      <span><span className="block text-xs uppercase tracking-wider text-muted">{label}</span><span className="font-semibold text-navy-900">{value}</span></span>
    </>
  );
  return (
    <li>
      {href ? (
        <a href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="flex items-center gap-4 rounded-2xl p-2 transition hover:bg-ivory">{inner}</a>
      ) : <div className="flex items-center gap-4 p-2">{inner}</div>}
    </li>
  );
}

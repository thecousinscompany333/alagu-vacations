"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useClientValue } from "@/lib/use-client-value";
import { ArrowRight, CalendarDays, MapPin, Navigation, Users } from "lucide-react";
import { TurnstileField } from "@/components/site/TurnstileField";
import { TRIP_TYPES } from "@/lib/types";
import { todayInIndia } from "@/lib/validation";

const field =
  "w-full rounded-xl border border-navy-100 bg-white px-3.5 py-3 text-sm text-ink placeholder:text-muted/70 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-300/50";
const label = "mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted";

type QuickBookingProps = {
  /** Earliest selectable date (Asia/Kolkata), from the server render. */
  minDate: string;
};

/** Hero widget: collects trip basics, then hands off to the full booking form. */
export function QuickBooking({ minDate }: QuickBookingProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const hasTurnstile = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
  const [captchaReady, setCaptchaReady] = useState(!hasTurnstile);
  // Computed after mount so prerendering never depends on the current time.
  const today = useClientValue(todayInIndia, minDate);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!captchaReady) {
      setError("Please complete the security check below.");
      return;
    }
    const fd = new FormData(e.currentTarget);
    const pickup = String(fd.get("pickup_date") ?? "");
    const ret = String(fd.get("return_date") ?? "");
    if (ret && pickup && ret < pickup) {
      setError("Return date must be on or after the start date.");
      return;
    }
    setError(null);
    const params = new URLSearchParams();
    for (const [k, v] of fd.entries()) if (typeof v === "string" && v.trim()) params.set(k, v.trim());
    router.push(`/book?${params.toString()}#booking-form`);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-[1.75rem] bg-white p-5 shadow-lift ring-1 ring-navy-100 sm:p-6"
      aria-label="Quick booking"
    >
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="font-display text-xl font-semibold text-navy-900">Plan your trip</p>
          <p className="text-sm text-muted">Tell us where you&apos;re headed. We&apos;ll check availability and call you back.</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <div className="lg:col-span-1">
          <label htmlFor="qb-pickup" className={label}><MapPin className="h-3.5 w-3.5" aria-hidden />Pickup</label>
          <input id="qb-pickup" name="pickup_location" placeholder="e.g. Dindigul" className={field} autoComplete="address-level2" />
        </div>
        <div className="lg:col-span-1">
          <label htmlFor="qb-dest" className={label}><Navigation className="h-3.5 w-3.5" aria-hidden />Destination</label>
          <input id="qb-dest" name="destination" placeholder="Where to?" className={field} />
        </div>
        <div>
          <label htmlFor="qb-start" className={label}><CalendarDays className="h-3.5 w-3.5" aria-hidden />Start date</label>
          <input id="qb-start" name="pickup_date" type="date" min={today} className={field} />
        </div>
        <div>
          <label htmlFor="qb-return" className={label}><CalendarDays className="h-3.5 w-3.5" aria-hidden />Return date</label>
          <input id="qb-return" name="return_date" type="date" min={today} className={field} />
        </div>
        <div>
          <label htmlFor="qb-pax" className={label}><Users className="h-3.5 w-3.5" aria-hidden />Passengers</label>
          <input id="qb-pax" name="passengers" type="number" min={1} max={80} inputMode="numeric" placeholder="e.g. 12" className={field} />
        </div>
        <div>
          <label htmlFor="qb-type" className={label}>Trip type</label>
          <select id="qb-type" name="trip_type" className={field} defaultValue="">
            <option value="">Select…</option>
            {TRIP_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className="mt-3 text-sm font-medium text-red-700" role="alert">{error}</p>}

      <div className="mt-4">
        <TurnstileField
          action="quick-booking"
          onSuccess={() => setCaptchaReady(true)}
          onExpire={() => setCaptchaReady(false)}
        />
      </div>

      <button
        type="submit"
        disabled={!captchaReady}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-navy-800 px-6 py-3.5 font-semibold text-white transition hover:bg-navy-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:float-right"
      >
        Check Availability <ArrowRight className="h-4 w-4" aria-hidden />
      </button>
      <div className="clear-both" />
    </form>
  );
}
